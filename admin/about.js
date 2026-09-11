/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - ABOUT US IMAGES MANAGEMENT SCRIPT
   ========================================================================== */

'use strict';

const ABOUT_SETTINGS_KEYS = [
    'about_hero_image',
    'about_knowus_image',
    'about_gallery_image_1',
    'about_gallery_image_2',
    'about_gallery_image_3',
    'about_gallery_image_4',
    'about_gallery_image_5',
    'about_gallery_image_6',
    'about_gallery_image_7',
    'about_gallery_image_8',
    'about_gallery_image_9'
];

document.addEventListener('DOMContentLoaded', () => {
    loadAboutImages();
});

async function loadAboutImages() {
    // 1. Immediately restore cached settings from localStorage for zero flickering on reload
    for (const key of ABOUT_SETTINGS_KEYS) {
        const cached = localStorage.getItem(`ar_${key}`);
        if (cached) {
            const inputEl = document.getElementById(`input-${key}`);
            const previewEl = document.getElementById(`preview-${key}`);
            if (inputEl) inputEl.value = cached;
            if (previewEl) previewEl.src = cached;
        }
    }

    // 2. Fetch fresh settings from backend in parallel
    await Promise.all(ABOUT_SETTINGS_KEYS.map(async (key) => {
        try {
            const res = await fetch(`${API_BASE}/settings/${key}`, { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.value) {
                const val = data.value;
                const inputEl = document.getElementById(`input-${key}`);
                const previewEl = document.getElementById(`preview-${key}`);

                if (inputEl) inputEl.value = val;
                if (previewEl) previewEl.src = val;
                localStorage.setItem(`ar_${key}`, val);
            }
        } catch (err) {
            console.error(`Error loading setting for ${key}:`, err);
        }
    }));
}

function handleLivePreview(key) {
    const inputEl = document.getElementById(`input-${key}`);
    const previewEl = document.getElementById(`preview-${key}`);
    if (inputEl && previewEl && inputEl.value.trim()) {
        const url = inputEl.value.trim();
        previewEl.src = url;
        updateLivePublicView(key, url);
    }
}

function updateLivePublicView(key, url) {
    // No-op: Live public preview frame removed from admin UI
}

async function saveAboutImage(key, labelName) {
    const inputEl = document.getElementById(`input-${key}`);
    if (!inputEl) return;

    const url = inputEl.value.trim();
    if (!url) {
        showToast('Please enter a valid image URL', 'error');
        return;
    }

    const saveBtn = document.getElementById(`btn-${key}`);
    const originalText = saveBtn ? saveBtn.innerHTML : 'Save';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    }

    try {
        const res = await fetch(`${API_BASE}/settings/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ value: url })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`${labelName || 'Image'} updated successfully!`, 'success');
            updateLivePublicView(key, url);
            localStorage.setItem(`ar_${key}`, url);
        } else {
            showToast(data.message || 'Failed to save image', 'error');
        }
    } catch (err) {
        console.error(`Error saving ${key}:`, err);
        showToast('Server error while saving image', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
}

async function saveAllGalleryImages() {
    const saveAllBtn = document.getElementById('save-all-gallery-btn');
    if (saveAllBtn) {
        saveAllBtn.disabled = true;
        saveAllBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving All 9 Images...';
    }

    let successCount = 0;
    const galleryKeys = Array.from({ length: 9 }, (_, i) => `about_gallery_image_${i + 1}`);

    for (const key of galleryKeys) {
        const inputEl = document.getElementById(`input-${key}`);
        if (!inputEl) continue;
        const url = inputEl.value.trim();
        if (!url) continue;

        try {
            const res = await fetch(`${API_BASE}/settings/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ value: url })
            });
            const data = await res.json();
            if (data.success) {
                successCount++;
                updateLivePublicView(key, url);
                localStorage.setItem(`ar_${key}`, url);
            }
        } catch (err) {
            console.error(`Error saving ${key}:`, err);
        }
    }

    if (saveAllBtn) {
        saveAllBtn.disabled = false;
        saveAllBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save All 9 Gallery Images';
    }

    showToast(`${successCount} of 9 gallery images updated successfully!`, 'success');
}
