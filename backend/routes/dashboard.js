const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Project = require('../models/Project');
const { inMemoryBookings } = require('./bookings');
const { requireAuth } = require('../middleware/auth');

// Protected: Get dashboard statistics
router.get('/', requireAuth, async (req, res) => {
    try {
        let totalBookings = 0;
        let pendingBookings = 0;
        let confirmedBookings = 0;
        let completedBookings = 0;
        let cancelledBookings = 0;
        let recentBookings = [];

        let totalProjects = 10;
        let ongoingProjects = 0;
        let completedProjects = 10;
        let upcomingProjects = 0;

        if (mongoose.connection.readyState === 1) {
            [
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                cancelledBookings,
                totalProjects,
                ongoingProjects,
                completedProjects,
                upcomingProjects,
                recentBookings
            ] = await Promise.all([
                Booking.countDocuments(),
                Booking.countDocuments({ status: 'pending' }),
                Booking.countDocuments({ status: 'confirmed' }),
                Booking.countDocuments({ status: 'completed' }),
                Booking.countDocuments({ status: 'cancelled' }),
                Project.countDocuments(),
                Project.countDocuments({ status: 'Ongoing' }),
                Project.countDocuments({ status: 'Completed' }),
                Project.countDocuments({ status: 'Upcoming' }),
                Booking.find().sort({ createdAt: -1 }).limit(5)
            ]);
        } else {
            // Calculate metrics from in-memory repository
            const list = inMemoryBookings || [];
            totalBookings = list.length;
            pendingBookings = list.filter(b => b.status === 'pending').length;
            confirmedBookings = list.filter(b => b.status === 'confirmed').length;
            completedBookings = list.filter(b => b.status === 'completed').length;
            cancelledBookings = list.filter(b => b.status === 'cancelled').length;
            recentBookings = list.slice(0, 5);
        }

        res.json({
            success: true,
            data: {
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                cancelledBookings,
                totalProjects,
                ongoingProjects,
                completedProjects,
                upcomingProjects,
                recentBookings
            }
        });
    } catch (error) {
        console.error('Get Dashboard Metrics Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard metrics'
        });
    }
});

module.exports = router;
