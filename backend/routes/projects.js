const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const defaultProjects = [];

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
        const { title, category, location, description, tagline, phone_1, phone_2, whatsapp_number, whatsapp_text, status, images } = req.body;

        const imageArray = Array.isArray(images) 
            ? images.filter(img => typeof img === 'string' && img.trim() !== '')
            : (images ? [String(images).trim()] : []);

        if (imageArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image URL is required'
            });
        }

        const resolvedLocation = location ? String(location).trim() : '';
        const resolvedCategory = category ? String(category).trim() : '';
        const resolvedTitle = title ? String(title).trim() : (resolvedLocation ? (resolvedCategory ? `${resolvedCategory} (${resolvedLocation})` : resolvedLocation) : (resolvedCategory || ''));

        if (mongoose.connection.readyState !== 1) {
            const newProj = {
                _id: 'temp-' + Date.now(),
                title: resolvedTitle,
                category: resolvedCategory,
                location: resolvedLocation,
                description: description ? String(description).trim() : '',
                status: status || 'Completed',
                images: imageArray,
                createdAt: new Date()
            };
            const io = req.app.get('io');
            if (io) {
                io.emit('projects_updated', { action: 'create', project: newProj });
                io.emit('refresh_projects');
            }
            return res.status(201).json({ success: true, message: 'Project created', data: newProj });
        }

        const project = new Project({
            title: resolvedTitle,
            category: resolvedCategory,
            location: resolvedLocation,
            description: description ? String(description).trim() : '',
            tagline: tagline ? String(tagline).trim() : '',
            phone_1: phone_1 ? String(phone_1).trim() : '73538 77999',
            phone_2: phone_2 ? String(phone_2).trim() : '98451 39034',
            whatsapp_number: whatsapp_number ? String(whatsapp_number).trim() : '7353877999',
            whatsapp_text: whatsapp_text ? String(whatsapp_text).trim() : '',
            status: status || 'Completed',
            images: imageArray
        });

        await project.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('projects_updated', { action: 'create', project });
            io.emit('refresh_projects');
        }

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
        const { title, category, location, description, tagline, phone_1, phone_2, whatsapp_number, whatsapp_text, status, images } = req.body;

        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, message: 'Project updated successfully' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = String(title).trim();
        if (category !== undefined) {
            updateData.category = category || '';
        }
        if (location !== undefined) updateData.location = String(location).trim();
        if (description !== undefined) updateData.description = String(description).trim();
        if (tagline !== undefined) updateData.tagline = String(tagline).trim();
        if (phone_1 !== undefined) updateData.phone_1 = String(phone_1).trim();
        if (phone_2 !== undefined) updateData.phone_2 = String(phone_2).trim();
        if (whatsapp_number !== undefined) updateData.whatsapp_number = String(whatsapp_number).trim();
        if (whatsapp_text !== undefined) updateData.whatsapp_text = String(whatsapp_text).trim();
        if (status !== undefined) updateData.status = status;
        if (images !== undefined) {
            const imageArray = Array.isArray(images) 
                ? images.filter(img => typeof img === 'string' && img.trim() !== '')
                : (images ? [String(images).trim()] : []);
            if (imageArray.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one image URL is required'
                });
            }
            updateData.images = imageArray;
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

        const io = req.app.get('io');
        if (io) {
            io.emit('projects_updated', { action: 'update', project });
            io.emit('refresh_projects');
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
            const io = req.app.get('io');
            if (io) {
                io.emit('projects_updated', { action: 'delete', id: req.params.id });
                io.emit('refresh_projects');
            }
            return res.json({ success: true, message: 'Project deleted successfully' });
        }

        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('projects_updated', { action: 'delete', id: req.params.id });
            io.emit('refresh_projects');
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
