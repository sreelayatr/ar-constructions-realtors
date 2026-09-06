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

        // 2. Initial projects seeding removed per request.
        console.log('🎉 Seeding complete successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seedData();
