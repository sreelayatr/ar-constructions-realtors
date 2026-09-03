const mongoose = require('mongoose');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Session expired or invalid'
            });
        }

        // Check fallback session user (when database is disconnected or setup mode)
        if (req.session.userId === 'admin-fallback-id') {
            req.user = {
                _id: 'admin-fallback-id',
                email: req.session.userEmail || process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com',
                role: 'admin',
                createdAt: new Date()
            };
            return next();
        }

        // Database connected: Query Mongoose User
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(req.session.userId);
            if (!user) {
                req.session.destroy(() => {});
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Account not found'
                });
            }
            req.user = user;
            return next();
        }

        // Fallback user if database temporarily unavailable
        req.user = {
            _id: req.session.userId,
            email: req.session.userEmail || process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com',
            role: 'admin',
            createdAt: new Date()
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

module.exports = { requireAuth };
