const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SiteSetting = require('../models/SiteSetting');
const { requireAuth } = require('../middleware/auth');

// Default fallback images and settings
const defaultSettings = {
    projects_hero_image: 'https://res.cloudinary.com/vht1gwyc/image/upload/v1788710917/2f023e90-2298-4519-9a66-e98a7af35ffe.png',
    workspace_slide_1_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    workspace_slide_2_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    workspace_slide_3_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-1-scaled.jpeg',
    workspace_slide_4_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-15-scaled.jpeg',
    workspace_intro_image: 'images/index_hero.png',
    workspace_apart_image: 'images/index_apart.png'
};

// In-memory store fallback when DB is disconnected
const inMemorySettings = { ...defaultSettings };

// Public: Get site setting by key (e.g. GET /api/settings/projects_hero_image)
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        if (mongoose.connection.readyState === 1) {
            const setting = await SiteSetting.findOne({ key });
            if (setting) {
                return res.json({
                    success: true,
                    key,
                    value: setting.value
                });
            }
        }

        const value = inMemorySettings[key] !== undefined ? inMemorySettings[key] : (defaultSettings[key] || '');
        res.json({
            success: true,
            key,
            value
        });
    } catch (error) {
        console.error('Get Setting Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve setting'
        });
    }
});

// Protected: Update or create site setting (POST/PUT /api/settings/:key)
router.post('/:key', requireAuth, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null) {
            return res.status(400).json({
                success: false,
                message: 'Value is required'
            });
        }

        inMemorySettings[key] = value;

        if (mongoose.connection.readyState === 1) {
            const updated = await SiteSetting.findOneAndUpdate(
                { key },
                { value },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Emit real-time update event to connected clients
            const io = req.app.get('io');
            if (io) {
                io.emit('site_setting_updated', { key, value });
            }

            return res.json({
                success: true,
                message: 'Setting updated successfully',
                data: updated
            });
        }

        // Real-time broadcast even in in-memory mode
        const io = req.app.get('io');
        if (io) {
            io.emit('site_setting_updated', { key, value });
        }

        res.json({
            success: true,
            message: 'Setting updated successfully',
            data: { key, value }
        });
    } catch (error) {
        console.error('Update Setting Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update setting'
        });
    }
});

module.exports = router;
