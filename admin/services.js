/* ==========================================================================
   AR CONSTRUCTIONS & REALTORS - SERVICES IMAGES MANAGEMENT SCRIPT
   ========================================================================== */

'use strict';

const SERVICES_SETTINGS_KEYS = [
    'services_showcase_image_1',
    'services_showcase_image_2',
    'services_quote_image_1',
    'services_quote_image_2'
];

document.addEventListener('DOMContentLoaded', () => {
    loadServicesImages();
});

async function loadServicesImages() {
    // 1. Immediately restore cached settings from localStorage for zero flickering on reload
    for (const key of SERVICES_SETTINGS_KEYS) {
        const cached = localStorage.getItem(`ar_${key}`);
        if (cached) {
            const inputEl = document.getElementById(`input-${key}`);
            const previewEl = document.getElementById(`preview-${key}`);
            if (inputEl) inputEl.value = cached;
            if (previewEl) previewEl.src = cached;
        }
    }

    // 2. Fetch fresh settings from backend in parallel
    await Promise.all(SERVICES_SETTINGS_KEYS.map(async (key) => {
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
        previewEl.src = inputEl.value.trim();
    }
}

async function saveServicesImage(key, labelName) {
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
