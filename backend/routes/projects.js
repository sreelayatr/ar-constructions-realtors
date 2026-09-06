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
        createdAt: new Date('2026-02-01')
    },
    {
        _id: 'default-2',
        title: "Eza - Gold Thrissur",
        category: "Commercial",
        location: "Thrissur, Kerala",
        description: "Premium retail jewel showroom interior and space optimization for Mr Biju.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Mr-Biju-Eza-Gold-Thrissur.jpg"],
        createdAt: new Date('2026-01-15')
    },
    {
        _id: 'default-3',
        title: "Navya Bake House",
        category: "Commercial",
        location: "Kerala",
        description: "Artisanal bakery aesthetic space crafted for Kurian & Hitha.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/Screenshot-211.png"],
        createdAt: new Date('2024-10-14')
    },
    {
        _id: 'default-4',
        title: "Residence Thrissur (Pinto Francis)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Elegant modern residence architectural layout for Mr Pinto Francis.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0040.jpg"],
        createdAt: new Date('2024-10-14')
    },
    {
        _id: 'default-5',
        title: "Residence Thrissur (Rajesh Francis)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "High-end contemporary interior space for Mr Rajesh Francis.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0061.jpg"],
        createdAt: new Date('2024-10-14')
    },
    {
        _id: 'default-6',
        title: "Residence Layout (Justin Raphael)",
        category: "Residential",
        location: "Kerala",
        description: "Custom space planning and interior design for Mr Justin Raphael.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2022/03/1.jpeg"],
        createdAt: new Date('2022-03-01')
    },
    {
        _id: 'default-7',
        title: "Casablanca Apartment",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Luxury high-rise apartment interior overhaul for Mr Joju.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/04/1.jpg"],
        createdAt: new Date('2020-04-10')
    },
    {
        _id: 'default-8',
        title: "Residence Design (Bijoy Varghese)",
        category: "Residential",
        location: "Kerala",
        description: "Warm-toned aesthetic living room and interior design for Mr Bijoy Varghese.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/13.jpg"],
        createdAt: new Date('2020-03-25')
    },
    {
        _id: 'default-9',
        title: "Modern Layout (Jino Jose)",
        category: "Residential",
        location: "Kerala",
        description: "Bespoke modern home layout and interior for Mr Jino Jose.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/DSC_0371.jpg"],
        createdAt: new Date('2020-03-20')
    },
    {
        _id: 'default-10',
        title: "Sobha Saphire (Daison)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Classy luxury apartment styling for Mr Daison (Sobha Saphire).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/IMG_9675-1.jpg"],
        createdAt: new Date('2020-03-18')
    },
    {
        _id: 'default-11',
        title: "Residence Project (Dr Rajesh & Dr Anu)",
        category: "Residential",
        location: "Kerala",
        description: "Contemporary architectural home layout for Dr Rajesh & Dr Anu.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/4L8A9460.jpg"],
        createdAt: new Date('2020-03-15')
    },
    {
        _id: 'default-12',
        title: "Sobha Jade (Girilal)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Sophisticated open-concept interior execution for Mr Girilal (Sobha Jade).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/2L6A9378-3.jpg"],
        createdAt: new Date('2020-03-12')
    },
    {
        _id: 'default-13',
        title: "Sobha Saphire (Anita)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Luxury interior design and finishing for Mrs Anita (Sobha Saphire).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-13-2.jpg"],
        createdAt: new Date('2020-03-10')
    },
    {
        _id: 'default-14',
        title: "Residence Design (Mejo Chittilappally)",
        category: "Residential",
        location: "Kerala",
        description: "Bespoke interior supervision and design execution for Mr Mejo Chittilappally.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-28-2.jpg"],
        createdAt: new Date('2020-03-08')
    },
    {
        _id: 'default-15',
        title: "Residence Project (Antochan Manjaly)",
        category: "Residential",
        location: "Kerala",
        description: "Custom luxury residence layout and interior for Mr Antochan Manjaly.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/Anto8.jpg"],
        createdAt: new Date('2020-03-05')
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
            defaultProjects.unshift(newProj);
            req.app.get('io')?.emit('project_created', newProj);
            req.app.get('io')?.emit('projects_changed');
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
        req.app.get('io')?.emit('project_created', project);
        req.app.get('io')?.emit('projects_changed');

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
            const index = defaultProjects.findIndex(p => p._id === req.params.id);
            if (index !== -1) {
                if (title !== undefined) defaultProjects[index].title = String(title).trim();
                if (category !== undefined) defaultProjects[index].category = category;
                if (location !== undefined) defaultProjects[index].location = String(location).trim();
                if (description !== undefined) defaultProjects[index].description = String(description).trim();
                if (status !== undefined) defaultProjects[index].status = status;
                if (images !== undefined) defaultProjects[index].images = Array.isArray(images) ? images : [images];
            }
            req.app.get('io')?.emit('projects_changed');
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

        req.app.get('io')?.emit('project_updated', project);
        req.app.get('io')?.emit('projects_changed');

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
            const index = defaultProjects.findIndex(p => p._id === req.params.id);
            if (index !== -1) defaultProjects.splice(index, 1);
            req.app.get('io')?.emit('projects_changed');
            return res.json({ success: true, message: 'Project deleted successfully' });
        }

        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        req.app.get('io')?.emit('project_deleted', { id: req.params.id });
        req.app.get('io')?.emit('projects_changed');

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
