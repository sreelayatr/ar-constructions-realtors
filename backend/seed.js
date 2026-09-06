require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');

const seedData = async () => {
    try {
        const connStr = process.env.MONGODB_URI;
        if (!connStr) {
            console.error('❌ MONGODB_URI is not configured in .env');
            process.exit(1);
        }

        console.log('🌱 Connecting to database for seeding...');
        await mongoose.connect(connStr);
        console.log('✅ Database connected.');

        // 1. Seed Admin User
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@arconstructionsandrealtors.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';

        const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
        if (!existingAdmin) {
            const passwordHash = await User.hashPassword(adminPassword);
            const adminUser = new User({
                email: adminEmail,
                passwordHash,
                role: 'admin'
            });
            await adminUser.save();
            console.log(`👤 Admin user created successfully: ${adminEmail}`);
        } else {
            console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
        }

        // 2. Seed Real Projects from Website
        const initialProjects = [
            {
                title: "Skyline Ranch",
                category: "Residential",
                location: "Thripoonithara, Kerala",
                description: "Bespoke luxury residential space designed for Mr Sijo & Festy (Thripoonithara).",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Sijo-Festy.jpg"]
            },
            {
                title: "Eza - Gold Thrissur",
                category: "Commercial",
                location: "Thrissur, Kerala",
                description: "Premium retail jewel showroom interior and space optimization for Mr Biju.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Mr-Biju-Eza-Gold-Thrissur.jpg"]
            },
            {
                title: "Navya Bake House",
                category: "Commercial",
                location: "Kerala",
                description: "Artisanal bakery aesthetic space crafted for Kurian & Hitha.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/Screenshot-211.png"]
            },
            {
                title: "Residence Thrissur (Pinto Francis)",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "Elegant modern residence architectural layout for Mr Pinto Francis.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0040.jpg"]
            },
            {
                title: "Residence Thrissur (Rajesh Francis)",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "High-end contemporary interior space for Mr Rajesh Francis.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0061.jpg"]
            },
            {
                title: "Residence Layout (Justin Raphael)",
                category: "Residential",
                location: "Kerala",
                description: "Custom space planning and interior design for Mr Justin Raphael.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2022/03/1.jpeg"]
            },
            {
                title: "Casablanca Apartment",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "Luxury high-rise apartment interior overhaul for Mr Joju.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/04/1.jpg"]
            },
            {
                title: "Residence Design (Bijoy Varghese)",
                category: "Residential",
                location: "Kerala",
                description: "Warm-toned aesthetic living room and interior design for Mr Bijoy Varghese.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/13.jpg"]
            },
            {
                title: "Modern Layout (Jino Jose)",
                category: "Residential",
                location: "Kerala",
                description: "Bespoke modern home layout and interior for Mr Jino Jose.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/DSC_0371.jpg"]
            },
            {
                title: "Sobha Saphire (Daison)",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "Classy luxury apartment styling for Mr Daison (Sobha Saphire).",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/IMG_9675-1.jpg"]
            },
            {
                title: "Residence Project (Dr Rajesh & Dr Anu)",
                category: "Residential",
                location: "Kerala",
                description: "Contemporary architectural home layout for Dr Rajesh & Dr Anu.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/4L8A9460.jpg"]
            },
            {
                title: "Sobha Jade (Girilal)",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "Sophisticated open-concept interior execution for Mr Girilal (Sobha Jade).",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/2L6A9378-3.jpg"]
            },
            {
                title: "Sobha Saphire (Anita)",
                category: "Residential",
                location: "Thrissur, Kerala",
                description: "Luxury interior design and finishing for Mrs Anita (Sobha Saphire).",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-13-2.jpg"]
            },
            {
                title: "Residence Design (Mejo Chittilappally)",
                category: "Residential",
                location: "Kerala",
                description: "Bespoke interior supervision and design execution for Mr Mejo Chittilappally.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-28-2.jpg"]
            },
            {
                title: "Residence Project (Antochan Manjaly)",
                category: "Residential",
                location: "Kerala",
                description: "Custom luxury residence layout and interior for Mr Antochan Manjaly.",
                status: "Completed",
                images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/Anto8.jpg"]
            }
        ];

        for (const projData of initialProjects) {
            const existingProj = await Project.findOne({ title: projData.title, location: projData.location });
            if (!existingProj) {
                await Project.create(projData);
                console.log(`🏢 Seeded project: ${projData.title} (${projData.location})`);
            }
        }

        console.log('🎉 Seeding complete successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seedData();
