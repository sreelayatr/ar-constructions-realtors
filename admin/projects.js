let currentProjectsList = [];
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupProjectSocketListeners();
});

function setupProjectSocketListeners() {
    if (typeof socket !== 'undefined' && socket) {
        socket.on('project_created', (newProj) => {
            if (typeof playNotificationChime === 'function') playNotificationChime();
            showToast(`New project added: ${newProj.title || 'Portfolio Item'}`, 'success');
            loadProjects();
        });

        socket.on('project_updated', (updatedProj) => {
            showToast(`Project updated: ${updatedProj.title || 'Portfolio Item'}`, 'success');
            loadProjects();
        });

        socket.on('project_deleted', (evt) => {
            if (evt && evt.id) {
                removeProjectFromState(evt.id);
            } else {
                loadProjects();
            }
        });
    }
}

function removeProjectFromState(id) {
    currentProjectsList = currentProjectsList.filter(p => String(p._id) !== String(id));
    const idx = FALLBACK_15_PROJECTS.findIndex(p => String(p._id) === String(id));
    if (idx !== -1) {
        FALLBACK_15_PROJECTS.splice(idx, 1);
    }
    renderProjectsTable(currentProjectsList);
}

function debounceProjectSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadProjects();
    }, 350);
}

const FALLBACK_15_PROJECTS = [
    {
        _id: 'default-1',
        title: "Skyline Ranch",
        category: "Residential",
        location: "Thripoonithara, Kerala",
        description: "Bespoke luxury residential space designed for Mr Sijo & Festy (Thripoonithara).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Sijo-Festy.jpg"],
        createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
        _id: 'default-2',
        title: "Eza - Gold Thrissur",
        category: "Commercial",
        location: "Thrissur, Kerala",
        description: "Premium retail jewel showroom interior and space optimization for Mr Biju.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2026/02/Mr-Biju-Eza-Gold-Thrissur.jpg"],
        createdAt: '2026-01-15T10:00:00.000Z'
    },
    {
        _id: 'default-3',
        title: "Navya Bake House",
        category: "Commercial",
        location: "Kerala",
        description: "Artisanal bakery aesthetic space crafted for Kurian & Hitha.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/Screenshot-211.png"],
        createdAt: '2024-10-14T10:00:00.000Z'
    },
    {
        _id: 'default-4',
        title: "Residence Thrissur (Pinto Francis)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Elegant modern residence architectural layout for Mr Pinto Francis.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0040.jpg"],
        createdAt: '2024-10-14T09:00:00.000Z'
    },
    {
        _id: 'default-5',
        title: "Residence Thrissur (Rajesh Francis)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "High-end contemporary interior space for Mr Rajesh Francis.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0061.jpg"],
        createdAt: '2024-10-14T08:00:00.000Z'
    },
    {
        _id: 'default-6',
        title: "Residence Layout (Justin Raphael)",
        category: "Residential",
        location: "Kerala",
        description: "Custom space planning and interior design for Mr Justin Raphael.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2022/03/1.jpeg"],
        createdAt: '2022-03-01T10:00:00.000Z'
    },
    {
        _id: 'default-7',
        title: "Casablanca Apartment",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Luxury high-rise apartment interior overhaul for Mr Joju.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/04/1.jpg"],
        createdAt: '2020-04-10T10:00:00.000Z'
    },
    {
        _id: 'default-8',
        title: "Residence Design (Bijoy Varghese)",
        category: "Residential",
        location: "Kerala",
        description: "Warm-toned aesthetic living room and interior design for Mr Bijoy Varghese.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/13.jpg"],
        createdAt: '2020-03-25T10:00:00.000Z'
    },
    {
        _id: 'default-9',
        title: "Modern Layout (Jino Jose)",
        category: "Residential",
        location: "Kerala",
        description: "Bespoke modern home layout and interior for Mr Jino Jose.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/DSC_0371.jpg"],
        createdAt: '2020-03-20T10:00:00.000Z'
    },
    {
        _id: 'default-10',
        title: "Sobha Saphire (Daison)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Classy luxury apartment styling for Mr Daison (Sobha Saphire).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/IMG_9675-1.jpg"],
        createdAt: '2020-03-18T10:00:00.000Z'
    },
    {
        _id: 'default-11',
        title: "Residence Project (Dr Rajesh & Dr Anu)",
        category: "Residential",
        location: "Kerala",
        description: "Contemporary architectural home layout for Dr Rajesh & Dr Anu.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/4L8A9460.jpg"],
        createdAt: '2020-03-15T10:00:00.000Z'
    },
    {
        _id: 'default-12',
        title: "Sobha Jade (Girilal)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Sophisticated open-concept interior execution for Mr Girilal (Sobha Jade).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/2L6A9378-3.jpg"],
        createdAt: '2020-03-12T10:00:00.000Z'
    },
    {
        _id: 'default-13',
        title: "Sobha Saphire (Anita)",
        category: "Residential",
        location: "Thrissur, Kerala",
        description: "Luxury interior design and finishing for Mrs Anita (Sobha Saphire).",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-13-2.jpg"],
        createdAt: '2020-03-10T10:00:00.000Z'
    },
    {
        _id: 'default-14',
        title: "Residence Design (Mejo Chittilappally)",
        category: "Residential",
        location: "Kerala",
        description: "Bespoke interior supervision and design execution for Mr Mejo Chittilappally.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/01-28-2.jpg"],
        createdAt: '2020-03-08T10:00:00.000Z'
    },
    {
        _id: 'default-15',
        title: "Residence Project (Antochan Manjaly)",
        category: "Residential",
        location: "Kerala",
        description: "Custom luxury residence layout and interior for Mr Antochan Manjaly.",
        status: "Completed",
        images: ["https://spaceliftstudio.com/wp-content/uploads/2020/03/Anto8.jpg"],
        createdAt: '2020-03-05T10:00:00.000Z'
    }
];

async function loadProjects() {
    const categoryEl = document.getElementById('category-filter');
    const statusEl = document.getElementById('status-filter');
    const searchEl = document.getElementById('project-search');

    const category = categoryEl ? categoryEl.value : 'all';
    const status = statusEl ? statusEl.value : 'all';
    const search = searchEl ? searchEl.value.toLowerCase().trim() : '';

    let url = `${API_BASE}/projects?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    try {
        const res = await fetch(url, {
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
            currentProjectsList = data.data;
        } else {
            let filtered = [...FALLBACK_15_PROJECTS];
            if (category !== 'all') filtered = filtered.filter(p => p.category === category);
            if (status !== 'all') filtered = filtered.filter(p => p.status === status);
            if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search) || p.location.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
            currentProjectsList = filtered;
        }
    } catch (err) {
        console.error('Error loading projects:', err);
        let filtered = [...FALLBACK_15_PROJECTS];
        if (category !== 'all') filtered = filtered.filter(p => p.category === category);
        if (status !== 'all') filtered = filtered.filter(p => p.status === status);
        if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search) || p.location.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
        currentProjectsList = filtered;
    }

    renderProjectsTable(currentProjectsList);
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    if (!Array.isArray(projects) || projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No projects found in database.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = projects.map(p => {
        const thumb = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80';
        const badgeClass = p.status === 'Completed' ? 'badge-completed' : (p.status === 'Ongoing' ? 'badge-ongoing' : 'badge-upcoming');

        return `
            <tr id="project-row-${p._id}">
                <td>
                    <img src="${escapeHtml(thumb)}" alt="Thumb" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80'">
                </td>
                <td><strong>${escapeHtml(p.title)}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(p.category)}</span></td>
                <td>${escapeHtml(p.location)}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(p.status)}</span></td>
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
            document.getElementById('p-status').value = p.status || 'Completed';
            document.getElementById('p-location').value = p.location || '';
            document.getElementById('p-description').value = p.description || '';
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
    confirmBtn.onclick = () => executeDeleteProject(id);
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
            removeProjectFromState(id);
        } else {
            showToast(data.message || 'Failed to delete project', 'error');
        }
    } catch (err) {
        console.error('Error deleting project:', err);
        showToast('Server error while deleting project', 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete Project';
        }
    }
}
