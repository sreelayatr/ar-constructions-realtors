/* ============================================================
   workspace.js – Admin: Edit 1 Hero picture, 1 Get To Know Us picture, and 9 Showcase Gallery images
   ============================================================ */

const DEFAULT_WORKSPACE_IMAGES = {
    'about_hero': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    'about_knowus': 'images/about_knowus.jpg',
    'about_gallery_1': 'images/about_bedroom.jpg',
    'about_gallery_2': 'images/about_vanity.jpg',
    'about_gallery_3': 'images/about_kitchen.jpg',
    'about_gallery_4': 'images/about_sofa.jpg',
    'about_gallery_5': 'images/about_cabinet.jpg',
    'about_gallery_6': 'images/about_swing.jpg',
    'about_gallery_7': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0059.jpg',
    'about_gallery_8': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0057.jpg',
    'about_gallery_9': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/IMG-20241014-WA0056.jpg',
    '1': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    '2': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    '3': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-1-scaled.jpeg',
    '4': 'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-15-scaled.jpeg',
    'intro': 'images/index_hero.png',
    'apart': 'images/index_apart.png'
};

const ALL_WORKSPACE_IDS = [
    'about_hero',
    'about_knowus',
    'about_gallery_1',
    'about_gallery_2',
    'about_gallery_3',
    'about_gallery_4',
    'about_gallery_5',
    'about_gallery_6',
    'about_gallery_7',
    'about_gallery_8',
    'about_gallery_9',
    '1', '2', '3', '4', 'intro', 'apart'
];

function getSettingKey(id) {
    if (id === 'intro') return 'workspace_intro_image';
    if (id === 'apart') return 'workspace_apart_image';
    if (id === 'about_hero') return 'about_hero_image';
    if (id === 'about_knowus') return 'about_knowus_image';
    if (id.startsWith('about_gallery_')) return `${id}_image`;
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

// Set preview image with automatic fallback
function setPreviewImage(id, url) {
    const preview = document.getElementById(`slide-preview-${id}`);
    if (!preview) return;

    preview.src = getAdminImageSrc(url);
    preview.onerror = () => {
        const fallback = DEFAULT_WORKSPACE_IMAGES[id];
        if (fallback) {
            preview.src = getAdminImageSrc(fallback);
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
            localStorage.setItem(`ar_${key}`, url);

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

// Bulk save for all 9 gallery images
async function saveAllGalleryImages() {
    const galleryIds = ['about_gallery_1', 'about_gallery_2', 'about_gallery_3', 'about_gallery_4', 'about_gallery_5', 'about_gallery_6', 'about_gallery_7', 'about_gallery_8', 'about_gallery_9'];
    let successCount = 0;
    for (const id of galleryIds) {
        try {
            await saveSlide(id);
            successCount++;
        } catch (e) {}
    }
    if (typeof showToast === 'function') {
        showToast(`Saved ${successCount} gallery images.`, 'success');
    }
}

// Render cached / default images synchronously for zero delay
function renderWorkspaceSlidesImmediately() {
    ALL_WORKSPACE_IDS.forEach(id => {
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

    await Promise.all(ALL_WORKSPACE_IDS.map(async (id) => {
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
