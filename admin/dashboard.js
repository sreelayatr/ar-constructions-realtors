/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - DASHBOARD SCRIPT (REAL-TIME ENABLED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardMetrics();
    setupRealtimeDashboard();
});

// Setup Real-time WebSockets Listeners for Executive Dashboard
function setupRealtimeDashboard() {
    if (typeof socket !== 'undefined' && socket) {
        socket.on('new_booking', (booking) => {
            showToast(`🔔 New Live Inquiry: ${booking.name} (${booking.subject || 'General'})`, 'info');
            loadDashboardMetrics();
        });

        socket.on('refresh_metrics', () => {
            loadDashboardMetrics();
        });

        socket.on('booking_updated', (booking) => {
            loadDashboardMetrics();
        });

        socket.on('booking_deleted', () => {
            loadDashboardMetrics();
        });
    }
}

async function loadDashboardMetrics() {
    try {
        const res = await fetch('/api/dashboard', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (res.status === 401) {
            window.location.href = 'index.html';
            return;
        }

        const data = await res.json();

        if (data.success && data.data) {
            const metrics = data.data;

            // Update Counts with animation highlight
            updateMetricAnimated('metric-total-bookings', metrics.totalBookings || 0);
            updateMetricAnimated('metric-pending-bookings', metrics.pendingBookings || 0);
            updateMetricAnimated('metric-confirmed-bookings', metrics.confirmedBookings || 0);
            updateMetricAnimated('metric-total-projects', metrics.totalProjects || 0);

            // Render Recent Bookings Table
            renderRecentBookings(metrics.recentBookings || []);
        } else {
            showToast('Failed to load dashboard metrics', 'error');
        }
    } catch (err) {
        console.error('Error loading dashboard metrics:', err);
    }
}

function updateMetricAnimated(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (el.textContent !== String(newValue)) {
        el.textContent = newValue;
        el.style.transform = 'scale(1.2)';
        el.style.color = 'var(--primary-gold)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
            el.style.color = 'var(--text-primary)';
        }, 400);
    }
}

function renderRecentBookings(bookings) {
    const tbody = document.getElementById('recent-bookings-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No recent enquiries found in database.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const phoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
        const waLink = phoneClean ? `https://wa.me/${phoneClean}` : '#';

        return `
            <tr id="booking-row-${b._id}">
                <td><strong>${escapeHtml(b.name)}</strong></td>
                <td><a href="mailto:${escapeHtml(b.email)}" style="color: var(--text-primary); text-decoration: none;">${escapeHtml(b.email)}</a></td>
                <td>${b.phone ? escapeHtml(b.phone) : '<span style="color: var(--text-muted);">N/A</span>'}</td>
                <td>${escapeHtml(b.subject || 'General Inquiry')}</td>
                <td><span class="badge badge-${b.status}">${escapeHtml(b.status)}</span></td>
                <td>${formatDate(b.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn" title="View Details" onclick="viewBookingDetails('${b._id}')">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        ${phoneClean ? `
                            <a href="${waLink}" target="_blank" class="icon-btn whatsapp-btn" title="WhatsApp Customer">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewBookingDetails(id) {
    try {
        const res = await fetch(`/api/bookings/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
            const b = data.data;
            const content = document.getElementById('modal-detail-content');
            content.innerHTML = `
                <div style="display: grid; gap: 14px; margin-top: 10px;">
                    <div><strong>Customer Name:</strong> ${escapeHtml(b.name)}</div>
                    <div><strong>Email:</strong> ${escapeHtml(b.email)}</div>
                    <div><strong>Phone:</strong> ${escapeHtml(b.phone || 'N/A')}</div>
                    <div><strong>Subject:</strong> ${escapeHtml(b.subject || 'N/A')}</div>
                    <div><strong>Status:</strong> <span class="badge badge-${b.status}">${escapeHtml(b.status)}</span></div>
                    <div><strong>Submitted Date:</strong> ${formatDate(b.createdAt)}</div>
                    <div><strong>Source:</strong> ${escapeHtml(b.source || 'website-contact-form')}</div>
                    <hr style="border-color: var(--border-color); margin: 10px 0;">
                    <div><strong>Message:</strong></div>
                    <div style="background: var(--bg-input); padding: 14px; border-radius: 6px; white-space: pre-wrap; font-size: 0.9rem; color: var(--text-secondary); border: 1px solid var(--border-color);">${escapeHtml(b.message)}</div>
                </div>
            `;
            document.getElementById('detail-modal').classList.add('active');
        }
    } catch (err) {
        showToast('Error loading booking details', 'error');
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('active');
}
