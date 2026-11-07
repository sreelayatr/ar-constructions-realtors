/* ============================================================
   workspace.js – Admin: Edit images & text on the public Workspace page
   ============================================================ */

const DEFAULT_WORKSPACE_IMAGES = {
    '1': 'https://res.cloudinary.com/vht1gwyc/image/upload/v1793202892/86f551ee-fbd4-4c62-9825-0d91ac87ff2b.png',
    '2': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    '3': 'https://res.cloudinary.com/vht1gwyc/image/upload/v1789670585/6595d5f4-7b42-4623-9f65-2244eb34e831.png',
    '4': 'https://res.cloudinary.com/vht1gwyc/image/upload/v1789670481/263e63f4-c553-40c2-a6f3-7af9067359dc.png',
    'intro': 'images/index_hero.png',
    'apart': 'images/index_apart.png'
};

const DEFAULT_WORKSPACE_TEXT = {
    '1': {
        title: 'Construction & Real Estate Solutions Across Bengaluru',
        subtitle: 'Residential & Commercial Construction Solutions'
    },
    '2': {
        title: 'Bespoke Home Solutions',
        subtitle: 'Transforming Dreams Into Elegant Environments'
    },
    '3': {
        title: 'Luxury is in the Details',
        subtitle: 'Complete Design Packages Tailored for Homeowners'
    },
    '4': {
        title: 'Affordable Elegance',
        subtitle: 'Delivering Exquisite Results with Professional Precision'
    }
};

function getSettingKey(id) {
    if (id === 'intro') return 'workspace_intro_image';
    if (id === 'apart') return 'workspace_apart_image';
    return `workspace_slide_${id}_image`;
}

// Convert relative frontend paths to valid browser URLs for admin context
function getAdminImageSrc(url) {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const isHttp = window.location.protocol.startsWith('http');
    if (isHttp) {
        if (url.startsWith('../frontend/')) {
            return '/' + url.replace('../frontend/', '');
        }
        if (url.startsWith('images/')) {
            return '/' + url;
        }
        return url;
    } else {
        if (url.startsWith('images/')) {
            return '../frontend/' + url;
        }
        if (url.startsWith('/images/')) {
            return '../frontend' + url;
        }
        return url;
    }
}

// Utility: set status message under a card
function setSlideStatus(id, message, type) {
    const el = document.getElementById(`slide-status-${id}`);
    if (!el) return;
    el.textContent = message;
    el.className = `slide-status ${type || ''}`;
}

// Set preview image with automatic fallback to local website images
function setPreviewImage(id, url) {
    const preview = document.getElementById(`slide-preview-${id}`);
    if (!preview) return;

    preview.src = getAdminImageSrc(url);
    preview.onerror = () => {
        if (id === 'intro') {
            preview.src = '../frontend/images/index_hero.png';
        } else if (id === 'apart') {
            preview.src = '../frontend/images/index_apart.png';
        } else if (id === '1') {
            preview.src = 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg';
        } else if (id === '2') {
            preview.src = 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg';
        } else if (id === '3') {
            preview.src = 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-1-scaled.jpeg';
        } else if (id === '4') {
            preview.src = 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-15-scaled.jpeg';
        } else {
            setSlideStatus(id, 'Could not load image. Check the URL.', 'error');
        }
    };
    preview.onload = () => setSlideStatus(id, '', '');
}

// Preview: update the <img> preview from the input URL
function previewSlide(id) {
    const url = document.getElementById(`slide-url-${id}`)?.value.trim();
    if (!url) {
        setSlideStatus(id, 'Please enter an image URL or choose a file first.', 'error');
        return;
    }
    setPreviewImage(id, url);
}

// Save: POST image URL/data + title + subtitle to settings API
async function saveSlide(id) {
    const url = document.getElementById(`slide-url-${id}`)?.value.trim();
    if (!url) {
        setSlideStatus(id, 'Please enter a valid image URL.', 'error');
        return;
    }

    const titleInput = document.getElementById(`slide-title-${id}`);
    const subtitleInput = document.getElementById(`slide-subtitle-${id}`);
    const titleVal = titleInput ? titleInput.value.trim() : '';
    const subtitleVal = subtitleInput ? subtitleInput.value.trim() : '';

    const card = document.getElementById(`slide-card-${id}`);
    const btn = card ? card.querySelector('.btn-save-slide') : null;
    const originalBtnHtml = btn ? btn.innerHTML : '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    }
    setSlideStatus(id, '', '');

    try {
        const imageKey = getSettingKey(id);
        const promises = [
            fetch(`${API_BASE}/settings/${imageKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ value: url })
            })
        ];

        if (titleInput) {
            promises.push(
                fetch(`${API_BASE}/settings/workspace_slide_${id}_title`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ value: titleVal })
                })
            );
        }

        if (subtitleInput) {
            promises.push(
                fetch(`${API_BASE}/settings/workspace_slide_${id}_subtitle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ value: subtitleVal })
                })
            );
        }

        const responses = await Promise.all(promises);
        const allOk = responses.every(r => r.ok);

        if (allOk) {
            setPreviewImage(id, url);

            // Update local storage caches
            localStorage.setItem(`ar_admin_${imageKey}`, url);
            localStorage.setItem(`ar_${imageKey}`, url);

            if (titleInput) {
                localStorage.setItem(`ar_admin_workspace_slide_${id}_title`, titleVal);
                localStorage.setItem(`ar_workspace_slide_${id}_title`, titleVal);
            }
            if (subtitleInput) {
                localStorage.setItem(`ar_admin_workspace_slide_${id}_subtitle`, subtitleVal);
                localStorage.setItem(`ar_workspace_slide_${id}_subtitle`, subtitleVal);
            }

            const successMsg = titleInput ? `✓ Slide ${id} (Picture & Text) saved! Live on the website.` : '✓ Image saved! Changes are live on the website.';
            setSlideStatus(id, successMsg, 'success');
            if (typeof showToast === 'function') {
                showToast(`Slide ${id} updated successfully.`, 'success');
            }
        } else {
            throw new Error('One or more settings failed to save');
        }
    } catch (err) {
        console.error('saveSlide error:', err);
        setSlideStatus(id, `Error: ${err.message}`, 'error');
        if (typeof showToast === 'function') {
            showToast(`Failed to save slide.`, 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
}

// Render cached / default images & text synchronously for zero delay
function renderWorkspaceSlidesImmediately() {
    const ids = ['1', '2', '3', '4', 'intro', 'apart'];
    ids.forEach(id => {
        const key = getSettingKey(id);
        const cachedImg = localStorage.getItem(`ar_admin_${key}`) || localStorage.getItem(`ar_${key}`);
        const defaultVal = DEFAULT_WORKSPACE_IMAGES[id];
        const initialUrl = cachedImg || defaultVal;

        const input = document.getElementById(`slide-url-${id}`);
        if (input && !input.value) input.value = initialUrl;

        setPreviewImage(id, initialUrl);

        // Populate titles & subtitles for slides 1-4
        if (DEFAULT_WORKSPACE_TEXT[id]) {
            const titleInput = document.getElementById(`slide-title-${id}`);
            const subInput = document.getElementById(`slide-subtitle-${id}`);

            const cachedTitle = localStorage.getItem(`ar_admin_workspace_slide_${id}_title`) ||
                                localStorage.getItem(`ar_workspace_slide_${id}_title`) ||
                                DEFAULT_WORKSPACE_TEXT[id].title;

            const cachedSub = localStorage.getItem(`ar_admin_workspace_slide_${id}_subtitle`) ||
                              localStorage.getItem(`ar_workspace_slide_${id}_subtitle`) ||
                              DEFAULT_WORKSPACE_TEXT[id].subtitle;

            if (titleInput && !titleInput.value) titleInput.value = cachedTitle;
            if (subInput && !subInput.value) subInput.value = cachedSub;
        }
    });
}

// Load: fetch current image & text for each workspace section/slide in parallel
async function loadWorkspaceSlides() {
    renderWorkspaceSlidesImmediately();

    const ids = ['1', '2', '3', '4', 'intro', 'apart'];
    await Promise.all(ids.map(async (id) => {
        try {
            const key = getSettingKey(id);
            const res = await fetch(`${API_BASE}/settings/${key}`);
            const data = await res.json();

            if (data.success && data.value) {
                const currentUrl = data.value;
                const input = document.getElementById(`slide-url-${id}`);
                if (input) input.value = currentUrl;
                setPreviewImage(id, currentUrl);
                localStorage.setItem(`ar_admin_${key}`, currentUrl);
            }

            // Fetch title & subtitle for slides 1-4
            if (DEFAULT_WORKSPACE_TEXT[id]) {
                const [titleRes, subRes] = await Promise.all([
                    fetch(`${API_BASE}/settings/workspace_slide_${id}_title`).then(r => r.json()).catch(() => null),
                    fetch(`${API_BASE}/settings/workspace_slide_${id}_subtitle`).then(r => r.json()).catch(() => null)
                ]);

                if (titleRes && titleRes.success && titleRes.value !== undefined) {
                    const titleInput = document.getElementById(`slide-title-${id}`);
                    if (titleInput) titleInput.value = titleRes.value;
                    localStorage.setItem(`ar_admin_workspace_slide_${id}_title`, titleRes.value);
                }

                if (subRes && subRes.success && subRes.value !== undefined) {
                    const subInput = document.getElementById(`slide-subtitle-${id}`);
                    if (subInput) subInput.value = subRes.value;
                    localStorage.setItem(`ar_admin_workspace_slide_${id}_subtitle`, subRes.value);
                }
            }
        } catch (err) {
            console.warn(`Could not load setting for ${id}:`, err.message);
        }
    }));
}

// Init immediately on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWorkspaceSlides();
});

// Real-time updates via Socket.IO
if (typeof socket !== 'undefined' && socket) {
    socket.on('site_setting_updated', ({ key }) => {
        if (key && (key.startsWith('workspace_') || key.includes('slide'))) {
            loadWorkspaceSlides();
        }
    });
}
