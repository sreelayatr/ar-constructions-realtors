# AR Constructions & Realtors – Full Stack Website & Admin System

Professional website and custom MongoDB Atlas-powered Admin System for **AR Constructions & Realtors**.

---

## 🏗️ Project Architecture

```
AR-Constructions-Realtors/
│
├── frontend/                     # Public Website (Static HTML/CSS/JS)
│   ├── index.html                # Workspace / Home Page
│   ├── about.html                # About Us
│   ├── contact.html              # Contact Form (Connected to Backend API)
│   ├── projects.html             # Public Portfolio Grid
│   ├── services.html             # Services Offered
│   ├── project-*.html            # Individual Project Showcase Pages (15 Pages)
│   ├── app.js                    # Public Site Logic & API Submission
│   ├── style.css                 # Public Site Stylesheet
│   └── images/
│       └── ar-logo.png           # Canonical AR Logo Asset
│
├── admin/                        # Luxury Admin Dashboard (subdomain target)
│   ├── index.html                # Admin Sign In Page
│   ├── dashboard.html            # Metrics & Executive Overview
│   ├── bookings.html             # Client Enquiries & Bookings Management
│   ├── projects.html             # Portfolio Project Management (CRUD)
│   ├── settings.html             # Account & Security Settings
│   ├── admin.css                 # Black / Gold Luxury Admin Theme
│   ├── admin.js                  # Core Session Guard & Toast Notifications
│   ├── dashboard.js              # Dashboard Data Fetching
│   ├── bookings.js               # Bookings Search/Filter/PATCH/DELETE
│   ├── projects.js               # Projects CRUD Modal Handlers
│   └── assets/
│       └── ar-logo.png           # Admin Logo Asset
│
├── backend/                      # Node.js + Express + Mongoose Backend
│   ├── server.js                 # Unified Server Entry Point
│   ├── package.json              # Backend Dependencies
│   ├── seed.js                   # Idempotent Database Seed Script
│   ├── .env                      # Production / Local Secrets (Git Ignored)
│   ├── .env.example              # Environment Variable Template
│   ├── .gitignore                # Git Exclude Rules
│   ├── config/
│   │   └── db.js                 # Mongoose Connection & Indexing
│   ├── models/
│   │   ├── User.js               # Admin User Schema with bcrypt
│   │   ├── Booking.js            # Client Enquiries Schema & Indexes
│   │   └── Project.js            # Portfolio Projects Schema & Indexes
│   ├── middleware/
│   │   └── auth.js               # HTTP-Only Session Auth Middleware
│   └── routes/
│       ├── auth.js               # Login, Logout, Me, Change-Password
│       ├── bookings.js           # Public POST & Protected CRUD
│       ├── projects.js           # Public GET & Protected CRUD
│       └── dashboard.js          # Aggregated Metrics API
│
└── README.md                     # Complete System Setup & Deployment Guide
```

---

## 🍃 MongoDB Atlas Setup Steps

To connect the system to your cloud database:

1. **Create a MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / sign in.
2. **Build a Cluster**:
   - Create a free or dedicated cluster (Shared M0 is sufficient to start).
3. **Create Database User**:
   - Go to **Database Access** under Security.
   - Click **Add New Database User**.
   - Select **Password Authentication**. Set a username and strong password.
   - Assign role **Read and write to any database**.
4. **Configure Network Access**:
   - Go to **Network Access** under Security.
   - Click **Add IP Address**.
   - Add your server/hosting IP, or `0.0.0.0/0` (Allow Access From Anywhere) for cloud hosts.
5. **Get Connection String**:
   - Go to **Clusters** -> **Connect** -> **Drivers**.
   - Copy your connection string in `mongodb+srv://` format.
   - Replace `<password>` with your database user password (ensure special characters are URL-encoded).

Example string:
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.mongodb.net/ar_constructions_realtors?retryWrites=true&w=majority
```

---

## ⚙️ Environment Variables Configuration

Create a file named `backend/.env` (do NOT commit this file to public repositories).

Copy the format from `backend/.env.example`:

```env
PORT=9100
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.mongodb.net/ar_constructions_realtors?retryWrites=true&w=majority
SESSION_SECRET=a_long_random_64_character_secret_string_here_2026
ADMIN_EMAIL=admin@arconstructionsandrealtors.com
ADMIN_PASSWORD=SetYourStrongAdminPasswordHere!
PUBLIC_ORIGIN=https://arconstructionsandrealtors.com
ADMIN_ORIGIN=https://admin.arconstructionsandrealtors.com
NODE_ENV=production
```

---

## 🚀 Local Quick Start & Testing

1. **Install Node.js** (v18 or higher recommended).
2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Seed Database (Initial Admin & Real Projects)**:
   ```bash
   npm run seed
   ```
4. **Start Server**:
   ```bash
   npm start
   ```
5. **Access Application**:
   - **Public Website**: `http://localhost:9100/`
   - **Admin Dashboard**: `http://localhost:9100/admin/`
   - **Login Credentials**: `admin@arconstructionsandrealtors.com` / `AdminSecurePassword123!` (or value configured in `.env`).

---

## 🌐 Production Subdomain & DNS Configuration

The admin panel is designed to run under the dedicated DNS subdomain:

`admin.arconstructionsandrealtors.com`

> [!IMPORTANT]
> Do NOT use ampersands (`&`) in DNS hostnames as they are invalid according to RFC 1035 standards.

### DNS Records to Create at your Domain Registrar (Cloudflare, GoDaddy, Namecheap):

| Record Type | Host / Name | Target / Points To | TTL |
| :--- | :--- | :--- | :--- |
| **A** or **CNAME** | `@` | Your Web Server IP / Host CNAME | Auto |
| **CNAME** | `www` | `@` | Auto |
| **A** or **CNAME** | `admin` | Your Backend/Admin Server IP | Auto |

---

## 🔒 Production Security Architecture

- **HTTP-Only Cookies**: Authentication credentials and sessions are strictly managed via server-side session cookies with `httpOnly=true` and `sameSite=lax`. Passwords are never exposed to browser `localStorage`.
- **Bcrypt Password Hashing**: Passwords are hashed using bcrypt with salt rounds before database storage.
- **Strict CORS & Helmet Security**: Origins are restricted to approved domains and common injection headers are sanitized.
- **Rate Limiting**: `/api/auth/login` limits failed login attempts to 5 requests per 15 minutes to prevent brute-force attacks.
- **No Secret Leakage**: Database URIs, passwords, and sensitive server errors are isolated on the server.

---

## 📄 API Reference Overview

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public (Rate Limited) | Authenticates admin and sets HTTP-only session cookie |
| `/api/auth/logout` | POST | Public | Invalidates session and clears cookie |
| `/api/auth/me` | GET | Protected | Returns authenticated admin profile |
| `/api/auth/change-password` | POST | Protected | Changes admin password |
| `/api/bookings` | POST | Public | Submits new client inquiry from contact form |
| `/api/bookings` | GET | Protected | Retrieves list of client inquiries (Search & Filter) |
| `/api/bookings/:id` | PATCH | Protected | Updates inquiry status (`pending`, `confirmed`, `completed`, `cancelled`) |
| `/api/bookings/:id` | DELETE | Protected | Deletes inquiry from MongoDB Atlas |
| `/api/projects` | GET | Public/Admin | Fetches portfolio projects |
| `/api/projects` | POST | Protected | Creates new portfolio project |
| `/api/projects/:id` | PATCH | Protected | Updates existing project details |
| `/api/projects/:id` | DELETE | Protected | Removes project from database |
| `/api/dashboard` | GET | Protected | Returns aggregate statistics and recent inquiries |
