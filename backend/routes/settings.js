const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SiteSetting = require('../models/SiteSetting');
const { requireAuth } = require('../middleware/auth');

// Default fallback images and settings
const defaultSettings = {
    projects_hero_image: 'https://res.cloudinary.com/vht1gwyc/image/upload/v1788710917/2f023e90-2298-4519-9a66-e98a7af35ffe.png',
    projects_section_title: 'Our Construction & Interior Projects Across Bengaluru',
    projects_section_desc: 'Explore our residential, commercial, construction, renovation and interior design projects completed by AR Constructions & Realtors across Bengaluru.',
    workspace_slide_1_image: 'https://res.cloudinary.com/vht1gwyc/image/upload/v1793202892/86f551ee-fbd4-4c62-9825-0d91ac87ff2b.png',
    workspace_slide_1_title: 'Construction & Real Estate Solutions Across Bengaluru',
    workspace_slide_1_subtitle: 'Residential & Commercial Construction Solutions',
    workspace_slide_2_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    workspace_slide_2_title: 'Bespoke Home Solutions',
    workspace_slide_2_subtitle: 'Transforming Dreams Into Elegant Environments',
    workspace_slide_3_image: 'https://res.cloudinary.com/vht1gwyc/image/upload/v1789670585/6595d5f4-7b42-4623-9f65-2244eb34e831.png',
    workspace_slide_3_title: 'Luxury is in the Details',
    workspace_slide_3_subtitle: 'Complete Design Packages Tailored for Homeowners',
    workspace_slide_4_image: 'https://res.cloudinary.com/vht1gwyc/image/upload/v1789670481/263e63f4-c553-40c2-a6f3-7af9067359dc.png',
    workspace_slide_4_title: 'Affordable Elegance',
    workspace_slide_4_subtitle: 'Delivering Exquisite Results with Professional Precision',
    workspace_intro_image: 'images/index_hero.png',
    workspace_apart_image: 'images/index_apart.png',

    // About Us Page Settings
    about_hero_image: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    about_knowus_image: 'images/about_knowus.jpg',
    about_gallery_image_1: 'images/about_bedroom.jpg',
    about_gallery_image_2: 'images/about_vanity.jpg',
    about_gallery_image_3: 'images/about_kitchen.jpg',
    about_gallery_image_4: 'images/about_sofa.jpg',
    about_gallery_image_5: 'images/about_cabinet.jpg',
    about_gallery_image_6: 'images/about_swing.jpg',
    about_gallery_image_7: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0059.jpg',
    about_gallery_image_8: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0057.jpg',
    about_gallery_image_9: 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0056.jpg',

    // Services Page Settings
    services_showcase_image_1: 'images/showcase-interior-1.jpg',
    services_showcase_image_2: 'images/showcase-interior-2.jpg',
    services_quote_image_1: 'https://spaceliftstudio.com/wp-content/uploads/2020/03/Anto7-2.jpg',
    services_quote_image_2: 'https://spaceliftstudio.com/wp-content/uploads/2020/03/24.jpg',

    // Wayanad De143Globe Project Modal Settings
    wayanad_modal_data: {
        badge_1: 'De Land of Tomorrow | WAYANAD',
        badge_2: 'Only 5 Units Available',
        title: 'WAYANAD De143Globe',
        tagline: '✨ Your Private Paradise Awaits in the Lap of Nature ✨',
        intro: 'Escape to luxury with this exclusive pool villa project in Thrishellery, Wayanad. An incredible investment opportunity and a perfect holiday home!',
        metric_1_label: 'Rental Income Potential',
        metric_1_value: 'Up to ₹15 Lakhs',
        metric_1_sub: '/ annum',
        metric_2_label: 'Villa Size',
        metric_2_value: '~2,000 SQFT',
        metric_2_sub: 'luxury living',
        metric_3_label: 'Exclusive Pricing',
        metric_3_value: 'Starts @ ₹69 Lakhs',
        metric_3_sub: 'per villa',
        highlights: [
            'Villa Size: ~2,000 SQFT of luxury living',
            'Low Density: Only 5 premium units spread across 1 acre',
            'Exclusive Pricing: Starts at just ₹69 Lakhs per villa'
        ],
        features: [
            '2 Bedrooms with Attached Bathrooms',
            'Open Living & Dining Area + Modern Kitchen Counter',
            'Fully Closed Ground Floor with elegant laterite walls & door',
            'Single Full-Length Glass frontage with spectacular views',
            'Private Front Deck + Pool Area (30 ft x 30 ft)',
            'Common Bathroom with both inside & outside access'
        ],
        destinations: [
            'Mountain Views',
            'Serene Environment',
            'Kottiyoor Mahashiva Temple',
            'Banasura Hills',
            'Edakkal Caves',
            'Heart Island'
        ],
        urgency_title: 'LIMITED OPPORTUNITY — ONLY 5 UNITS AVAILABLE!',
        urgency_sub: 'Invest in nature, invest in your future.',
        partners: 'A Project by DE143GLOBE • Partnered With AR Constructions and Realtors',
        contact_phone_1: '73538 77999',
        contact_phone_2: '98451 39034',
        whatsapp_number: '917353877999',
        whatsapp_text: 'Hi, I am interested in the WAYANAD De143Globe Luxury Pool Villa project.'
    }
};

// In-memory store fallback and high-speed cache
const inMemorySettings = { ...defaultSettings };
const settingsCache = new Map();

// Public: Get site setting by key (e.g. GET /api/settings/projects_hero_image)
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

        // Check in-memory fast cache
        if (settingsCache.has(key)) {
            return res.json({
                success: true,
                key,
                value: settingsCache.get(key)
            });
        }

        if (mongoose.connection.readyState === 1) {
            const setting = await SiteSetting.findOne({ key }).lean();
            if (setting) {
                settingsCache.set(key, setting.value);
                return res.json({
                    success: true,
                    key,
                    value: setting.value
                });
            }
        }

        const value = inMemorySettings[key] !== undefined ? inMemorySettings[key] : (defaultSettings[key] || '');
        settingsCache.set(key, value);
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
        settingsCache.set(key, value);

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
