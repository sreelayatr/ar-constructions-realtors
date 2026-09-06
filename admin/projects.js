/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - PROJECTS MANAGEMENT SCRIPT
   ========================================================================== */

let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();

    // Listen to real-time WebSocket events from backend
    if (typeof socket !== 'undefined' && socket) {
        socket.on('projects_changed', () => loadProjects());
        socket.on('project_deleted', ({ id }) => {
            removeRowFromDom(id);
            loadProjects();
        });
        socket.on('project_created', () => loadProjects());
        socket.on('project_updated', () => loadProjects());
    }
});

function debounceProjectSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadProjects();
    }, 350);
}

async function loadProjects() {
    const category = document.getElementById('category-filter').value;
    const status = document.getElementById('status-filter').value;
    const search = document.getElementById('project-search').value.trim();

    let url = `${API_BASE}/projects?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
            renderProjectsTable(data.data);
        } else {
            showToast(data.message || 'Failed to load projects', 'error');
            renderProjectsTable([]);
        }
    } catch (err) {
        console.error('Error loading projects:', err);
        showToast('Server connection error while loading projects', 'error');
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    if (!projects || projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 35px 20px; font-size: 0.95rem;">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    No projects found in database.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = projects.map(p => {
        const thumb = (p.images && p.images.length > 0 && p.images[0].trim()) 
            ? p.images[0] 
            : 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80';
        
        const badgeClass = p.status === 'Completed' ? 'badge-completed' : (p.status === 'Ongoing' ? 'badge-ongoing' : 'badge-upcoming');

        return `
            <tr data-project-id="${escapeHtml(p._id)}">
                <td>
                    <img src="${escapeHtml(thumb)}" alt="Thumb" style="width: 54px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80'">
                </td>
                <td><strong>${escapeHtml(p.title)}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(p.category)}</span></td>
                <td>${escapeHtml(p.location)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(p.status)}</span></td>
                <td>${formatDate(p.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn" title="Edit Project" onclick="openEditProjectModal('${escapeHtml(p._id)}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="icon-btn delete-btn" title="Delete Project" onclick="promptDeleteProject('${escapeHtml(p._id)}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function removeRowFromDom(id) {
    const row = document.querySelector(`tr[data-project-id="${id}"]`);
    if (row) {
        row.remove();
    }
}

function openAddProjectModal() {
    document.getElementById('project-id').value = '';
    document.getElementById('project-form').reset();
    document.getElementById('modal-project-title').textContent = 'Add New Project';
    document.getElementById('project-modal').classList.add('active');
}

async function openEditProjectModal(id) {
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.data) {
            const p = data.data;
            document.getElementById('project-id').value = p._id;
            document.getElementById('p-title').value = p.title || '';
            document.getElementById('p-category').value = p.category || 'Residential';
            document.getElementById('p-status').value = p.status || 'Completed';
            document.getElementById('p-location').value = p.location || '';
            document.getElementById('p-description').value = p.description || '';
            document.getElementById('p-images').value = (p.images || []).join('\n');

            document.getElementById('modal-project-title').textContent = 'Edit Project';
            document.getElementById('project-modal').classList.add('active');
        } else {
            showToast(data.message || 'Project details not found', 'error');
        }
    } catch (err) {
        showToast('Error loading project details', 'error');
    }
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

async function handleProjectSave(e) {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const title = document.getElementById('p-title').value.trim();
    const category = document.getElementById('p-category').value;
    const status = document.getElementById('p-status').value;
    const location = document.getElementById('p-location').value.trim();
    const description = document.getElementById('p-description').value.trim();
    const imagesRaw = document.getElementById('p-images').value;

    const images = imagesRaw.split(/[\n,]/).map(img => img.trim()).filter(img => img.length > 0);

    const payload = { title, category, status, location, description, images };
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;

    const saveBtn = document.getElementById('save-project-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showToast(id ? 'Project updated successfully' : 'New project created successfully', 'success');
            closeProjectModal();
            loadProjects();
        } else {
            showToast(data.message || 'Failed to save project', 'error');
        }
    } catch (err) {
        console.error('Error saving project:', err);
        showToast('Server error while saving project', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Project';
    }
}

function promptDeleteProject(id) {
    const confirmBtn = document.getElementById('confirm-delete-project-btn');
    if (confirmBtn) {
        confirmBtn.onclick = () => executeDeleteProject(id);
    }
    document.getElementById('delete-project-modal').classList.add('active');
}

function closeDeleteProjectModal() {
    document.getElementById('delete-project-modal').classList.remove('active');
}

async function executeDeleteProject(id) {
    const confirmBtn = document.getElementById('confirm-delete-project-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
    }

    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Project deleted successfully', 'success');
            closeDeleteProjectModal();
            removeRowFromDom(id);
            loadProjects();
        } else {
            showToast(data.message || 'Failed to delete project', 'error');
        }
    } catch (err) {
        console.error('Error deleting project:', err);
        showToast('Server connection error while deleting project', 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete Project';
        }
    }
}
