// ============================================================
// AR CONSTRUCTIONS & REALTORS - BACKEND SERVER
// ============================================================

// IMPORTANT:
// Force Node.js to use public DNS servers.
// This fixes MongoDB Atlas SRV DNS resolution issues on some networks.
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const projectRoutes = require("./routes/projects");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");

// ============================================================
// APP INITIALIZATION
// ============================================================

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 9100;

// ============================================================
// SOCKET.IO
// ============================================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`⚡ Real-time client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Real-time client disconnected: ${socket.id}`);
  });
});

// ============================================================
// TRUST PROXY
// ============================================================

app.set("trust proxy", 1);

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  process.env.PUBLIC_ORIGIN || "https://arconstructionsandrealtors.com",
  process.env.ADMIN_ORIGIN || "https://admin.arconstructionsandrealtors.com",

  "https://www.arconstructionsandrealtors.com",
  "https://arconstructionsandrealtors.com",
  "https://admin.arconstructionsandrealtors.com",
  "https://ar-constructions-realtors.vercel.app",

  // Local development
  "http://localhost:9000",
  "http://localhost:9100",
  "http://127.0.0.1:9000",
  "http://127.0.0.1:9100",
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      // Allow all origins to ensure public contact form submissions succeed from any frontend URL
      return callback(null, true);
    },

    credentials: true,

    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================================
// MONGODB CONNECTION
// ============================================================

console.log("🔌 Initializing MongoDB Atlas connection...");

connectDB();

// ============================================================
// SESSION CONFIGURATION
// ============================================================

const sessionSecret =
  process.env.SESSION_SECRET ||
  "ar_constructions_realtors_default_secret_key";

const uri = process.env.MONGODB_URI;

// Determine whether MongoDB Atlas is configured
const isRealMongoUri =
  uri &&
  uri.startsWith("mongodb+srv://") &&
  !uri.includes("USERNAME:PASSWORD") &&
  !uri.includes("127.0.0.1") &&
  !uri.includes("localhost");

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || !!process.env.PORT || !!process.env.RENDER_SERVICE_ID;

// Session configuration
const sessionConfig = {
  name: "ar_admin_sid",

  secret: sessionSecret,

  resave: false,

  saveUninitialized: false,

  proxy: true,

  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
};

// ============================================================
// FIXED MONGODB SESSION STORE (Render Compatible)
// ============================================================

if (isRealMongoUri) {
  try {
    console.log("🗄️ MongoDB session store configured");

    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    });
  } catch (err) {
    console.warn(
      "⚠️ MongoStore fallback to MemoryStore:",
      err.message
    );
  }
} else {
  console.log("⚠️ MongoDB session store not enabled.");
}

app.use(session(sessionConfig));

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

// ============================================================
// STATIC DIRECTORIES
// ============================================================

const frontendPath = path.join(__dirname, "..", "frontend");
const adminPath = path.join(__dirname, "..", "admin");

// ============================================================
// ADMIN SUBDOMAIN ROUTING
// ============================================================

app.use((req, res, next) => {
  const host = req.headers.host || "";

  if (host.startsWith("admin.")) {
    return express.static(adminPath)(req, res, next);
  }

  next();
});

// ============================================================
// STATIC FILES
// ============================================================

// Admin website
app.use("/admin", express.static(adminPath));

// Public website
app.use("/", express.static(frontendPath));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "AR Constructions & Realtors Backend",
    realtime: "Socket.IO Enabled",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API 404 HANDLER
// ============================================================

app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// ============================================================
// ADMIN FALLBACK
// ============================================================

app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(adminPath, "index.html"));
});

// ============================================================
// PUBLIC WEBSITE FALLBACK
// ============================================================

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack || err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : err.message,
  });
});

// ============================================================
// START SERVER
// ============================================================

server.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------------------------");
  console.log(`🚀 AR Constructions Backend running on port ${PORT}`);
  console.log("⚡ Real-time Socket.IO connection active");
  console.log(`📌 Admin interface available at: /admin/`);
  console.log(`📌 Public website available at: /`);
  console.log("--------------------------------------------------");
});