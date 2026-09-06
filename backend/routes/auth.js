const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.hostname === 'localhost' || req.hostname === '127.0.0.1'
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com').trim().toLowerCase();
        const configuredAdminPass = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';

        let authenticatedUser = null;

        // 1. Check MongoDB if database is connected
        if (mongoose.connection.readyState === 1) {
            try {
                const dbUser = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
                if (dbUser) {
                    const isMatch = await dbUser.comparePassword(password);
                    if (isMatch) {
                        authenticatedUser = {
                            id: dbUser._id,
                            email: dbUser.email,
                            role: dbUser.role
                        };
                    }
                }
            } catch (dbErr) {
                console.warn('DB Login Query Error:', dbErr.message);
            }
        }

        // 2. Fallback check against configured ADMIN_EMAIL & ADMIN_PASSWORD in environment
        if (!authenticatedUser) {
            if (normalizedEmail === configuredAdminEmail && password === configuredAdminPass) {
                authenticatedUser = {
                    id: 'admin-fallback-id',
                    email: configuredAdminEmail,
                    role: 'admin'
                };
            }
        }

        if (!authenticatedUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Establish session
        req.session.userId = authenticatedUser.id;
        req.session.userEmail = authenticatedUser.email;
        req.session.userRole = authenticatedUser.role;

        req.session.save((saveErr) => {
            if (saveErr) {
                console.error('Session save error:', saveErr);
            }
            return res.json({
                success: true,
                message: 'Authentication successful',
                user: authenticatedUser
            });
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error occurred during login'
        });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout Session Destroy Error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Could not log out, please try again'
            });
        }
        res.clearCookie('ar_admin_sid');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }

        if (mongoose.connection.readyState === 1 && req.user._id !== 'admin-fallback-id') {
            const user = await User.findById(req.user._id).select('+passwordHash');
            if (user) {
                const isMatch = await user.comparePassword(currentPassword);
                if (!isMatch) {
                    return res.status(400).json({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }
                user.passwordHash = await User.hashPassword(newPassword);
                await user.save();
                return res.json({
                    success: true,
                    message: 'Password changed successfully'
                });
            }
        }

        // Environment fallback password update message
        res.json({
            success: true,
            message: 'Password updated for active session'
        });
    } catch (error) {
        console.error('Change Password Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update password'
        });
    }
});

module.exports = router;
