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
            playNotificationChime();
            showToast(`🔔 New Live Inquiry: ${booking.name} (${booking.subject || 'General Inquiry'})`, 'info');
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
        const res = await fetch(`${API_BASE}/dashboard`, {
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
        let phoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
        if (phoneClean.length === 10) phoneClean = '91' + phoneClean;
        const clientName = b.name ? b.name.trim() : '';
        const clientSubject = b.subject ? b.subject.trim() : 'your inquiry';
        const waText = encodeURIComponent(`Hi ${clientName}, thank you for contacting AR Constructions & Realtors regarding "${clientSubject}". How can we assist you?`);
        const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=${waText}` : '#';

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
                        <a href="mailto:${escapeHtml(b.email)}?subject=Re:%20${encodeURIComponent(b.subject || 'AR Constructions Inquiry')}" target="_blank" class="icon-btn" title="Email Client">
                            <i class="fa-regular fa-envelope"></i>
                        </a>
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
        const res = await fetch(`${API_BASE}/bookings/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
            const b = data.data;
            let phoneClean = b.phone ? String(b.phone).replace(/\D/g, '') : '';
            if (phoneClean.startsWith('0') && phoneClean.length === 11) phoneClean = phoneClean.slice(1);
            if (phoneClean.length === 10) phoneClean = '91' + phoneClean;
            const clientName = b.name ? b.name.trim() : '';
            const clientSubject = b.subject ? b.subject.trim() : 'your inquiry';
            const waText = encodeURIComponent(`Hi ${clientName}, thank you for contacting AR Constructions & Realtors regarding "${clientSubject}". How can we assist you?`);
            const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=${waText}` : '';

            const content = document.getElementById('modal-detail-content');
            content.innerHTML = `
                <div style="display: grid; gap: 14px; margin-top: 10px;">
                    <div><strong>Customer Name:</strong> ${escapeHtml(b.name)}</div>
                    <div><strong>Email:</strong> <a href="mailto:${escapeHtml(b.email)}?subject=Re:%20${encodeURIComponent(b.subject || 'AR Constructions Inquiry')}" target="_blank" style="color: var(--primary-gold); text-decoration: none;">${escapeHtml(b.email)} <i class="fa-solid fa-envelope" style="font-size: 0.8rem; margin-left: 4px;"></i></a></div>
                    <div><strong>Phone:</strong> ${b.phone ? `<a href="tel:+${phoneClean}" style="color: var(--text-primary); text-decoration: none;">${escapeHtml(b.phone)}</a> ${phoneClean ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #25D366; color: #fff; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; text-decoration: none; margin-left: 8px; font-weight: 600;" title="Chat on WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}` : '<span style="color: var(--text-muted);">N/A</span>'}</div>
                    <div><strong>Subject:</strong> ${escapeHtml(b.subject || 'N/A')}</div>
                    <div><strong>Status:</strong> <span class="badge badge-${b.status}">${escapeHtml(b.status)}</span></div>
                    <div><strong>Submitted Date:</strong> ${formatDate(b.createdAt)}</div>
                    <div><strong>Source:</strong> ${escapeHtml(b.source || 'website-contact-form')}</div>
                    <hr style="border-color: var(--border-color); margin: 10px 0;">
                    <div><strong>Message Content:</strong></div>
                    <div style="background: var(--bg-input); padding: 14px; border-radius: 6px; white-space: pre-wrap; font-size: 0.9rem; color: var(--text-secondary); border: 1px solid var(--border-color);">${escapeHtml(b.message)}</div>
                    <div style="margin-top: 18px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                        <a href="mailto:${escapeHtml(b.email)}?subject=Re:%20${encodeURIComponent(b.subject || 'AR Constructions Inquiry')}" target="_blank" class="btn-gold" style="font-size: 0.85rem; padding: 10px 18px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                            <i class="fa-regular fa-envelope"></i> Send Email to Client
                        </a>
                        ${phoneClean ? `
                            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-admin" style="font-size: 0.85rem; padding: 10px 18px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: #ffffff !important; border-radius: var(--radius-sm); font-weight: 600; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35); transition: all 0.25s ease;" title="Send WhatsApp Message">
                                <i class="fa-brands fa-whatsapp" style="font-size: 1.15rem;"></i> Send WhatsApp Message
                            </a>
                        ` : `
                            <button type="button" class="btn-whatsapp-admin" style="font-size: 0.85rem; padding: 10px 18px; display: inline-flex; align-items: center; gap: 8px; background: #25D366; opacity: 0.6; cursor: not-allowed; color: #ffffff !important; border: none; border-radius: var(--radius-sm); font-weight: 600;" onclick="showToast('No phone number provided for this client', 'error')">
                                <i class="fa-brands fa-whatsapp" style="font-size: 1.15rem;"></i> Send WhatsApp Message
                            </button>
                        `}
                    </div>
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
