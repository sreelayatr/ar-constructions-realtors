/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - ADMIN COMMON SCRIPT
   ========================================================================== */

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:9100'
    : (window.location.origin.includes('onrender.com') ? '' : 'https://ar-constructions-realtors.onrender.com');

const API_BASE = `${API_BASE_URL}/api`;

// Initialize Global Socket.IO Real-time Connection
let socket = null;
if (typeof io !== 'undefined') {
    socket = API_BASE_URL ? io(API_BASE_URL, { withCredentials: true }) : io();
    socket.on('connect', () => {
        console.log('⚡ Socket.IO real-time connection active:', socket.id);
    });
}

// Web Audio API Notification Chime
function playNotificationChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5
        
        osc2.frequency.setValueAtTime(293.66, now);
        osc2.frequency.setValueAtTime(440.00, now + 0.12);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
    } catch (e) {
        console.log('Audio chime skipped by browser policy');
    }
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupMobileSidebar();
    
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin');
    
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await res.json();

        if (data.success && data.user) {
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
                return;
            }
            updateUserInfo(data.user);
        } else {
            if (!isLoginPage) {
                window.location.href = 'index.html';
            }
        }
    } catch (err) {
        console.error('Auth Check Error:', err);
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    }
});

// Mobile Sidebar Toggle
function setupMobileSidebar() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('admin-sidebar');
    let overlay = document.getElementById('mobile-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobile-overlay';
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

// Update Topbar User Information
function updateUserInfo(user) {
    const nameEl = document.getElementById('user-email');
    const avatarEl = document.getElementById('user-initial');
    if (nameEl) nameEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.email.charAt(0).toUpperCase();
}

// Logout Handler
async function handleLogout() {
    try {
        const res = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            window.location.href = 'index.html';
        } else {
            showToast('Logout failed. Please try again.', 'error');
        }
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = 'index.html';
    }
}

// Toast Notifications System
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-bell';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--primary-gold);"></i> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Utility: HTML Escaper
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Utility: Format Date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
