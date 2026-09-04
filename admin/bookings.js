/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - BOOKINGS MANAGEMENT SCRIPT (REAL-TIME ENABLED)
   ========================================================================== */

let searchTimeout = null;
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBookings();
    setupRealtimeBookings();
});

// Real-time Socket.IO Listeners for Bookings Page
function setupRealtimeBookings() {
    if (typeof socket !== 'undefined' && socket) {
        socket.on('new_booking', (booking) => {
            playNotificationChime();
            showToast(`🔔 New Live Inquiry: ${booking.name} (${booking.subject || 'General Inquiry'})`, 'info');
            
            const tbody = document.getElementById('bookings-tbody');
            if (tbody) {
                const emptyMsg = tbody.querySelector('td[colspan]');
                if (emptyMsg) tbody.innerHTML = '';

                const existingRow = document.getElementById(`booking-row-${booking._id}`);
                if (!existingRow) {
                    const temp = document.createElement('tbody');
                    temp.innerHTML = createBookingRowHtml(booking, true);
                    tbody.insertBefore(temp.firstElementChild, tbody.firstElementChild);
                } else {
                    loadBookings();
                }
            }
        });

        socket.on('booking_updated', (updatedBooking) => {
            const row = document.getElementById(`booking-row-${updatedBooking._id}`);
            if (row) {
                const temp = document.createElement('tbody');
                temp.innerHTML = createBookingRowHtml(updatedBooking, true);
                row.replaceWith(temp.firstElementChild);
            } else {
                loadBookings();
            }
        });

        socket.on('booking_deleted', ({ id }) => {
            const row = document.getElementById(`booking-row-${id}`);
            if (row) {
                row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';
                setTimeout(() => row.remove(), 400);
            }
        });
    }
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadBookings();
    }, 350);
}

async function loadBookings() {
    const status = document.getElementById('status-filter').value;
    const search = document.getElementById('search-input').value;

    let url = `/api/bookings?status=${encodeURIComponent(status)}`;
    if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
    }

    try {
        const res = await fetch(url, { credentials: 'include' });

        if (res.status === 401) {
            window.location.href = 'index.html';
            return;
        }

        const data = await res.json();

        if (data.success) {
            renderBookingsTable(data.data || []);
        } else {
            showToast('Failed to load bookings', 'error');
        }
    } catch (err) {
        console.error('Error fetching bookings:', err);
    }
}

function createBookingRowHtml(b, isNew = false) {
    const phoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
    const waLink = phoneClean ? `https://wa.me/${phoneClean}` : '#';
    const highlightClass = isNew ? 'row-highlight-new' : '';

    return `
        <tr id="booking-row-${b._id}" class="${highlightClass}">
            <td><strong>${escapeHtml(b.name)}</strong></td>
            <td><a href="mailto:${escapeHtml(b.email)}" style="color: var(--text-primary); text-decoration: none;">${escapeHtml(b.email)}</a></td>
            <td>${b.phone ? escapeHtml(b.phone) : '<span style="color: var(--text-muted);">N/A</span>'}</td>
            <td>${escapeHtml(b.subject || 'General Inquiry')}</td>
            <td>
                <select class="filter-select" style="padding: 4px 8px; font-size: 0.8rem;" onchange="updateBookingStatus('${b._id}', this.value)">
                    <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${formatDate(b.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn" title="View Details" onclick="viewBookingDetails('${b._id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <a href="mailto:${escapeHtml(b.email)}?subject=Re:%20${encodeURIComponent(b.subject || 'AR Constructions Inquiry')}" class="icon-btn" title="Email Client">
                        <i class="fa-regular fa-envelope"></i>
                    </a>
                    ${phoneClean ? `
                        <a href="${waLink}" target="_blank" class="icon-btn whatsapp-btn" title="WhatsApp Client">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    ` : ''}
                    <button class="icon-btn delete-btn" title="Delete Booking" onclick="promptDeleteBooking('${b._id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No bookings found matching your search criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(b => createBookingRowHtml(b)).join('');
}

async function updateBookingStatus(id, newStatus) {
    try {
        const res = await fetch(`/api/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();

        if (data.success) {
            showToast(`Booking status updated to ${newStatus}`, 'success');
        } else {
            showToast(data.message || 'Failed to update status', 'error');
            loadBookings();
        }
    } catch (err) {
        console.error('Error updating status:', err);
        showToast('Server error while updating status', 'error');
        loadBookings();
    }
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
                    <div><strong>Form Source:</strong> ${escapeHtml(b.source || 'website-contact-form')}</div>
                    <hr style="border-color: var(--border-color); margin: 10px 0;">
                    <div><strong>Message Content:</strong></div>
                    <div style="background: var(--bg-input); padding: 14px; border-radius: 6px; white-space: pre-wrap; font-size: 0.9rem; color: var(--text-secondary); border: 1px solid var(--border-color);">${escapeHtml(b.message)}</div>
                </div>
            `;
            document.getElementById('detail-modal').classList.add('active');
        }
    } catch (err) {
        showToast('Error loading details', 'error');
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

function promptDeleteBooking(id) {
    currentDeleteId = id;
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.onclick = () => executeDeleteBooking(id);
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    currentDeleteId = null;
    document.getElementById('delete-modal').classList.remove('active');
}

async function executeDeleteBooking(id) {
    try {
        const res = await fetch(`/api/bookings/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Booking deleted successfully', 'success');
            closeDeleteModal();
            loadBookings();
        } else {
            showToast(data.message || 'Failed to delete booking', 'error');
        }
    } catch (err) {
        console.error('Error deleting booking:', err);
        showToast('Server error while deleting booking', 'error');
    }
}
