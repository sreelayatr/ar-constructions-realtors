/* ── Wayanad Project Images – dynamic add/remove ── */
let wmImages = []; // array of URL strings

function wmAddImage(url) {
    const input = document.getElementById('wm-new-img-url');
    const imgUrl = (url || (input ? input.value.trim() : '')).trim();
    if (!imgUrl) return;
    if (wmImages.includes(imgUrl)) {
        if (input) input.value = '';
        return; // no duplicates
    }
    wmImages.push(imgUrl);
    wmRenderImageGrid();
    if (input) input.value = '';
}

function wmRemoveImage(idx) {
    wmImages.splice(idx, 1);
    wmRenderImageGrid();
}

function wmRenderImageGrid() {
    const grid = document.getElementById('wm-images-grid');
    if (!grid) return;
    if (wmImages.length === 0) {
        grid.innerHTML = '<p style="font-size:0.75rem;color:var(--text-muted);grid-column:1/-1;">No images added yet.</p>';
        return;
    }
    grid.innerHTML = wmImages.map((url, i) => `
        <div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:4/3;background:#111;border:1px solid var(--border-color);">
            <img src="${url}" alt="Project Image ${i+1}"
                style="width:100%;height:100%;object-fit:cover;"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:0.7rem;color:var(--text-muted);padding:6px;text-align:center;word-break:break-all;">
                ⚠ Cannot load image
            </div>
            <button type="button" onclick="wmRemoveImage(${i})"
                style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);font-size:0.65rem;color:#ccc;padding:3px 6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                Image ${i+1}
            </div>
        </div>
    `).join('');
}

// Allow pressing Enter in the URL input to add image
document.addEventListener('DOMContentLoaded', () => {
    const inp = document.getElementById('wm-new-img-url');
    if (inp) {
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); wmAddImage(); } });
    }
});

/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - PROJECTS MANAGEMENT SCRIPT
   ========================================================================== */

let searchTimeout = null;
let cachedProjects = [];

document.addEventListener('DOMContentLoaded', () => {
    loadHeroBanner();
    loadProjects();
    loadWayanadModalSettings();
});

function debounceProjectSearch() {
    filterProjectsLocally();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadProjects();
    }, 350);
}

function handleCategoryChange() {
    filterProjectsLocally();
    loadProjects();
}

function filterProjectsLocally() {
    const categoryEl = document.getElementById('category-filter');
    const category = categoryEl ? categoryEl.value : 'all';
    const statusEl = document.getElementById('status-filter');
    const status = statusEl ? statusEl.value : 'all';
    const searchEl = document.getElementById('project-search');
    const search = searchEl ? searchEl.value.trim().toLowerCase() : '';

    let filtered = cachedProjects;

    if (category && category !== 'all') {
        filtered = filtered.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'all') {
        filtered = filtered.filter(p => (p.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search) {
        filtered = filtered.filter(p => {
            const title = (p.title || '').toLowerCase();
            const loc = (p.location || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            return title.includes(search) || loc.includes(search) || desc.includes(search) || cat.includes(search);
        });
    }

    renderProjectsTable(filtered);
}

async function loadProjects() {
    if (cachedProjects.length > 0) {
        filterProjectsLocally();
    }

    try {
        const res = await fetch(`${API_BASE}/projects`, { credentials: 'include' });
        const data = await res.json();

        if (data.success) {
            cachedProjects = data.data || [];
            filterProjectsLocally();
        } else if (cachedProjects.length === 0) {
            showToast('Failed to load projects', 'error');
        }
    } catch (err) {
        console.error('Error loading projects:', err);
        if (cachedProjects.length === 0) {
            showToast('Server error while loading projects', 'error');
        }
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
        const isWayanad = (p.title && (p.title.toLowerCase().includes('wayanad') || p.title.toLowerCase().includes('de143globe'))) ||
                          (p.location && p.location.toLowerCase().includes('wayanad'));

        return `
            <tr>
                <td>
                    <img src="${escapeHtml(thumb)}" alt="Thumb" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80'">
                </td>
                <td><strong>${escapeHtml(displayTitle)}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(p.category)}</span></td>
                <td>${escapeHtml(p.location)}</td>
                <td>${formatDate(p.createdAt)}</td>
                <td style="white-space: nowrap;">
                    <div class="action-btns" style="display:inline-flex;align-items:center;gap:8px;flex-wrap:nowrap;">
                        <button class="icon-btn" title="Edit Project Details" onclick="openEditProjectModal('${p._id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-edit-text" onclick="openProjectTextEditor('${p._id}')" style="height:32px;box-sizing:border-box;background:rgba(201,168,76,0.14);border:1px solid var(--primary-gold);color:var(--primary-gold);font-size:0.75rem;font-weight:600;padding:0 12px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;" title="Edit Text &amp; Gallery">
                            <i class="fa-solid fa-file-pen"></i> Edit Text
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

function handleCategorySelectChange() {
    const catSelect = document.getElementById('p-category');
    const customInput = document.getElementById('p-category-custom');
    if (!catSelect || !customInput) return;
    if (catSelect.value === '__custom__') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}

function openAddProjectModal() {
    document.getElementById('project-id').value = '';
    document.getElementById('project-form').reset();
    document.getElementById('p-category').value = '';
    const customInput = document.getElementById('p-category-custom');
    if (customInput) {
        customInput.value = '';
        customInput.style.display = 'none';
    }
    const wayanadHint = document.getElementById('wayanad-edit-hint');
    if (wayanadHint) wayanadHint.style.display = 'none';
    document.getElementById('modal-project-title').textContent = 'Add New Project';
    document.getElementById('project-modal').classList.add('active');
}

async function openEditProjectModal(id) {
    // Check in-memory cached projects first for zero delay
    const p = cachedProjects.find(item => item._id === id);
    if (p) {
        populateAndOpenEditModal(p);
        return;
    }

    // Fallback: Fetch from server if not found in memory
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.data) {
            populateAndOpenEditModal(data.data);
        } else {
            showToast('Project details not found', 'error');
        }
    } catch (err) {
        showToast('Error loading project details', 'error');
    }
}

function populateAndOpenEditModal(p) {
    document.getElementById('project-id').value = p._id || '';
    document.getElementById('p-title').value = p.title || '';
    
    const cat = (p.category || '').trim();
    const catSelect = document.getElementById('p-category');
    const customInput = document.getElementById('p-category-custom');
    const knownCategories = ['Residential', 'Commercial', 'Interior', 'Renovation'];

    if (!cat || cat === 'Residential') {
        // Defaults to '-- Select Category (Optional) --'
        catSelect.value = '';
        if (customInput) {
            customInput.value = '';
            customInput.style.display = 'none';
        }
    } else if (knownCategories.includes(cat)) {
        catSelect.value = cat;
        if (customInput) {
            customInput.value = '';
            customInput.style.display = 'none';
        }
    } else {
        // Existing custom category
        catSelect.value = '__custom__';
        if (customInput) {
            customInput.value = cat;
            customInput.style.display = 'block';
        }
    }

    document.getElementById('p-location').value = p.location || '';
    document.getElementById('p-images').value = (p.images || []).join('\n');

    const wayanadHint = document.getElementById('wayanad-edit-hint');
    const isWayanad = ((p.title || '') + ' ' + (p.location || '')).toLowerCase().includes('wayanad') ||
                      ((p.title || '') + ' ' + (p.location || '')).toLowerCase().includes('de143globe');
    if (wayanadHint) {
        wayanadHint.style.display = isWayanad ? 'flex' : 'none';
    }

    document.getElementById('modal-project-title').textContent = 'Edit Project';
    document.getElementById('project-modal').classList.add('active');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

async function handleProjectSave(e) {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const rawTitle = document.getElementById('p-title').value.trim();
    let category = document.getElementById('p-category').value.trim();
    if (category === '__custom__') {
        const customInput = document.getElementById('p-category-custom');
        category = customInput ? customInput.value.trim() : '';
    }
    const location = document.getElementById('p-location').value.trim();
    const title = rawTitle || (location ? (category ? `${category} (${location})` : location) : (category || ''));
    // Description is managed independently via the Text Editor
    const status = 'Completed';
    const imagesRaw = document.getElementById('p-images').value;

    const images = imagesRaw.split(/[\n,]/).map(img => img.trim()).filter(img => img.length > 0);

    if (images.length === 0) {
        showToast('Please provide at least one Image URL', 'error');
        return;
    }

    const payload = { title, category, status, location, images };
    if (!id) {
        payload.description = '';
    }
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
   PROJECTS COVER / HERO BANNER & SECTION TEXT MANAGEMENT
   ========================================================================== */

const DEFAULT_HERO_BANNER = 'https://res.cloudinary.com/vht1gwyc/image/upload/v1788710917/2f023e90-2298-4519-9a66-e98a7af35ffe.png';
const DEFAULT_PROJECTS_TITLE = 'Our Construction & Interior Projects Across Bengaluru';
const DEFAULT_PROJECTS_DESC = 'Explore our residential, commercial, construction, renovation and interior design projects completed by AR Constructions & Realtors across Bengaluru.';

function previewHeroBanner() {
    const input = document.getElementById('hero-banner-url');
    const preview = document.getElementById('hero-banner-preview');
    if (!preview) return;
    const url = input && input.value.trim() ? input.value.trim() : DEFAULT_HERO_BANNER;
    preview.src = url;
}

async function loadHeroBanner() {
    const bannerInput = document.getElementById('hero-banner-url');
    const titleInput = document.getElementById('projects-header-title-input');
    const descInput = document.getElementById('projects-header-desc-input');
    const preview = document.getElementById('hero-banner-preview');

    // 1. Restore from cache for immediate display
    const cachedBanner = localStorage.getItem('ar_projects_hero_image');
    const cachedTitle = localStorage.getItem('ar_projects_section_title');
    const cachedDesc = localStorage.getItem('ar_projects_section_desc');

    if (bannerInput && cachedBanner) {
        bannerInput.value = cachedBanner;
        if (preview) preview.src = cachedBanner;
    }
    if (titleInput && cachedTitle) titleInput.value = cachedTitle;
    if (descInput && cachedDesc) descInput.value = cachedDesc;

    // 2. Fetch fresh values from backend
    try {
        const [bannerRes, titleRes, descRes] = await Promise.all([
            fetch(`${API_BASE}/settings/projects_hero_image`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE}/settings/projects_section_title`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE}/settings/projects_section_desc`).then(r => r.json()).catch(() => null)
        ]);

        if (bannerInput) {
            if (bannerRes && bannerRes.success && bannerRes.value) {
                bannerInput.value = bannerRes.value;
                if (preview) preview.src = bannerRes.value;
                localStorage.setItem('ar_projects_hero_image', bannerRes.value);
            } else if (!cachedBanner) {
                bannerInput.value = DEFAULT_HERO_BANNER;
                if (preview) preview.src = DEFAULT_HERO_BANNER;
            }
        }

        if (titleInput) {
            if (titleRes && titleRes.success && titleRes.value) {
                titleInput.value = titleRes.value;
                localStorage.setItem('ar_projects_section_title', titleRes.value);
            } else if (!cachedTitle) {
                titleInput.value = DEFAULT_PROJECTS_TITLE;
            }
        }

        if (descInput) {
            if (descRes && descRes.success && descRes.value) {
                descInput.value = descRes.value;
                localStorage.setItem('ar_projects_section_desc', descRes.value);
            } else if (!cachedDesc) {
                descInput.value = DEFAULT_PROJECTS_DESC;
            }
        }
    } catch (err) {
        console.warn('Could not fetch projects header/banner settings:', err);
    }
}

async function handleHeroBannerSave(e) {
    e.preventDefault();
    const bannerInput = document.getElementById('hero-banner-url');
    const titleInput = document.getElementById('projects-header-title-input');
    const descInput = document.getElementById('projects-header-desc-input');
    const btn = document.getElementById('save-hero-banner-btn');
    const topBtn = document.getElementById('save-hero-banner-btn-top');
    const preview = document.getElementById('hero-banner-preview');

    const bannerVal = bannerInput ? bannerInput.value.trim() : '';
    const titleVal = titleInput ? titleInput.value.trim() : '';
    const descVal = descInput ? descInput.value.trim() : '';

    if (!bannerVal) {
        showToast('Please enter a Hero Banner picture URL', 'error');
        return;
    }

    const setBtnLoading = (loading) => {
        if (btn) {
            btn.disabled = loading;
            btn.innerHTML = loading ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...' : '<i class="fa-solid fa-floppy-disk"></i> <span>Save Header & Text</span>';
        }
        if (topBtn) {
            topBtn.disabled = loading;
            topBtn.innerHTML = loading ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...' : '<i class="fa-solid fa-floppy-disk"></i> <span>Save Header & Text</span>';
        }
    };

    setBtnLoading(true);

    try {
        const promises = [
            fetch(`${API_BASE}/settings/projects_hero_image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ value: bannerVal })
            })
        ];

        if (titleVal) {
            promises.push(
                fetch(`${API_BASE}/settings/projects_section_title`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ value: titleVal })
                })
            );
        }

        if (descVal) {
            promises.push(
                fetch(`${API_BASE}/settings/projects_section_desc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ value: descVal })
                })
            );
        }

        const results = await Promise.all(promises);
        const allOk = results.every(r => r.ok);

        if (allOk) {
            showToast('Projects Header Picture & Section Text updated successfully!', 'success');
            if (preview) preview.src = bannerVal;
            localStorage.setItem('ar_projects_hero_image', bannerVal);
            if (titleVal) localStorage.setItem('ar_projects_section_title', titleVal);
            if (descVal) localStorage.setItem('ar_projects_section_desc', descVal);
        } else {
            showToast('Saved with some warnings', 'warning');
        }
    } catch (err) {
        console.error('Error saving projects header settings:', err);
        showToast('Server error while saving projects header settings', 'error');
    } finally {
        setBtnLoading(false);
    }
}

/* ==========================================================================
   WAYANAD DE143GLOBE MODAL CONTENT MANAGEMENT
   ========================================================================== */

const DEFAULT_WAYANAD_DATA = {
    badge_1: 'De Land of Tomorrow | WAYANAD',
    badge_2: 'Only 5 Units Available',
    title: 'WAYANAD De143Globe',
    tagline: '✨ Your Private Paradise Awaits in the Lap of Nature ✨',
    intro: 'Escape to luxury with this exclusive pool villa project in <strong>Thrishellery, Wayanad</strong>. An incredible investment opportunity and a perfect holiday home!',
    metric_1_label: 'Rental Income Potential',
    metric_1_value: 'Up to ₹15 Lakhs',
    metric_1_sub: '/ annum',
    metric_2_label: 'Villa Size',
    metric_2_value: '~2,000 SQFT',
    metric_2_sub: 'luxury living',
    metric_3_label: 'Exclusive Pricing',
    metric_3_value: 'Starts @ ₹69 Lakhs',
    metric_3_sub: 'per villa',
    highlights: [
        'Villa Size: ~2,000 SQFT of luxury living',
        'Low Density: Only 5 premium units spread across 1 acre',
        'Exclusive Pricing: Starts at just ₹69 Lakhs per villa'
    ],
    features: [
        '2 Bedrooms with Attached Bathrooms',
        'Open Living & Dining Area + Modern Kitchen Counter',
        'Fully Closed Ground Floor with elegant laterite walls & door',
        'Single Full-Length Glass frontage with spectacular views',
        'Private Front Deck + Pool Area (30 ft x 30 ft)',
        'Common Bathroom with both inside & outside access'
    ],
    destinations: [
        'Mountain Views',
        'Serene Environment',
        'Kottiyoor Mahashiva Temple',
        'Banasura Hills',
        'Edakkal Caves',
        'Heart Island'
    ],
    urgency_title: 'LIMITED OPPORTUNITY — ONLY 5 UNITS AVAILABLE!',
    urgency_sub: 'Invest in nature, invest in your future.',
    partners: 'A Project by <strong>DE143GLOBE</strong> &bull; Partnered With <strong>AR Constructions and Realtors</strong>',
    contact_phone_1: '73538 77999',
    contact_phone_2: '98451 39034',
    whatsapp_number: '7353877999',
    whatsapp_text: 'Hi, I am interested in the WAYANAD De143Globe project.'
};

function scrollToWayanadEditor() {
    openWayanadModalEditor();
}

function populateWayanadForm(data) {
    const d = { ...DEFAULT_WAYANAD_DATA, ...(data || {}) };
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('wm-badge-1', d.badge_1);
    setVal('wm-badge-2', d.badge_2);
    setVal('wm-title', d.title);
    setVal('wm-tagline', d.tagline);
    setVal('wm-intro', d.intro);

    // Load project images into dynamic grid
    wmImages = Array.isArray(d.project_images) ? d.project_images.filter(Boolean) : [];
    wmRenderImageGrid();

    setVal('wm-m1-label', d.metric_1_label);
    setVal('wm-m1-val', d.metric_1_value);
    setVal('wm-m1-sub', d.metric_1_sub);

    setVal('wm-m2-label', d.metric_2_label);
    setVal('wm-m2-val', d.metric_2_value);
    setVal('wm-m2-sub', d.metric_2_sub);

    setVal('wm-m3-label', d.metric_3_label);
    setVal('wm-m3-val', d.metric_3_value);
    setVal('wm-m3-sub', d.metric_3_sub);

    setVal('wm-highlights', Array.isArray(d.highlights) ? d.highlights.join('\n') : (d.highlights || ''));
    setVal('wm-features', Array.isArray(d.features) ? d.features.join('\n') : (d.features || ''));
    setVal('wm-destinations', Array.isArray(d.destinations) ? d.destinations.join(', ') : (d.destinations || ''));

    setVal('wm-urgency-title', d.urgency_title);
    setVal('wm-urgency-sub', d.urgency_sub);
    setVal('wm-partners', d.partners);

    const titleVal = (d.title && d.title.trim()) ? d.title.trim() : 'WAYANAD De143Globe';
    const suffix = /project\s*$/i.test(titleVal) ? '' : ' project';
    const dynamicDefaultMsg = `Hi, I am interested in the ${titleVal}${suffix}.`;

    let finalWaMsg = (d.whatsapp_text && d.whatsapp_text.trim()) ? d.whatsapp_text.trim() : dynamicDefaultMsg;
    // If the saved message was the old hardcoded template and title differs, update dynamically
    if (finalWaMsg.includes('Luxury Pool Villa project') && !titleVal.includes('Luxury Pool Villa')) {
        finalWaMsg = dynamicDefaultMsg;
    }

    setVal('wm-phone-1', (d.contact_phone_1 && d.contact_phone_1.trim()) ? d.contact_phone_1 : '73538 77999');
    setVal('wm-phone-2', (d.contact_phone_2 && d.contact_phone_2.trim()) ? d.contact_phone_2 : '98451 39034');
    setVal('wm-wa-num', (d.whatsapp_number && d.whatsapp_number.trim()) ? d.whatsapp_number : '7353877999');
    setVal('wm-wa-msg', finalWaMsg);
}

function openWayanadModalEditor() {
    let populated = false;
    try {
        const cached = localStorage.getItem('ar_wayanad_modal_data');
        if (cached) {
            populateWayanadForm(JSON.parse(cached));
            populated = true;
        }
    } catch {}
    if (!populated) {
        populateWayanadForm(DEFAULT_WAYANAD_DATA);
    }

    const popup = document.getElementById('wayanad-modal-popup');
    if (popup) {
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeWayanadModalEditor() {
    const popup = document.getElementById('wayanad-modal-popup');
    if (popup) {
        popup.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close popup on overlay click
document.addEventListener('click', (e) => {
    const popup = document.getElementById('wayanad-modal-popup');
    if (popup && e.target === popup) {
        closeWayanadModalEditor();
    }
});

// Close popup on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const popup = document.getElementById('wayanad-modal-popup');
        if (popup && popup.classList.contains('active')) {
            closeWayanadModalEditor();
        }
    }
});

function resetWayanadModalDefaults() {
    if (confirm('Are you sure you want to restore the default text for the WAYANAD De143Globe modal?')) {
        populateWayanadForm(DEFAULT_WAYANAD_DATA);
        showToast('Default values loaded. Click "Save & Publish Text" to publish.', 'info');
    }
}

async function loadWayanadModalSettings() {
    // 1. Try local cache for immediate display
    try {
        const cached = localStorage.getItem('ar_wayanad_modal_data');
        if (cached) {
            populateWayanadForm(JSON.parse(cached));
        } else {
            populateWayanadForm(DEFAULT_WAYANAD_DATA);
        }
    } catch {
        populateWayanadForm(DEFAULT_WAYANAD_DATA);
    }

    // 2. Fetch from backend
    try {
        const res = await fetch(`${API_BASE}/settings/wayanad_modal_data`);
        const data = await res.json();
        if (data && data.success && data.value) {
            const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            populateWayanadForm(val);
            localStorage.setItem('ar_wayanad_modal_data', JSON.stringify(val));
        }
    } catch (err) {
        console.warn('Could not fetch wayanad_modal_data:', err);
    }
}

async function handleWayanadModalPopupSave(e) {
    e.preventDefault();
    const btn = document.getElementById('save-wayanad-popup-btn');
    const getVal = (id) => (document.getElementById(id)?.value || '').trim();

    const highlightsRaw = getVal('wm-highlights');
    const featuresRaw = getVal('wm-features');
    const destinationsRaw = getVal('wm-destinations');

    const value = {
        badge_1: getVal('wm-badge-1'),
        badge_2: getVal('wm-badge-2'),
        title: getVal('wm-title') || 'WAYANAD De143Globe',
        tagline: getVal('wm-tagline'),
        intro: getVal('wm-intro'),
        metric_1_label: getVal('wm-m1-label'),
        metric_1_value: getVal('wm-m1-val'),
        metric_1_sub: getVal('wm-m1-sub'),
        metric_2_label: getVal('wm-m2-label'),
        metric_2_value: getVal('wm-m2-val'),
        metric_2_sub: getVal('wm-m2-sub'),
        metric_3_label: getVal('wm-m3-label'),
        metric_3_value: getVal('wm-m3-val'),
        metric_3_sub: getVal('wm-m3-sub'),
        highlights: highlightsRaw ? highlightsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [],
        features: featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : [],
        destinations: destinationsRaw ? destinationsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
        urgency_title: getVal('wm-urgency-title'),
        urgency_sub: getVal('wm-urgency-sub'),
        partners: getVal('wm-partners'),
        contact_phone_1: getVal('wm-phone-1'),
        contact_phone_2: getVal('wm-phone-2'),
        whatsapp_number: getVal('wm-wa-num'),
        whatsapp_text: getVal('wm-wa-msg'),
        project_images: wmImages.filter(Boolean)
    };

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    }

    try {
        const res = await fetch(`${API_BASE}/settings/wayanad_modal_data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ value })
        });
        const data = await res.json();

        if (data.success) {
            showToast('WAYANAD De143Globe modal text updated successfully!', 'success');
            localStorage.setItem('ar_wayanad_modal_data', JSON.stringify(value));
            populateWayanadForm(value);
            closeWayanadModalEditor();
        } else {
            showToast(data.message || 'Failed to save Wayanad modal details', 'error');
        }
    } catch (err) {
        console.error('Error saving Wayanad modal data:', err);
        showToast('Server error while saving Wayanad details', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Save & Publish Text</span>';
        }
    }
}


/* ══════════════════════════════════════════════════════
   PROJECT TEXT EDITOR (PTE) — Title, Tagline, Desc, Gallery
   ══════════════════════════════════════════════════════ */
let pteImages = [];

function openProjectTextEditor(id) {
    const p = cachedProjects.find(item => item._id === id);
    if (!p) { showToast('Project not found', 'error'); return; }

    // De143Globe / WAYANAD project → open the dedicated featured popup editor
    const isWayanad = ((p.title || '') + ' ' + (p.location || '')).toLowerCase().includes('wayanad') ||
                      ((p.title || '') + ' ' + (p.location || '')).toLowerCase().includes('de143globe');
    if (isWayanad) {
        openWayanadModalEditor();
        return;
    }

    document.getElementById('pte-project-id').value = p._id;
    document.getElementById('pte-modal-heading').textContent = p.title || 'Edit Project';
    document.getElementById('pte-title').value = p.title || '';
    document.getElementById('pte-tagline').value = p.tagline || '';
    document.getElementById('pte-description').value = p.description || '';
    document.getElementById('pte-new-img-url').value = '';

    // Load gallery images
    pteImages = Array.isArray(p.images) ? [...p.images] : [];
    pteMergeGallery();

    const modal = document.getElementById('project-text-editor-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePTE() {
    const modal = document.getElementById('project-text-editor-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = '';
    pteImages = [];
    const grid = document.getElementById('pte-gallery-grid');
    if (grid) grid.innerHTML = '';
    const inp = document.getElementById('pte-new-img-url');
    if (inp) inp.value = '';
}

function pteAddImage() {
    const inp = document.getElementById('pte-new-img-url');
    const url = inp ? inp.value.trim() : '';
    if (!url) return;
    if (!pteImages.includes(url)) {
        pteImages.push(url);
        pteMergeGallery();
    }
    if (inp) inp.value = '';
}

function pteRemoveImage(idx) {
    pteImages.splice(idx, 1);
    pteMergeGallery();
}

function pteMoveUp(idx) {
    if (idx <= 0) return;
    const temp = pteImages[idx - 1];
    pteImages[idx - 1] = pteImages[idx];
    pteImages[idx] = temp;
    pteMergeGallery();
}

function pteMergeGallery() {
    const grid = document.getElementById('pte-gallery-grid');
    if (!grid) return;
    if (pteImages.length === 0) {
        grid.innerHTML = '<p style="font-size:0.75rem;color:var(--text-muted);grid-column:1/-1;">No images added yet.</p>';
        return;
    }
    grid.innerHTML = '';
    pteImages.forEach((url, i) => {
        const card = document.createElement('div');
        card.style.cssText = 'position:relative;border-radius:7px;overflow:hidden;background:#111;border:1px solid var(--border-color);';

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Img ' + (i + 1);
        img.style.cssText = 'width:100%;height:110px;object-fit:cover;display:block;';
        img.onerror = function() { this.style.opacity = '0.2'; };
        card.appendChild(img);

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:space-between;padding:4px;';

        const topRow = document.createElement('div');
        if (i === 0) {
            const badge = document.createElement('span');
            badge.textContent = 'THUMBNAIL';
            badge.style.cssText = 'background:rgba(201,168,76,0.9);color:#000;font-size:0.6rem;font-weight:800;padding:1px 5px;border-radius:3px;';
            topRow.appendChild(badge);
        }
        overlay.appendChild(topRow);

        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

        if (i > 0) {
            const upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.title = 'Move to thumbnail';
            upBtn.textContent = '↑';
            upBtn.style.cssText = 'background:rgba(0,0,0,0.6);border:none;color:#fff;border-radius:3px;width:22px;height:22px;cursor:pointer;font-size:0.75rem;';
            upBtn.addEventListener('click', function() { pteMoveUp(i); });
            bottomRow.appendChild(upBtn);
        } else {
            bottomRow.appendChild(document.createElement('span'));
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.title = 'Remove';
        delBtn.textContent = '✕';
        delBtn.style.cssText = 'background:rgba(180,30,30,0.85);border:none;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:0.8rem;display:flex;align-items:center;justify-content:center;';
        delBtn.addEventListener('click', function() { pteRemoveImage(i); });
        bottomRow.appendChild(delBtn);

        overlay.appendChild(bottomRow);
        card.appendChild(overlay);
        grid.appendChild(card);
    });
}

async function savePTE(e) {
    e.preventDefault();
    const id = document.getElementById('pte-project-id').value;
    if (!id) return;

    if (pteImages.length === 0) {
        showToast('Please add at least one image', 'error');
        return;
    }

    const payload = {
        title: document.getElementById('pte-title').value.trim(),
        tagline: document.getElementById('pte-tagline').value.trim(),
        description: document.getElementById('pte-description').value.trim(),
        images: pteImages.filter(Boolean)
    };

    const btn = document.getElementById('pte-save-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...'; }

    try {
        const res = await fetch(API_BASE + '/projects/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('Project updated successfully!', 'success');
            closePTE();
            loadProjects();
        } else {
            showToast(data.message || 'Failed to save project', 'error');
        }
    } catch (err) {
        console.error('PTE save error:', err);
        showToast('Server error while saving', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; }
    }
}

// Close PTE on overlay click + Enter key support
document.addEventListener('click', function(e) {
    const modal = document.getElementById('project-text-editor-modal');
    if (modal && e.target === modal) closePTE();
});
document.addEventListener('DOMContentLoaded', function() {
    const inp = document.getElementById('pte-new-img-url');
    if (inp) {
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); pteAddImage(); }
        });
    }
});


// Real-time updates via Socket.IO
if (typeof socket !== 'undefined' && socket) {
    socket.on('projects_updated', () => {
        loadProjects();
    });
    socket.on('refresh_projects', () => {
        loadProjects();
    });
    socket.on('site_setting_updated', ({ key }) => {
        if (key && key.includes('projects_')) {
            loadHeroBanner();
        }
        if (key === 'wayanad_modal_data') {
            loadWayanadModalSettings();
        }
    });
}



// Live sync: WhatsApp prefilled message updates automatically when project title changes
document.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('wm-title');
    const waMsgEl = document.getElementById('wm-wa-msg');
    if (titleEl && waMsgEl) {
        titleEl.addEventListener('input', () => {
            if (!waMsgEl.dataset.customEdited) {
                const titleVal = titleEl.value.trim() || 'WAYANAD De143Globe';
                const suffix = /project\s*$/i.test(titleVal) ? '' : ' project';
                waMsgEl.value = `Hi, I am interested in the ${titleVal}${suffix}.`;
            }
        });
        waMsgEl.addEventListener('input', () => {
            if (!waMsgEl.value.trim()) {
                delete waMsgEl.dataset.customEdited;
            } else {
                waMsgEl.dataset.customEdited = 'true';
            }
        });
    }
});
