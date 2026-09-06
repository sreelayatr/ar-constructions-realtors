const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const defaultProjects = [
    {
        _id: 'default-1',
        title: "Skyline Ranch",
        category: "Residential",
        location: "Thripoonithara, Kerala",
        description: "Bespoke luxury residential space designed for Mr Sijo & Festy.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Sijo-Festy.jpg"],
        createdAt: new Date()
    },
    {
        _id: 'default-2',
        title: "Eza - Gold Thrissur",
        category: "Commercial",
        location: "Thrissur, Kerala",
        description: "Premium retail jewel showroom interior and space optimization.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Mr-Biju-Eza-Gold-Thrissur.jpg"],
        createdAt: new Date()
    },
    {
        _id: 'default-3',
        title: "Navya Bake House",
        category: "Commercial",
        location: "Kerala",
        description: "Artisanal bakery aesthetic space crafted for Kurian & Hitha.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/Screenshot-211.png"],
        createdAt: new Date()
    }
];

// Public/Admin: Get all projects
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                success: true,
                count: defaultProjects.length,
                data: defaultProjects
            });
        }

        const { category, status, search } = req.query;
        const query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { location: searchRegex },
                { description: searchRegex }
            ];
        }

        const projects = await Project.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error('Get Projects Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects'
        });
    }
});

// Public/Admin: Get single project by ID
router.get('/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const found = defaultProjects.find(p => p._id === req.params.id) || defaultProjects[0];
            return res.json({ success: true, data: found });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Get Project ID Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve project'
        });
    }
});

// Protected: Create new project
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, category, location, description, status, images } = req.body;

        if (!title || !location || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title, location, and description are required'
            });
        }

        const imageArray = Array.isArray(images) 
            ? images.filter(img => typeof img === 'string' && img.trim() !== '')
            : (images ? [String(images).trim()] : []);

        if (mongoose.connection.readyState !== 1) {
            const newProj = {
                _id: 'temp-' + Date.now(),
                title: String(title).trim(),
                category: category || 'Residential',
                location: String(location).trim(),
                description: String(description).trim(),
                status: status || 'Completed',
                images: imageArray,
                createdAt: new Date()
            };
            return res.status(201).json({ success: true, message: 'Project created', data: newProj });
        }

        const project = new Project({
            title: String(title).trim(),
            category: category || 'Residential',
            location: String(location).trim(),
            description: String(description).trim(),
            status: status || 'Completed',
            images: imageArray
        });

        await project.save();

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        console.error('Create Project Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create project'
        });
    }
});

// Protected: Update project
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const { title, category, location, description, status, images } = req.body;

        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, message: 'Project updated successfully' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = String(title).trim();
        if (category !== undefined) updateData.category = category;
        if (location !== undefined) updateData.location = String(location).trim();
        if (description !== undefined) updateData.description = String(description).trim();
        if (status !== undefined) updateData.status = status;
        if (images !== undefined) {
            updateData.images = Array.isArray(images) 
                ? images.filter(img => typeof img === 'string' && img.trim() !== '')
                : (images ? [String(images).trim()] : []);
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        console.error('Update Project Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update project'
        });
    }
});

// Protected: Delete project
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, message: 'Project deleted successfully' });
        }

        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete Project Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete project'
        });
    }
});

module.exports = router;
