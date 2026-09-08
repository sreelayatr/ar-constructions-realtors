const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken } = require('../utils/token');

const requireAuth = async (req, res, next) => {
    try {
        let userId = null;
        let userEmail = null;
        let userRole = null;

        // 1. Check Authorization header (Bearer Token - works on mobile with 3rd-party cookie blocking)
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            const decoded = verifyToken(token);
            if (decoded) {
                userId = decoded.userId;
                userEmail = decoded.userEmail;
                userRole = decoded.userRole;
            }
        }

        // 2. Fallback to session cookie (for desktop browsers)
        if (!userId && req.session && req.session.userId) {
            userId = req.session.userId;
            userEmail = req.session.userEmail;
            userRole = req.session.userRole;
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Session expired or invalid'
            });
        }

        // Check fallback session user (when database is disconnected or setup mode)
        if (userId === 'admin-fallback-id') {
            req.user = {
                _id: 'admin-fallback-id',
                email: userEmail || process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com',
                role: userRole || 'admin',
                createdAt: new Date()
            };
            return next();
        }

        // Database connected: Query Mongoose User
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(userId);
            if (!user) {
                if (req.session) req.session.destroy(() => {});
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
            _id: userId,
            email: userEmail || process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com',
            role: userRole || 'admin',
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
