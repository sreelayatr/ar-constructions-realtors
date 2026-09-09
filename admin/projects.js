/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - PROJECTS MANAGEMENT SCRIPT
   ========================================================================== */

let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHeroBanner();
    loadProjects();
});

function debounceProjectSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadProjects();
    }, 350);
}

async function loadProjects() {
    const categoryEl = document.getElementById('category-filter');
    const category = categoryEl ? categoryEl.value : 'all';
    const statusEl = document.getElementById('status-filter');
    const status = statusEl ? statusEl.value : 'all';
    const searchEl = document.getElementById('project-search');
    const search = searchEl ? searchEl.value : '';

    let url = `${API_BASE}/projects?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`;
    if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
    }

    try {
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();

        if (data.success) {
            renderProjectsTable(data.data || []);
        } else {
            showToast('Failed to load projects', 'error');
        }
    } catch (err) {
        console.error('Error loading projects:', err);
        showToast('Server error while loading projects', 'error');
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    if (projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No projects found in database.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = projects.map(p => {
        const thumb = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80';
        const displayTitle = p.title ? p.title : (p.location ? `${p.category || 'Project'} (${p.location})` : (p.category || 'Untitled Project'));

        return `
            <tr>
                <td>
                    <img src="${escapeHtml(thumb)}" alt="Thumb" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80'">
                </td>
                <td><strong>${escapeHtml(displayTitle)}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(p.category)}</span></td>
                <td>${escapeHtml(p.location)}</td>
                <td>${formatDate(p.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn" title="Edit Project" onclick="openEditProjectModal('${p._id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="icon-btn delete-btn" title="Delete Project" onclick="promptDeleteProject('${p._id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
            document.getElementById('p-location').value = p.location || '';
            document.getElementById('p-images').value = (p.images || []).join('\n');

            document.getElementById('modal-project-title').textContent = 'Edit Project';
            document.getElementById('project-modal').classList.add('active');
        } else {
            showToast('Project details not found', 'error');
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
    const rawTitle = document.getElementById('p-title').value.trim();
    const category = document.getElementById('p-category').value;
    const location = document.getElementById('p-location').value.trim();
    const title = rawTitle || (location ? `${category} (${location})` : category);
    const description = location || title;
    const status = 'Completed';
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
    confirmBtn.onclick = () => executeDeleteProject(id);
    document.getElementById('delete-project-modal').classList.add('active');
}

function closeDeleteProjectModal() {
    document.getElementById('delete-project-modal').classList.remove('active');
}

async function executeDeleteProject(id) {
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Project deleted successfully', 'success');
            closeDeleteProjectModal();
            loadProjects();
        } else {
            showToast(data.message || 'Failed to delete project', 'error');
        }
    } catch (err) {
        console.error('Error deleting project:', err);
        showToast('Server error while deleting project', 'error');
    }
}

/* ==========================================================================
   PROJECTS COVER / HERO BANNER MANAGEMENT
   ========================================================================== */

const DEFAULT_HERO_BANNER = 'https://res.cloudinary.com/vht1gwyc/image/upload/v1788710917/2f023e90-2298-4519-9a66-e98a7af35ffe.png';

function previewHeroBanner() {
    const input = document.getElementById('hero-banner-url');
    const preview = document.getElementById('hero-banner-preview');
    if (!preview) return;
    const url = input && input.value.trim() ? input.value.trim() : DEFAULT_HERO_BANNER;
    preview.src = url;
}

async function loadHeroBanner() {
    const input = document.getElementById('hero-banner-url');
    const preview = document.getElementById('hero-banner-preview');
    if (!input) return;

    try {
        const res = await fetch(`${API_BASE}/settings/projects_hero_image`);
        const data = await res.json();

        if (data && data.success && data.value) {
            input.value = data.value;
            if (preview) preview.src = data.value;
        } else {
            input.value = DEFAULT_HERO_BANNER;
            if (preview) preview.src = DEFAULT_HERO_BANNER;
        }
    } catch (err) {
        console.warn('Could not fetch projects_hero_image setting:', err);
        input.value = DEFAULT_HERO_BANNER;
        if (preview) preview.src = DEFAULT_HERO_BANNER;
    }
}

async function handleHeroBannerSave(e) {
    e.preventDefault();
    const input = document.getElementById('hero-banner-url');
    const btn = document.getElementById('save-hero-banner-btn');
    const preview = document.getElementById('hero-banner-preview');
    const value = input ? input.value.trim() : '';

    if (!value) {
        showToast('Please enter an image URL', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    try {
        const res = await fetch(`${API_BASE}/settings/projects_hero_image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ value })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Projects Hero Cover picture updated successfully!', 'success');
            if (preview) preview.src = value;
        } else {
            showToast(data.message || 'Failed to update hero picture', 'error');
        }
    } catch (err) {
        console.error('Error saving hero picture:', err);
        showToast('Server error while saving hero picture', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Update Picture</span>';
    }
}

