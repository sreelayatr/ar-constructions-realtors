/* ============================================================
   workspace.js – Admin: Edit hero slider images on index.html
   ============================================================ */

const DEFAULT_SLIDE_IMAGES = [
    null, // index 0 unused (slides are 1-indexed)
    'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-14-scaled.jpeg',
    'https://spaceliftstudio.com/wp-content/uploads/2024/10/WhatsApp-Image-2024-10-17-at-18.48.35_773a27d1.jpg',
    'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-1-scaled.jpeg',
    'https://spaceliftstudio.com/wp-content/uploads/2024/10/01-15-scaled.jpeg'
];

// Utility: set status message under a slide card
function setSlideStatus(slideNum, message, type) {
    const el = document.getElementById(`slide-status-${slideNum}`);
    if (!el) return;
    el.textContent = message;
    el.className = `slide-status ${type || ''}`;
}

// Preview: update the <img> preview from the input URL
function previewSlide(slideNum) {
    const url = document.getElementById(`slide-url-${slideNum}`)?.value.trim();
    if (!url) {
        setSlideStatus(slideNum, 'Please enter an image URL first.', 'error');
        return;
    }
    const preview = document.getElementById(`slide-preview-${slideNum}`);
    if (preview) {
        preview.src = url;
        preview.onerror = () => setSlideStatus(slideNum, 'Could not load image. Check the URL.', 'error');
        preview.onload = () => setSlideStatus(slideNum, 'Image loaded successfully.', 'success');
    }
}

// Save: POST new URL to /api/settings/workspace_slide_N_image
async function saveSlide(slideNum) {
    const url = document.getElementById(`slide-url-${slideNum}`)?.value.trim();
    if (!url) {
        setSlideStatus(slideNum, 'Please enter a valid image URL.', 'error');
        return;
    }

    const btn = document.querySelector(`#slide-card-${slideNum} .btn-save-slide`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    }
    setSlideStatus(slideNum, '', '');

    try {
        const key = `workspace_slide_${slideNum}_image`;
        const res = await fetch(`${API_BASE}/settings/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: url })
        });
        const data = await res.json();

        if (data.success) {
            // Update preview to confirm
            const preview = document.getElementById(`slide-preview-${slideNum}`);
            if (preview) preview.src = url;

            // Bust localStorage cache so frontend picks up the new image
            localStorage.removeItem(`ar_workspace_slide_${slideNum}_image`);

            setSlideStatus(slideNum, '✓ Slide image saved! Changes are live on the website.', 'success');
            if (typeof showToast === 'function') {
                showToast(`Slide ${slideNum} updated successfully.`, 'success');
            }
        } else {
            throw new Error(data.message || 'Save failed');
        }
    } catch (err) {
        console.error('saveSlide error:', err);
        setSlideStatus(slideNum, `Error: ${err.message}`, 'error');
        if (typeof showToast === 'function') {
            showToast(`Failed to save slide ${slideNum}.`, 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Slide ${slideNum}`;
        }
    }
}

// Load: fetch current image for each slide from settings API
async function loadWorkspaceSlides() {
    for (let i = 1; i <= 4; i++) {
        try {
            const key = `workspace_slide_${i}_image`;
            const res = await fetch(`${API_BASE}/settings/${key}`);
            const data = await res.json();

            const currentUrl = (data.success && data.value) ? data.value : DEFAULT_SLIDE_IMAGES[i];

            const input = document.getElementById(`slide-url-${i}`);
            const preview = document.getElementById(`slide-preview-${i}`);

            if (input) input.value = currentUrl;
            if (preview) preview.src = currentUrl;
        } catch (err) {
            console.warn(`Could not load slide ${i} setting:`, err.message);
            const preview = document.getElementById(`slide-preview-${i}`);
            if (preview) preview.src = DEFAULT_SLIDE_IMAGES[i];
        }
    }
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWorkspaceSlides();
});
