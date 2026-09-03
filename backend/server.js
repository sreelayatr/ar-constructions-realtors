require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const projectRoutes = require('./routes/projects');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9100;

// Initialize Socket.IO for real-time updates across admin dashboard
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true
    }
});

// Attach io instance to app
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`⚡ Real-time client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔌 Real-time client disconnected: ${socket.id}`);
    });
});

// Trust reverse proxies
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
    contentSecurityPolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
    process.env.PUBLIC_ORIGIN || 'https://arconstructionsandrealtors.com',
    process.env.ADMIN_ORIGIN || 'https://admin.arconstructionsandrealtors.com',
    'https://www.arconstructionsandrealtors.com',
    'https://arconstructionsandrealtors.com',
    'https://admin.arconstructionsandrealtors.com',
    'http://localhost:9000',
    'http://localhost:9100',
    'http://127.0.0.1:9000',
    'http://127.0.0.1:9100'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection Init
connectDB();

// Session Middleware
const sessionSecret = process.env.SESSION_SECRET || 'ar_constructions_realtors_default_secret_key';
const uri = process.env.MONGODB_URI;
const isRealMongoUri = uri && !uri.includes('USERNAME:PASSWORD') && !uri.includes('127.0.0.1');

const sessionConfig = {
    name: 'ar_admin_sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
};

if (isRealMongoUri) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: uri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60
    });
}

app.use(session(sessionConfig));

// Serve API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static Asset Directories
const frontendPath = path.join(__dirname, '..', 'frontend');
const adminPath = path.join(__dirname, '..', 'admin');

// Host-based routing middleware for admin subdomain vs main frontend
app.use((req, res, next) => {
    const host = req.headers.host || '';
    if (host.startsWith('admin.')) {
        return express.static(adminPath)(req, res, next);
    }
    next();
});

// Explicit Static Routes
app.use('/admin', express.static(adminPath));
app.use('/', express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'AR Constructions & Realtors Backend',
        realtime: 'Socket.IO Enabled',
        timestamp: new Date().toISOString()
    });
});

// Centralized 404 for API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.originalUrl} not found`
    });
});

// Admin fallback routing
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
});

// Public fallback routing
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack || err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'An internal server error occurred' 
            : err.message
    });
});

server.listen(PORT, () => {
    console.log(`🚀 AR Constructions Backend running on http://localhost:${PORT}`);
    console.log(`⚡ Real-time Socket.IO connection active`);
    console.log(`📌 Admin interface available at: http://localhost:${PORT}/admin/`);
    console.log(`📌 Public website available at: http://localhost:${PORT}/`);
});
