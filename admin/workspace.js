/* ============================================================
   workspace.js – Admin: Edit images on the public Workspace page
   ============================================================ */

const DEFAULT_WORKSPACE_IMAGES = {
    '1': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    '2': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    '3': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-1-scaled.jpeg',
    '4': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-15-scaled.jpeg',
    'intro': 'images/index_hero.png',
    'apart': 'images/index_apart.png'
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

// Handle file upload from computer
function handleFileSelect(id) {
    const fileInput = document.getElementById(`slide-file-${id}`);
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) {
        setSlideStatus(id, 'Please select a valid image file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const urlInput = document.getElementById(`slide-url-${id}`);
        if (urlInput) urlInput.value = dataUrl;
        setPreviewImage(id, dataUrl);
        setSlideStatus(id, 'File selected! Click Save to publish changes live.', 'success');
    };
    reader.onerror = () => setSlideStatus(id, 'Error reading local file.', 'error');
    reader.readAsDataURL(file);
}

// Save: POST image URL/data to settings API
async function saveSlide(id) {
    const url = document.getElementById(`slide-url-${id}`)?.value.trim();
    if (!url) {
        setSlideStatus(id, 'Please enter a valid image URL or upload a file.', 'error');
        return;
    }

    const card = document.getElementById(`slide-card-${id}`);
    const btn = card ? card.querySelector('.btn-save-slide') : null;
    const originalBtnHtml = btn ? btn.innerHTML : '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    }
    setSlideStatus(id, '', '');

    try {
        const key = getSettingKey(id);
        const res = await fetch(`${API_BASE}/settings/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ value: url })
        });
        const data = await res.json();

        if (data.success) {
            setPreviewImage(id, url);

            // Save in local storage cache
            localStorage.setItem(`ar_admin_${key}`, url);
            localStorage.removeItem(`ar_${key}`);

            setSlideStatus(id, '✓ Image saved! Changes are live on the website.', 'success');
            if (typeof showToast === 'function') {
                showToast(`Image updated successfully.`, 'success');
            }
        } else {
            throw new Error(data.message || 'Save failed');
        }
    } catch (err) {
        console.error('saveSlide error:', err);
        setSlideStatus(id, `Error: ${err.message}`, 'error');
        if (typeof showToast === 'function') {
            showToast(`Failed to save image.`, 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
}

// Render cached / default images synchronously for zero delay
function renderWorkspaceSlidesImmediately() {
    const ids = ['1', '2', '3', '4', 'intro', 'apart'];
    ids.forEach(id => {
        const key = getSettingKey(id);
        const cached = localStorage.getItem(`ar_admin_${key}`) || localStorage.getItem(`ar_${key}`);
        const defaultVal = DEFAULT_WORKSPACE_IMAGES[id];
        const initialUrl = cached || defaultVal;

        const input = document.getElementById(`slide-url-${id}`);
        if (input && !input.value) input.value = initialUrl;

        setPreviewImage(id, initialUrl);
    });
}

// Load: fetch current image for each workspace section/slide in parallel
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
        } catch (err) {
            console.warn(`Could not load setting for ${id}:`, err.message);
        }
    }));
}

// Init immediately on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWorkspaceSlides();
});
