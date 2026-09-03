const mongoose = require('mongoose');

const connectDB = async () => {
    const connStr = process.env.MONGODB_URI;

    if (!connStr || connStr.includes('USERNAME:PASSWORD') || connStr.includes('127.0.0.1')) {
        console.warn('------------------------------------------------------------------');
        console.warn('⚠️ MONGODB_URI is not configured with real MongoDB Atlas credentials.');
        console.warn('👉 Please set MONGODB_URI in backend/.env to connect to your Atlas Cluster.');
        console.warn('Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ar_constructions');
        console.warn('------------------------------------------------------------------');
        return null;
    }

    try {
        const sanitizedUri = connStr.replace(/\/\/(.*):(.*)@/, '//***:***@');
        console.log(`🔌 Connecting to MongoDB Atlas: ${sanitizedUri}`);

        const conn = await mongoose.connect(connStr, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / ${conn.connection.name}`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected.');
        });

        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Attempt Failed:', error.message);
        console.warn('👉 Please verify your MONGODB_URI connection string and Network Access in MongoDB Atlas.');
        return null;
    }
};

module.exports = connectDB;
