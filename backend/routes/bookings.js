const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { requireAuth } = require('../middleware/auth');

// Shared memory store for fallback when MongoDB Atlas connection is pending
const inMemoryBookings = [
    {
        _id: 'bk-sample-1',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        subject: 'Luxury Villa Design Inquiry',
        message: 'Hello AR Constructions team, I would like to schedule a consultation for a 4BHK luxury villa layout in Bangalore.',
        status: 'pending',
        source: 'website-contact-form',
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2)
    }
];

// Public: Submit new enquiry/booking from website form
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message, source } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone number are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const bookingData = {
            _id: 'bk-' + Date.now(),
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            phone: phone ? String(phone).trim() : '',
            subject: subject ? String(subject).trim() : 'General Inquiry',
            message: String(message).trim(),
            status: 'pending',
            source: source ? String(source).trim() : 'website-contact-form',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Always save to memory store
        inMemoryBookings.unshift(bookingData);

        // Save to MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            try {
                const newBooking = new Booking({
                    name: bookingData.name,
                    email: bookingData.email,
                    phone: bookingData.phone,
                    subject: bookingData.subject,
                    message: bookingData.message,
                    status: 'pending',
                    source: bookingData.source
                });
                const saved = await newBooking.save();
                bookingData._id = saved._id.toString();
            } catch (dbErr) {
                console.warn('MongoDB save warning:', dbErr.message);
            }
        }

        console.log(`📩 [REAL-TIME] New Customer Booking Received: ${bookingData.name} (${bookingData.email})`);

        // Emit real-time Socket.IO event to all connected admin dashboards instantly!
        const io = req.app.get('io');
        if (io) {
            io.emit('new_booking', bookingData);
            io.emit('refresh_metrics');
        }

        res.status(201).json({
            success: true,
            message: 'Your inquiry has been received! Our team will contact you shortly.',
            data: {
                id: bookingData._id,
                createdAt: bookingData.createdAt
            }
        });
    } catch (error) {
        console.error('Create Booking Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to process inquiry. Please try again later.'
        });
    }
});

// Protected: Get all bookings (with search & filter)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status, search, limit = 100, page = 1 } = req.query;

        let bookingsList = [];
        let totalCount = 0;

        if (mongoose.connection.readyState === 1) {
            const query = {};
            if (status && status !== 'all') query.status = status;
            if (search) {
                const searchRegex = new RegExp(search.trim(), 'i');
                query.$or = [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { subject: searchRegex },
                    { message: searchRegex }
                ];
            }
            const parsedLimit = parseInt(limit, 10);
            const parsedPage = parseInt(page, 10);
            const skip = (parsedPage - 1) * parsedLimit;

            [bookingsList, totalCount] = await Promise.all([
                Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
                Booking.countDocuments(query)
            ]);
        } else {
            // Memory Store Filter & Search
            let filtered = [...inMemoryBookings];
            if (status && status !== 'all') {
                filtered = filtered.filter(b => b.status === status);
            }
            if (search) {
                const term = search.trim().toLowerCase();
                filtered = filtered.filter(b => 
                    b.name.toLowerCase().includes(term) ||
                    b.email.toLowerCase().includes(term) ||
                    (b.phone && b.phone.toLowerCase().includes(term)) ||
                    (b.subject && b.subject.toLowerCase().includes(term)) ||
                    b.message.toLowerCase().includes(term)
                );
            }
            bookingsList = filtered;
            totalCount = filtered.length;
        }

        res.json({
            success: true,
            count: bookingsList.length,
            total: totalCount,
            page: parseInt(page, 10),
            pages: 1,
            data: bookingsList
        });
    } catch (error) {
        console.error('Get Bookings Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
});

// Protected: Get single booking by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const id = String(req.params.id);

        if (mongoose.connection.readyState === 1) {
            const booking = await Booking.findById(id);
            if (booking) {
                return res.json({ success: true, data: booking });
            }
        }

        const memBooking = inMemoryBookings.find(b => String(b._id) === id);
        if (!memBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: memBooking
        });
    } catch (error) {
        console.error('Get Booking ID Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve booking'
        });
    }
});

// Protected: Update booking status
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Update memory store
        const memIndex = inMemoryBookings.findIndex(b => String(b._id) === id);
        if (memIndex !== -1) {
            inMemoryBookings[memIndex].status = status;
            inMemoryBookings[memIndex].updatedAt = new Date();
        }

        // Update MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            try {
                await Booking.findByIdAndUpdate(id, { status }, { new: true });
            } catch (err) {}
        }

        const updatedData = memIndex !== -1 ? inMemoryBookings[memIndex] : { _id: id, status };

        // Emit real-time Socket.IO event to all admin clients
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated', updatedData);
            io.emit('refresh_metrics');
        }

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            data: updatedData
        });
    } catch (error) {
        console.error('Update Booking Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status'
        });
    }
});

// Protected: Delete booking
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const id = String(req.params.id);

        // Delete from memory store
        const memIndex = inMemoryBookings.findIndex(b => String(b._id) === id);
        if (memIndex !== -1) {
            inMemoryBookings.splice(memIndex, 1);
        }

        // Delete from MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            try {
                await Booking.findByIdAndDelete(id);
            } catch (err) {}
        }

        // Emit real-time Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_deleted', { id });
            io.emit('refresh_metrics');
        }

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete Booking Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete booking'
        });
    }
});

module.exports = router;
module.exports.inMemoryBookings = inMemoryBookings;
