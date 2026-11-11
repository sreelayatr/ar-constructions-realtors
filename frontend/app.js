document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // PRODUCTION API BASE URL (Render Backend)
    // ==========================================================

    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:9100'
        : 'https://ar-constructions-realtors.onrender.com';

    // ==========================================================
    // SMOOTH SCROLL RESTORATION (Prevents navigation jitter)
    // ==========================================================
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // ==========================================================
    // BACKGROUND WAKE-UP PING (prevents Render cold-start delay)
    // Deferred so it does not block or compete with initial render.
    // ==========================================================
    if (!window.location.pathname.includes('projects.html')) {
        setTimeout(() => {
            fetch(`${API_BASE_URL}/api/projects`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && Array.isArray(res.data)) {
                        try {
                            localStorage.setItem('ar_projects_cache_v3', JSON.stringify({ ts: Date.now(), data: res.data }));
                        } catch {}
                    }
                })
                .catch(() => {});
        }, 1500);
    }

    /* ==========================================
       STICKY HEADER TRANSITION
       ========================================== */
    const header = document.querySelector('.main-header');

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    /* ==========================================
       MOBILE NAV DRAWER TOGGLE
       ========================================== */

    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileDrawer) {

        let mobileOverlay = document.querySelector('.mobile-nav-overlay');

        if (!mobileOverlay) {
            mobileOverlay = document.createElement('div');
            mobileOverlay.className = 'mobile-nav-overlay';
            document.body.appendChild(mobileOverlay);
        }

        let drawerCloseBtn = mobileDrawer.querySelector('.mobile-drawer-close');

        if (!drawerCloseBtn) {
            drawerCloseBtn = document.createElement('button');
            drawerCloseBtn.className = 'mobile-drawer-close';
            drawerCloseBtn.setAttribute('aria-label', 'Minimize menu');
            drawerCloseBtn.setAttribute('title', 'Minimize menu');
            drawerCloseBtn.innerHTML =
                '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';

            mobileDrawer.insertBefore(drawerCloseBtn, mobileDrawer.firstChild);
        }

        const openMenu = () => {
            mobileToggle?.classList.add('active');
            mobileDrawer.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            mobileToggle?.classList.remove('active');
            mobileDrawer.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        mobileToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileDrawer.classList.contains('active')
                ? closeMenu()
                : openMenu();
        });

        drawerCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMenu();
        });

        mobileOverlay.addEventListener('click', closeMenu);

        document.addEventListener('click', (e) => {
            if (
                mobileDrawer.classList.contains('active') &&
                !mobileDrawer.contains(e.target) &&
                !mobileToggle?.contains(e.target)
            ) {
                closeMenu();
            }
        });

        mobileLinks.forEach(link =>
            link.addEventListener('click', closeMenu)
        );

        window.addEventListener('resize', () => {
            if (
                window.innerWidth > 768 &&
                mobileDrawer.classList.contains('active')
            ) {
                closeMenu();
            }
        });
    }

    /* ==========================================
       SMOOTH NAVIGATION & CURRENT-PAGE LINK HANDLING
       ========================================== */
    const getCleanPath = (url) => {
        try {
            const u = new URL(url, window.location.origin);
            let path = u.pathname;
            if (path.endsWith('/index.html')) path = path.replace(/\/index\.html$/, '/');
            if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
            return path || '/';
        } catch {
            return url;
        }
    };

    const currentCleanPath = getCleanPath(window.location.href);
    const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetCleanPath = getCleanPath(link.href);
            // If already on this page and not an anchor jump, smoothly scroll to top without full reload
            if (targetCleanPath === currentCleanPath && !link.hash) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    
    
    // Make header & footer logos completely inactive (no navigation, no scroll)
    document.querySelectorAll('.logo-link, .footer-logo-link').forEach(function(logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
        });
        logo.style.cursor = 'default';
        logo.style.pointerEvents = 'auto'; // keep visible but intercept click
    });

    // Prevent social icon links with href="#" from reloading/jumping page top
    document.querySelectorAll('.social-icons a').forEach(function(link) {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
            });
        }
    });

    // Smooth scroll for in-page hash anchor links (e.g. href="#contact")
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    /* ==========================================
       MOBILE CARD FLIP & TAP OUTSIDE TO HIDE (PHONE ONLY)
       ========================================== */

    const cardWrappers = document.querySelectorAll('.info-card-wrapper');

    if (cardWrappers.length) {
        cardWrappers.forEach(wrapper => {
            wrapper.addEventListener('click', e => {
                if (window.innerWidth > 768) return;
                if (e.target.closest('a')) return;
                
                const isCurrentlyFlipped = wrapper.classList.contains('flipped');

                cardWrappers.forEach(other => other.classList.remove('flipped'));

                if (!isCurrentlyFlipped) {
                    wrapper.classList.add('flipped');
                }
            });
        });

        document.addEventListener('click', e => {
            if (window.innerWidth > 768) return;
            if (!e.target.closest('.info-card-wrapper')) {
                cardWrappers.forEach(wrapper => wrapper.classList.remove('flipped'));
            }
        });
    }

    /* ==========================================
       SCROLL REVEAL
       ========================================== */

    const animElements =
        document.querySelectorAll(
            '.animate-up,.animate-left,.animate-right,.animate-fade'
        );

    const observer =
        new IntersectionObserver((entries, obs) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    obs.unobserve(entry.target);
                }

            });

        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -50px 0px'
        });

    animElements.forEach(el => observer.observe(el));

    /* ==========================================
       HERO SLIDER
       ========================================== */

    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');

    if (slides.length) {

        let currentSlide = 0;

        const goToSlide = n => {

            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');

            currentSlide = (n + slides.length) % slides.length;

            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');

        };

        const next = () => goToSlide(currentSlide + 1);
        const prev = () => goToSlide(currentSlide - 1);

        let interval = setInterval(next, 6000);

        const reset = () => {
            clearInterval(interval);
            interval = setInterval(next, 6000);
        };

        nextBtn?.addEventListener('click', () => {
            next();
            reset();
        });

        prevBtn?.addEventListener('click', () => {
            prev();
            reset();
        });

        dots.forEach((dot, i) =>
            dot.addEventListener('click', () => {
                goToSlide(i);
                reset();
            })
        );
    }

    /* ==========================================
       CONTACT FORM
       ========================================== */

    const form = document.getElementById('contact-form');

    if (form) {

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');
        const serviceSelect = document.getElementById('service');

        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const successModal = document.getElementById('success-modal');
        const closeModalBtn = document.getElementById('close-modal');

        const isValidEmail =
            email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        const isValidPhone = phone => {
            const digits = phone.replace(/\D/g, '');
            return digits.length >= 10 && /^[0-9+\s\-()]+$/.test(phone.trim());
        };

        const validateField = (input, ok, group) => {

            group.classList.toggle('invalid', !ok);
            return ok;

        };

        nameInput?.addEventListener('input', () =>
            validateField(
                nameInput,
                nameInput.value.trim() !== '',
                nameInput.closest('.form-group')
            )
        );

        emailInput?.addEventListener('input', () =>
            validateField(
                emailInput,
                isValidEmail(emailInput.value.trim()),
                emailInput.closest('.form-group')
            )
        );

        phoneInput?.addEventListener('input', () =>
            validateField(
                phoneInput,
                isValidPhone(phoneInput.value.trim()),
                phoneInput.closest('.form-group')
            )
        );

        const customDropdown = document.getElementById('custom-service-dropdown');
        if (customDropdown && serviceSelect) {
            const trigger = customDropdown.querySelector('.custom-dropdown-trigger');
            const selectedText = customDropdown.querySelector('.custom-dropdown-selected');
            const items = customDropdown.querySelectorAll('.custom-dropdown-item');
            const group = customDropdown.closest('.form-group');
            const label = group ? group.querySelector('label') : null;

            const syncDropdownState = () => {
                if (serviceSelect.value || customDropdown.classList.contains('active') || selectedText.textContent.trim() !== '') {
                    group?.classList.add('has-value');
                } else {
                    group?.classList.remove('has-value');
                }
            };

            const toggleDropdown = (e) => {
                if (e) e.stopPropagation();
                customDropdown.classList.toggle('active');
                syncDropdownState();
            };

            if (trigger) trigger.addEventListener('click', toggleDropdown);
            if (label) label.addEventListener('click', toggleDropdown);

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = item.getAttribute('data-value');
                    selectedText.textContent = item.textContent;

                    if (val) {
                        serviceSelect.value = val;
                    }

                    // Fallback: if value didn't match option exactly, find matching option by value or text
                    if (!serviceSelect.value && val) {
                        const matchingOption = Array.from(serviceSelect.options).find(opt =>
                            opt.value === val ||
                            opt.value.toLowerCase().includes(val.toLowerCase()) ||
                            val.toLowerCase().includes(opt.value.toLowerCase())
                        );
                        if (matchingOption) {
                            serviceSelect.value = matchingOption.value;
                        }
                    }

                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    customDropdown.classList.remove('active');
                    syncDropdownState();
                    validateField(serviceSelect, serviceSelect.value !== '', group);
                    serviceSelect.dispatchEvent(new Event('change'));
                });
            });

            document.addEventListener('click', () => {
                customDropdown.classList.remove('active');
                syncDropdownState();
            });
        }

        serviceSelect?.addEventListener('change', () =>
            validateField(
                serviceSelect,
                serviceSelect.value !== '',
                serviceSelect.closest('.form-group')
            )
        );

        form.addEventListener('submit', async e => {

            e.preventDefault();

            const okName = validateField(
                nameInput,
                nameInput.value.trim() !== '',
                nameInput.closest('.form-group')
            );

            const okEmail = validateField(
                emailInput,
                isValidEmail(emailInput.value.trim()),
                emailInput.closest('.form-group')
            );

            const okPhone = phoneInput
                ? validateField(
                      phoneInput,
                      isValidPhone(phoneInput.value.trim()),
                      phoneInput.closest('.form-group')
                  )
                : true;

            const okService = serviceSelect
                ? validateField(
                      serviceSelect,
                      serviceSelect.value !== '',
                      serviceSelect.closest('.form-group')
                  )
                : true;

            if (!(okName && okEmail && okPhone && okService))
                return;

            submitBtn.disabled = true;
            btnText.textContent = 'Sending...';

            submitBtn.querySelector('.btn-icon').innerHTML =
                '<i class="fa-solid fa-circle-notch fa-spin"></i>';

            const payload = {

                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput ? phoneInput.value.trim() : '',
                service: serviceSelect?.value || '',
                subject:
                    serviceSelect?.value
                        ? `Service: ${serviceSelect.value}`
                        : subjectInput?.value.trim() ||
                          'General Inquiry',
                message: messageInput?.value.trim() || `Inquiry regarding ${serviceSelect?.value || 'services'}`,
                source: 'website-contact-form'

            };

            try {

                // ==========================================================
                // UPDATED FOR RENDER BACKEND
                // ==========================================================

                const response = await fetch(
                    `${API_BASE_URL}/api/bookings`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

                const data = await response.json();

                if (response.ok && data.success) {

                    successModal?.classList.add('active');
                    form.reset();

                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                    if (phoneInput) phoneInput.value = '';
                    if (subjectInput) subjectInput.value = '';
                    if (messageInput) messageInput.value = '';
                    if (serviceSelect) serviceSelect.value = '';

                    const customDropdown = document.getElementById('custom-service-dropdown');
                    if (customDropdown) {
                        const selectedText = customDropdown.querySelector('.custom-dropdown-selected');
                        const items = customDropdown.querySelectorAll('.custom-dropdown-item');
                        if (selectedText) selectedText.textContent = '';
                        items.forEach(i => i.classList.remove('selected'));
                        customDropdown.classList.remove('active');
                    }

                    document
                        .querySelectorAll('.form-group')
                        .forEach(group => {
                            group.classList.remove(
                                'invalid',
                                'valid',
                                'has-value'
                            );
                        });

                } else {

                    alert(
                        data.message ||
                            'Unable to submit your inquiry.'
                    );

                }

            } catch (err) {

                console.error(err);

                alert(
                    'Could not connect to the server.'
                );

            } finally {

                submitBtn.disabled = false;
                btnText.textContent = 'Send Message';

                submitBtn.querySelector('.btn-icon').innerHTML =
                    '<i class="fa-solid fa-paper-plane"></i>';

            }

        });

        closeModalBtn?.addEventListener('click', () =>
            successModal?.classList.remove('active')
        );

        successModal?.addEventListener('click', e => {

            if (e.target === successModal)
                successModal.classList.remove('active');

        });

    }

    /* ==========================================
       TESTIMONIAL SLIDER
       ========================================== */

    const testimonialSlides =
        document.querySelectorAll('.testimonial-slide');

    const testimonialDots =
        document.querySelectorAll('.testimonial-dots .dot');

    if (testimonialSlides.length) {

        let current = 0;

        const go = n => {

            testimonialSlides[current].classList.remove('active');
            testimonialDots[current].classList.remove('active');

            current =
                (n + testimonialSlides.length) %
                testimonialSlides.length;

            testimonialSlides[current].classList.add('active');
            testimonialDots[current].classList.add('active');

        };

        setInterval(() => go(current + 1), 5000);

        testimonialDots.forEach((dot, i) =>
            dot.addEventListener('click', () => go(i))
        );
    }

    /* ==========================================
       ABOUT PAGE SLIDER
       ========================================== */

    const aboutTrack =
        document.querySelector('.about-slider-track');

    const aboutSlides =
        document.querySelectorAll('.about-slide');

    const aboutPrev =
        document.querySelector('.about-slider-arrow.prev');

    const aboutNext =
        document.querySelector('.about-slider-arrow.next');

    if (aboutTrack && aboutSlides.length) {

        let current = 0;

        const go = n => {

            current = (n + aboutSlides.length) % aboutSlides.length;

            aboutTrack.style.transform =
                `translateX(-${current * 100}%)`;

        };

        let interval = setInterval(() => go(current + 1), 4000);

        const reset = () => {

            clearInterval(interval);
            interval = setInterval(() => go(current + 1), 4000);

        };

        aboutNext?.addEventListener('click', () => {
            go(current + 1);
            reset();
        });

        aboutPrev?.addEventListener('click', () => {
            go(current - 1);
            reset();
        });

    }

    /* ==========================================
       PROJECT CARDS INTERACTION & DYNAMIC API FETCH
       ========================================== */
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {

        // ── Cloudinary URL Optimizer ───────────────────────────────
        const optimizeCloudinaryUrl = (url) => {
            if (!url || typeof url !== 'string') return url;
            if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('/f_auto')) {
                return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
            }
            return url;
        };

        // ── Cache helpers (Instant render with stale-while-revalidate) ──
        const CACHE_KEY     = 'ar_projects_cache_v3';
        const CACHE_TTL_MS  = 30 * 24 * 60 * 60 * 1000;   // 30 days

        const readCache = () => {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (!raw) return null;
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts > CACHE_TTL_MS) return null;
                return Array.isArray(data) ? data : null;
            } catch { return null; }
        };

        const writeCache = (data) => {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
            } catch {}
        };

        const getSignature = (list) => {
            if (!Array.isArray(list)) return '';
            return list.map(p => `${p._id || ''}:${p.updatedAt || ''}:${p.title || ''}:${p.tagline || ''}:${p.description || ''}:${(p.images && p.images.length) || ''}:${(p.images && p.images[0]) || ''}`).join('|');
        };

        // Track rendered signature and initialize from cache immediately
        const _initCached = readCache();
        let allProjectsList = _initCached || [];
        let currentRenderSignature = _initCached ? getSignature(_initCached) : null;

        // ── Background Scroll Lock Helpers (Keeps background still & preserves scroll position) ──
        let savedScrollY = 0;
        let isScrollLocked = false;

        const lockBodyScroll = () => {
            if (isScrollLocked) return;
            // Record current scroll position precisely before locking
            savedScrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            document.body.classList.add('modal-open');
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
            isScrollLocked = true;
        };

        const unlockBodyScroll = () => {
            if (!isScrollLocked) return;
            document.body.classList.remove('modal-open');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Restore exact scroll position without jumping to top
            window.scrollTo(0, savedScrollY);
            isScrollLocked = false;
        };

        const preventOverlayBackgroundScroll = (modalEl) => {
            if (!modalEl) return;
            modalEl.addEventListener('wheel', (e) => {
                if (e.target === modalEl) {
                    e.preventDefault();
                }
            }, { passive: false });
            modalEl.addEventListener('touchmove', (e) => {
                if (e.target === modalEl) {
                    e.preventDefault();
                }
            }, { passive: false });
        };

        // ── Generic Project Modal Handlers (For All Projects) ──────
        const genericModal = document.getElementById('generic-project-modal');
        const closeGenericModalBtn = document.getElementById('close-generic-project-modal');

        const closeGenericProjectModal = () => {
            if (genericModal) {
                genericModal.classList.remove('active');
                unlockBodyScroll();
                const card = genericModal.querySelector('.pmodal-card');
                if (card) {
                    card.scrollTop = 0;
                }
                genericModal.scrollTop = 0;
            }
        };

        closeGenericModalBtn?.addEventListener('click', closeGenericProjectModal);
        genericModal?.addEventListener('click', (e) => {
            if (e.target === genericModal) closeGenericProjectModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && genericModal?.classList.contains('active')) {
                closeGenericProjectModal();
            }
        });
        preventOverlayBackgroundScroll(genericModal);

        const openGenericProjectModal = (p) => {
            if (!genericModal || !p) return;

            const displayTitle = p.title || (p.location && p.category ? `${p.category} (${p.location})` : (p.category || 'Project Details'));
            const titleEl = document.getElementById('gpm-title');
            if (titleEl) titleEl.textContent = displayTitle;

            const catText = document.getElementById('gpm-category-text');
            if (catText) catText.textContent = p.category || 'Project';

            const locBadge = document.getElementById('gpm-badge-location');
            const locText = document.getElementById('gpm-location-text');
            if (locBadge && locText) {
                if (p.location && p.location.trim()) {
                    locText.textContent = p.location.trim();
                    locBadge.style.display = 'inline-flex';
                } else {
                    locBadge.style.display = 'none';
                }
            }

            const tagEl = document.getElementById('gpm-tagline');
            if (tagEl) {
                if (p.tagline && p.tagline.trim()) {
                    tagEl.textContent = p.tagline.trim();
                    tagEl.style.display = 'block';
                } else {
                    tagEl.style.display = 'none';
                }
            }

            const descEl = document.getElementById('gpm-description');
            if (descEl) {
                if (p.description && p.description.trim()) {
                    descEl.textContent = p.description.trim();
                    descEl.style.display = 'block';
                } else {
                    descEl.style.display = 'none';
                }
            }

            const galleryWrap = document.getElementById('gpm-gallery-wrap');
            const galleryGrid = document.getElementById('gpm-gallery-grid');
            if (galleryWrap && galleryGrid) {
                const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
                galleryGrid.innerHTML = '';
                if (imgs.length > 0) {
                    imgs.forEach((url, i) => {
                        const wrap = document.createElement('div');
                        wrap.style.cssText = 'border-radius:10px;overflow:hidden;width:100%;aspect-ratio:4/3;background:#111;cursor:pointer;position:relative;border:1px solid rgba(255,255,255,0.08);';

                        const img = document.createElement('img');
                        img.src = optimizeCloudinaryUrl(url);
                        img.alt = `${displayTitle} - Image ${i + 1}`;
                        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;';
                        img.onerror = function() {
                            this.style.display = 'none';
                            wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:0.75rem;padding:8px;text-align:center;">Image unavailable</div>';
                        };
                        wrap.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.05)'; });
                        wrap.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });
                        wrap.addEventListener('click', () => {
                            if (typeof openWayanadGalleryLightbox === 'function') {
                                openWayanadGalleryLightbox(url);
                            }
                        });

                        wrap.appendChild(img);
                        galleryGrid.appendChild(wrap);
                    });
                    galleryWrap.style.display = 'block';
                } else {
                    galleryWrap.style.display = 'none';
                }
            }

            // Phone 1
            const phone1 = (p.phone_1 && p.phone_1.trim()) ? p.phone_1 : '73538 77999';
            const p1Link = document.getElementById('gpm-phone-1');
            const p1Text = document.getElementById('gpm-phone-1-text');
            if (p1Link && p1Text) {
                const cleanP1 = phone1.replace(/\D/g, '');
                p1Link.href = `tel:+91${cleanP1}`;
                p1Text.textContent = phone1;
            }

            // Phone 2
            const phone2 = (p.phone_2 && p.phone_2.trim()) ? p.phone_2 : '98451 39034';
            const p2Link = document.getElementById('gpm-phone-2');
            const p2Text = document.getElementById('gpm-phone-2-text');
            if (p2Link && p2Text) {
                const cleanP2 = phone2.replace(/\D/g, '');
                p2Link.href = `tel:+91${cleanP2}`;
                p2Text.textContent = phone2;
            }

            // WhatsApp Inquire Button
            const waBtn = document.getElementById('gpm-whatsapp-btn');
            if (waBtn) {
                let cleanNum = (p.whatsapp_number || '7353877999').replace(/\D/g, '');
                if (cleanNum.length === 10) cleanNum = '91' + cleanNum;
                
                const cleanTitle = (displayTitle || 'Project').trim();
                const suffix = /project\s*$/i.test(cleanTitle) ? '' : ' project';
                const defaultMsg = `Hi, I am interested in the ${cleanTitle}${suffix}.`;
                const finalWaMsg = (p.whatsapp_text && p.whatsapp_text.trim()) ? p.whatsapp_text.trim() : defaultMsg;
                
                waBtn.href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(finalWaMsg)}`;
            }

            const card = genericModal.querySelector('.pmodal-card');
            if (card) {
                card.scrollTop = 0;
            }
            genericModal.scrollTop = 0;
            genericModal.classList.add('active');
            lockBodyScroll();
        };

        // ── Wayanad Popup Modal Handlers ───────────────────────────
        const wayanadModal = document.getElementById('wayanad-project-modal');
        const closeWayanadModalBtn = document.getElementById('close-wayanad-modal');

        const openWayanadModal = () => {
            if (wayanadModal) {
                const card = wayanadModal.querySelector('.pmodal-card');
                if (card) {
                    card.scrollTop = 0;
                }
                wayanadModal.scrollTop = 0;
                wayanadModal.classList.add('active');
                lockBodyScroll();
            }
        };

        const closeWayanadModal = () => {
            if (wayanadModal) {
                wayanadModal.classList.remove('active');
                unlockBodyScroll();
                const card = wayanadModal.querySelector('.pmodal-card');
                if (card) {
                    card.scrollTop = 0;
                }
                wayanadModal.scrollTop = 0;
            }
        };

        closeWayanadModalBtn?.addEventListener('click', closeWayanadModal);
        wayanadModal?.addEventListener('click', (e) => {
            if (e.target === wayanadModal) closeWayanadModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wayanadModal?.classList.contains('active')) {
                closeWayanadModal();
            }
        });
        preventOverlayBackgroundScroll(wayanadModal);
        window.openWayanadModal = openWayanadModal;

        // ── Wayanad Popup Modal Dynamic Content Sync ───────────────
        const WAYANAD_STORAGE_KEY = 'ar_wayanad_modal_data';

        const updateWayanadModalInDOM = (data) => {
            if (!data || typeof data !== 'object') return;
            const setText = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null && val !== '') el.textContent = val;
            };
            const setHtml = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null && val !== '') el.innerHTML = val;
            };

            setText('wayanad-badge-1-text', data.badge_1);
            setText('wayanad-badge-2-text', data.badge_2);
            setText('wayanad-modal-title', data.title);
            setText('wayanad-modal-tagline', data.tagline);
            if (data.intro) setHtml('wayanad-modal-intro', data.intro);

            // Render project images gallery using DOM (not innerHTML, to preserve URLs)
            const galleryWrap = document.getElementById('wayanad-gallery');
            const galleryGrid = document.getElementById('wayanad-gallery-grid');
            if (galleryWrap && galleryGrid) {
                const imgs = data.project_images || [];
                const validImgs = imgs.filter(Boolean);
                galleryGrid.innerHTML = '';
                if (validImgs.length > 0) {
                    validImgs.forEach((url) => {
                        const wrap = document.createElement('div');
                        wrap.style.cssText = 'border-radius:8px;overflow:hidden;width:100%;background:#111;cursor:pointer;';

                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = 'Project Image';
                        img.style.cssText = 'width:100%;height:auto;display:block;';
                        img.onerror = function() {
                            this.style.display = 'none';
                            wrap.style.background = '#1a1a1a';
                            wrap.innerHTML += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:0.75rem;padding:8px;text-align:center;">Image unavailable</div>';
                        };
                        img.addEventListener('click', () => openWayanadGalleryLightbox(url));
                        wrap.appendChild(img);
                        galleryGrid.appendChild(wrap);
                    });
                    galleryWrap.style.display = 'block';
                } else {
                    galleryWrap.style.display = 'none';
                }
            }

            setText('wayanad-metric-1-label', data.metric_1_label);
            if (data.metric_1_value) {
                setHtml('wayanad-metric-1-value', `${data.metric_1_value} <span class="sub" id="wayanad-metric-1-sub">${data.metric_1_sub || ''}</span>`);
            }

            setText('wayanad-metric-2-label', data.metric_2_label);
            if (data.metric_2_value) {
                setHtml('wayanad-metric-2-value', `${data.metric_2_value} <span class="sub" id="wayanad-metric-2-sub">${data.metric_2_sub || ''}</span>`);
            }

            setText('wayanad-metric-3-label', data.metric_3_label);
            if (data.metric_3_value) {
                setHtml('wayanad-metric-3-value', `${data.metric_3_value} <span class="sub" id="wayanad-metric-3-sub">${data.metric_3_sub || ''}</span>`);
            }

            // Highlights
            if (Array.isArray(data.highlights) && data.highlights.length > 0) {
                const hlList = document.getElementById('wayanad-highlights-list');
                if (hlList) {
                    hlList.innerHTML = data.highlights
                        .filter(h => h && h.trim())
                        .map(h => `<li><i class="fa-solid fa-check"></i> <div>${h}</div></li>`)
                        .join('');
                }
            }

            // Features
            if (Array.isArray(data.features) && data.features.length > 0) {
                const ftList = document.getElementById('wayanad-features-list');
                if (ftList) {
                    const icons = ['fa-bed', 'fa-couch', 'fa-cube', 'fa-mountain-sun', 'fa-water-ladder', 'fa-bath', 'fa-check'];
                    ftList.innerHTML = data.features
                        .filter(f => f && f.trim())
                        .map((f, i) => {
                            const icon = icons[i % icons.length];
                            return `<li><i class="fa-solid ${icon}"></i> <div>${f}</div></li>`;
                        })
                        .join('');
                }
            }

            // Destinations
            if (Array.isArray(data.destinations) && data.destinations.length > 0) {
                const dTags = document.getElementById('wayanad-dest-tags');
                if (dTags) {
                    const icons = ['fa-mountain', 'fa-spa', 'fa-om', 'fa-tree', 'fa-dungeon', 'fa-heart', 'fa-location-dot'];
                    dTags.innerHTML = data.destinations
                        .filter(d => d && d.trim())
                        .map((d, i) => {
                            const icon = icons[i % icons.length];
                            return `<span><i class="fa-solid ${icon}"></i> ${d.trim()}</span>`;
                        })
                        .join('');
                }
            }

            setText('wayanad-urgency-title-text', data.urgency_title);
            setText('wayanad-urgency-sub', data.urgency_sub);
            if (data.partners) setHtml('wayanad-partners-text', data.partners);

            // Contacts
            if (data.contact_phone_1) {
                const p1 = document.getElementById('wayanad-phone-1');
                if (p1) {
                    p1.href = `tel:+91${data.contact_phone_1.replace(/\D/g, '')}`;
                    const span = p1.querySelector('span');
                    if (span) span.textContent = data.contact_phone_1;
                }
            }
            if (data.contact_phone_2) {
                const p2 = document.getElementById('wayanad-phone-2');
                if (p2) {
                    p2.href = `tel:+91${data.contact_phone_2.replace(/\D/g, '')}`;
                    const span = p2.querySelector('span');
                    if (span) span.textContent = data.contact_phone_2;
                }
            }
            if (data.whatsapp_number) {
                const wa = document.getElementById('wayanad-whatsapp-btn');
                if (wa) {
                    let cleanNum = data.whatsapp_number.replace(/\D/g, '');
                    if (cleanNum.length === 10) cleanNum = '91' + cleanNum;
                    const titleText = (data.title || 'WAYANAD De143Globe').trim();
                    const suffix = /project\s*$/i.test(titleText) ? '' : ' project';
                    const defaultMsg = `Hi, I am interested in the ${titleText}${suffix}.`;
                    const waText = (data.whatsapp_text && data.whatsapp_text.trim()) ? data.whatsapp_text.trim() : defaultMsg;
                    const text = encodeURIComponent(waText);
                    wa.href = `https://wa.me/${cleanNum}?text=${text}`;
                }
            }
        };

        // Restore cached Wayanad modal content instantly
        try {
            const cachedWayanad = localStorage.getItem(WAYANAD_STORAGE_KEY);
            if (cachedWayanad) {
                updateWayanadModalInDOM(JSON.parse(cachedWayanad));
            }
        } catch {}

        // Fetch fresh Wayanad modal setting from backend
        fetch(`${API_BASE_URL}/api/settings/wayanad_modal_data`)
            .then(r => r.json())
            .then(res => {
                if (res && res.success && res.value) {
                    const val = typeof res.value === 'string' ? JSON.parse(res.value) : res.value;
                    updateWayanadModalInDOM(val);
                    localStorage.setItem(WAYANAD_STORAGE_KEY, JSON.stringify(val));
                }
            })
            .catch(() => {});

        const attachCardListeners = () => {
            document.querySelectorAll('.project-card').forEach(card => {
                if (card._hasClickListener) return;
                card._hasClickListener = true;

                const handleCardClick = (e) => {
                    const isWayanadCard = card.dataset.projectModal === 'wayanad' ||
                        card.getAttribute('data-project-modal') === 'wayanad' ||
                        card.textContent.toLowerCase().includes('wayanad') ||
                        card.textContent.toLowerCase().includes('de143globe') ||
                        card.querySelector('img')?.src.toLowerCase().includes('wayanad') ||
                        card.querySelector('img')?.src.includes('6a7a49aa') ||
                        card.querySelector('img')?.src.includes('6a2684b5') ||
                        card.querySelector('img')?.src.includes('98c0d3b5');

                    e.preventDefault();
                    e.stopPropagation();

                    if (isWayanadCard) {
                        openWayanadModal();
                        return;
                    }

                    // For all other projects, open the dynamic project details modal
                    const pId = card.dataset.id;
                    const pIdx = parseInt(card.dataset.index, 10);
                    const project = (allProjectsList && allProjectsList.find(item => String(item._id) === String(pId))) ||
                                    (allProjectsList && !isNaN(pIdx) && allProjectsList[pIdx]);
                    if (project) {
                        openGenericProjectModal(project);
                    }
                };

                card.addEventListener('click', handleCardClick);
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(e);
                    }
                });
            });
        };

        const renderProjects = (data) => {
            if (!data || data.length === 0) {
                projectsGrid.innerHTML = `
                    <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:60px 20px;">
                        <p style="font-size:1.1rem;letter-spacing:0.5px;">No projects available yet.</p>
                    </div>`;
                return;
            }

            allProjectsList = data || [];
            currentRenderSignature = getSignature(data);

            projectsGrid.innerHTML = data.map((p, idx) => {
                const rawImgUrl = (p.images && p.images.length > 0 && p.images[0])
                    ? p.images[0]
                    : 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80';

                const imgUrl = optimizeCloudinaryUrl(rawImgUrl);

                let category = (p.category || '').trim();
                let location = (p.location || '').trim();
                const title = (p.title || '').trim();

                // Check if this project is 4BHK
                const is4BHK = title === '4BHK' || (p.images && p.images.some(img => typeof img === 'string' && img.includes('IMG_6020')));
                if (is4BHK) {
                    if (!category) category = 'Residential';
                    if (!location) location = 'Bangalore, Karnataka';
                }

                // Check if this project is Wayanad
                const isWayanadProj = (title && (title.toLowerCase().includes('wayanad') || title.toLowerCase().includes('de143globe'))) ||
                                      (location && location.toLowerCase().includes('wayanad')) ||
                                      (p.images && p.images.some(img => typeof img === 'string' && (
                                          img.includes('6a7a49aa') || img.includes('6a2684b5') || img.includes('98c0d3b5')
                                      )));
                if (isWayanadProj) {
                    if (!category || category.toLowerCase().includes('price') || category.includes('@')) {
                        category = 'Commercial';
                    }
                    if (!location || location.toLowerCase().includes('wanayad')) {
                        location = 'Wayanad, Kerala';
                    }
                }

                // Clean title display (title > category > 'Project')
                const displayTitle = title || category || 'Project';

                // Display only Category and Location on hover
                let clientText = '';
                if (category && location) {
                    clientText = `${category} • ${location}`;
                } else if (category) {
                    clientText = category;
                } else if (location) {
                    clientText = location;
                }

                // Check if this project is WAYANAD De143Globe
                const isWayanad = (title && (title.toLowerCase().includes('wayanad') || title.toLowerCase().includes('de143globe'))) ||
                                  (location && location.toLowerCase().includes('wayanad')) ||
                                  (p.images && p.images.some(img => typeof img === 'string' && (
                                      img.includes('6a7a49aa') || img.includes('6a2684b5') || img.includes('98c0d3b5')
                                  )));

                // Use contain fit for flyer/brochure-style images so full image is visible
                const isBrochure = isWayanad || (p.images && p.images.some(img =>
                    typeof img === 'string' && (
                        img.includes('6a7a49aa-1c79-4bf8-a5b8-3f386ef47009') ||
                        img.includes('6a2684b5-56d0-4c84-804b-7587947b1a6c') ||
                        img.includes('brochure') || img.includes('flyer')
                    )
                ));
                const imgClass = isBrochure ? 'project-img project-img--contain' : 'project-img';
                const loadingAttr = idx < 6 ? 'loading="eager"' : 'loading="lazy"';
                const fetchPriorityAttr = idx < 3 ? ' fetchpriority="high"' : '';

                const hasOverlay = Boolean(displayTitle || clientText);
                const overlayHtml = hasOverlay ? `
                        <div class="project-overlay">
                            ${displayTitle ? `<h3 class="project-title">${displayTitle}</h3>` : ''}
                            ${clientText ? `<p class="project-client">${clientText}</p>` : ''}
                        </div>` : '';

                return `
                    <div class="project-card animate-up reveal-active${isBrochure ? ' project-card--contain' : ''}" ${isWayanad ? 'data-project-modal="wayanad"' : ''} data-id="${p._id || idx}" data-index="${idx}" tabindex="0">
                        <img class="${imgClass}" src="${imgUrl}"
                             onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'"
                             ${loadingAttr}${fetchPriorityAttr}
                             decoding="async"
                             alt="${displayTitle || 'Project'}">
                        ${overlayHtml}
                    </div>`;
            }).join('');

            attachCardListeners();
        };

        // ── Skeleton placeholders (first visit only when DOM is empty) ──
        const showSkeletons = () => {
            projectsGrid.innerHTML = Array.from({ length: 6 })
                .map(() => '<div class="project-skeleton"></div>')
                .join('');
        };

        // ── Retry / error message ──────────────────────────────────
        const showError = () => {
            projectsGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:60px 20px;">
                    <p style="font-size:1.1rem;letter-spacing:0.5px;margin-bottom:18px;">
                        Could not load projects. Please check your connection and try again.
                    </p>
                    <button id="retry-projects-btn" style="
                        background:transparent;
                        border:1px solid var(--color-accent-gold-light,#c9a84c);
                        color:var(--color-accent-gold-light,#c9a84c);
                        padding:10px 28px;border-radius:4px;cursor:pointer;
                        font-size:0.9rem;letter-spacing:1px;transition:background 0.3s;
                    ">Retry</button>
                </div>`;
            document.getElementById('retry-projects-btn')
                ?.addEventListener('click', loadProjects);
        };

        // ── Fetch fresh data from API & update cache ───────────────
        const fetchFresh = async (silent = false) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/projects`);
                const result   = await response.json();

                if (response.ok && result.success && Array.isArray(result.data)) {
                    writeCache(result.data);
                    allProjectsList = result.data;
                    const newSig = getSignature(result.data);
                    // Only update DOM if server data differs from currently rendered data
                    if (newSig !== currentRenderSignature) {
                        renderProjects(result.data);
                    }
                } else {
                    if (!silent && !projectsGrid.querySelector('.project-card')) showError();
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                if (!silent && !projectsGrid.querySelector('.project-card')) showError();
            }
        };

        // ── Main entry: stale-while-revalidate ─────────────────────
        const loadProjects = () => {
            // Immediately activate interactions on pre-rendered or existing cards
            attachCardListeners();

            const cached = readCache();

            if (cached && cached.length > 0) {
                allProjectsList = cached;
                currentRenderSignature = getSignature(cached);
                const existingCards = projectsGrid.querySelectorAll('.project-card');
                if (existingCards.length === 0) {
                    renderProjects(cached);
                } else {
                    attachCardListeners();
                }
                fetchFresh(true);       // silent background refresh
            } else {
                // If pre-rendered HTML cards already exist in DOM, keep them visible!
                const existingCards = projectsGrid.querySelectorAll('.project-card');
                if (existingCards.length === 0) {
                    showSkeletons();
                    fetchFresh(false);
                } else {
                    // Fetch fresh in background without replacing the visible cards with skeletons
                    fetchFresh(true);
                }
            }
        };

        window.loadProjects = loadProjects;
        window.fetchFreshProjects = () => fetchFresh(true);

        loadProjects();

        // ── Dynamic Projects Hero Banner Sync ────────────────────────
        const heroCoverImg = document.querySelector('.projects-hero-cover img.hero-bg');
        if (heroCoverImg) {
            const HERO_CACHE_KEY = 'ar_projects_hero_image';
            const cachedHero = localStorage.getItem(HERO_CACHE_KEY);
            if (cachedHero) {
                heroCoverImg.src = cachedHero;
            }

            fetch(`${API_BASE_URL}/api/settings/projects_hero_image`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && res.value) {
                        heroCoverImg.src = res.value;
                        localStorage.setItem(HERO_CACHE_KEY, res.value);
                    }
                })
                .catch(() => {});
        }

        // ── Dynamic Projects Section Title & Description Sync ─────────
        const sectionTitleEl = document.getElementById('projects-section-title');
        const sectionDescEl = document.getElementById('projects-section-desc');
        if (sectionTitleEl || sectionDescEl) {
            const cachedTitle = localStorage.getItem('ar_projects_section_title');
            const cachedDesc = localStorage.getItem('ar_projects_section_desc');
            if (cachedTitle && sectionTitleEl) sectionTitleEl.textContent = cachedTitle;
            if (cachedDesc && sectionDescEl) sectionDescEl.textContent = cachedDesc;

            fetch(`${API_BASE_URL}/api/settings/projects_section_title`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && res.value && sectionTitleEl) {
                        sectionTitleEl.textContent = res.value;
                        localStorage.setItem('ar_projects_section_title', res.value);
                    }
                })
                .catch(() => {});

            fetch(`${API_BASE_URL}/api/settings/projects_section_desc`)
                .then(r => r.json())
                .then(res => {
                    if (res && res.success && res.value && sectionDescEl) {
                        sectionDescEl.textContent = res.value;
                        localStorage.setItem('ar_projects_section_desc', res.value);
                    }
                })
                .catch(() => {});
        }
    }


    /* ==========================================
    /* ==========================================
       WORKSPACE IMAGES & TEXT SYNC (Hero Slides & Sections)
       ========================================== */
    const heroSlides = document.querySelectorAll('.slider-section .slide');
    const introImgEl = document.getElementById('home-intro-img') || document.querySelector('.home-hero-img-wrapper img');
    const apartImgEl = document.getElementById('home-apart-img') || document.querySelector('.apart-img-col img');

    const updateWorkspaceContentInDOM = (key, val) => {
        if (!val) return;
        const cleanUrl = val.startsWith('../frontend/') ? val.replace('../frontend/', '') : val;
        const slideImgMatch = key.match(/^workspace_slide_(\d+)_image$/);
        const slideTitleMatch = key.match(/^workspace_slide_(\d+)_title$/);
        const slideSubMatch = key.match(/^workspace_slide_(\d+)_subtitle$/);

        if (slideImgMatch && heroSlides.length) {
            const slideNum = parseInt(slideImgMatch[1], 10);
            const slide = heroSlides[slideNum - 1];
            if (slide) {
                const img = slide.querySelector('img');
                if (img && img.src !== cleanUrl && img.getAttribute('src') !== cleanUrl) {
                    img.src = cleanUrl;
                }
            }
        } else if (slideTitleMatch) {
            const el = document.getElementById(`hero-slide-${slideTitleMatch[1]}-title`);
            if (el && el.textContent.trim() !== val.trim()) {
                el.textContent = val;
            }
        } else if (slideSubMatch) {
            const el = document.getElementById(`hero-slide-${slideSubMatch[1]}-subtitle`);
            if (el && el.textContent.trim() !== val.trim()) {
                el.textContent = val;
            }
        } else if (key === 'workspace_intro_image' && introImgEl) {
            if (introImgEl.src !== cleanUrl && introImgEl.getAttribute('src') !== cleanUrl) {
                introImgEl.src = cleanUrl;
            }
        } else if (key === 'workspace_apart_image' && apartImgEl) {
            if (apartImgEl.src !== cleanUrl && apartImgEl.getAttribute('src') !== cleanUrl) {
                apartImgEl.src = cleanUrl;
            }
        }
    };

    const workspaceKeys = [
        'workspace_slide_1_image',
        'workspace_slide_1_title',
        'workspace_slide_1_subtitle',
        'workspace_slide_2_image',
        'workspace_slide_2_title',
        'workspace_slide_2_subtitle',
        'workspace_slide_3_image',
        'workspace_slide_3_title',
        'workspace_slide_3_subtitle',
        'workspace_slide_4_image',
        'workspace_slide_4_title',
        'workspace_slide_4_subtitle',
        'workspace_intro_image',
        'workspace_apart_image'
    ];

    // Instantly apply cached values without network delay
    workspaceKeys.forEach(key => {
        const cacheKey = `ar_${key}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) updateWorkspaceContentInDOM(key, cached);
    });

    // Stagger background setting verification once the page is idle
    const syncSettingsInBackground = () => {
        workspaceKeys.forEach((key, idx) => {
            setTimeout(() => {
                fetch(`${API_BASE_URL}/api/settings/${key}`)
                    .then(r => r.json())
                    .then(res => {
                        if (res && res.success && res.value !== undefined) {
                            updateWorkspaceContentInDOM(key, res.value);
                            localStorage.setItem(`ar_${key}`, res.value);
                        }
                    })
                    .catch(() => {});
            }, idx * 120);
        });
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(syncSettingsInBackground, { timeout: 3000 });
    } else {
        setTimeout(syncSettingsInBackground, 1200);
    }

    // Real-time update via Socket.IO when admin saves a new setting or updates projects
    if (typeof io !== 'undefined') {
        try {
            const socket = io(API_BASE_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 15,
                reconnectionDelay: 2000
            });
            window.socket = socket;

            socket.on('connect', () => {
                console.log('⚡ Socket.IO real-time connected:', socket.id);
            });

            socket.on('site_setting_updated', ({ key, value }) => {
                console.log('⚡ Socket.IO site_setting_updated received:', key);
                if (workspaceKeys.includes(key) && value) {
                    updateWorkspaceContentInDOM(key, value);
                    localStorage.setItem(`ar_${key}`, value);
                }
                if (aboutKeys.includes(key) && value) {
                    updateAboutImageInDOM(key, value);
                    localStorage.setItem(`ar_${key}`, value);
                }
                if (servicesKeys.includes(key) && value) {
                    updateServicesImageInDOM(key, value);
                    localStorage.setItem(`ar_${key}`, value);
                }
                if (key === 'projects_hero_image') {
                    const img = document.querySelector('.projects-hero-cover img.hero-bg');
                    if (img && value) {
                        img.src = value;
                        localStorage.setItem('ar_projects_hero_image', value);
                    }
                }
                if (key === 'projects_section_title' && value) {
                    const titleEl = document.getElementById('projects-section-title');
                    if (titleEl) titleEl.textContent = value;
                    localStorage.setItem('ar_projects_section_title', value);
                }
                if (key === 'projects_section_desc' && value) {
                    const descEl = document.getElementById('projects-section-desc');
                    if (descEl) descEl.textContent = value;
                    localStorage.setItem('ar_projects_section_desc', value);
                }
                if (key === 'wayanad_modal_data' && value) {
                    const val = typeof value === 'string' ? JSON.parse(value) : value;
                    updateWayanadModalInDOM(val);
                    localStorage.setItem('ar_wayanad_modal_data', JSON.stringify(val));
                }
            });

            socket.on('projects_updated', (payload) => {
                console.log('⚡ Socket.IO projects_updated received:', payload);
                if (typeof window.fetchFreshProjects === 'function') {
                    window.fetchFreshProjects();
                } else if (typeof window.loadProjects === 'function') {
                    window.loadProjects();
                }
            });

            socket.on('refresh_projects', () => {
                if (typeof window.fetchFreshProjects === 'function') {
                    window.fetchFreshProjects();
                } else if (typeof window.loadProjects === 'function') {
                    window.loadProjects();
                }
            });
        } catch (e) {
            console.warn('Socket.IO connection warning:', e);
        }
    }

    /* ==========================================
       ABOUT US IMAGES SYNC (Hero, Get To Know Us, 9 Gallery Images)
       ========================================== */
    const updateAboutImageInDOM = (key, url) => {
        if (!url) return;
        const cleanUrl = url.startsWith('../frontend/') ? url.replace('../frontend/', '') : url;
        if (key === 'about_hero_image') {
            const heroImg = document.querySelector('.about-hero-cover img.hero-bg');
            if (heroImg) heroImg.src = cleanUrl;
        } else if (key === 'about_knowus_image') {
            const knowUsImg = document.querySelector('.about-know-us-img img');
            if (knowUsImg) knowUsImg.src = cleanUrl;
        } else {
            const galleryMatch = key.match(/^about_gallery_image_(\d+)$/);
            if (galleryMatch) {
                const idx = parseInt(galleryMatch[1], 10) - 1;
                const galleryImgs = document.querySelectorAll('.about-slider-track .about-slide img');
                if (galleryImgs && galleryImgs[idx]) {
                    galleryImgs[idx].src = cleanUrl;
                }
            }
        }
    };

    const aboutKeys = [
        'about_hero_image',
        'about_knowus_image',
        ...Array.from({ length: 9 }, (_, i) => `about_gallery_image_${i + 1}`)
    ];

    aboutKeys.forEach(key => {
        const cacheKey = `ar_${key}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) updateAboutImageInDOM(key, cached);

        fetch(`${API_BASE_URL}/api/settings/${key}`)
            .then(r => r.json())
            .then(res => {
                if (res && res.success && res.value) {
                    updateAboutImageInDOM(key, res.value);
                    localStorage.setItem(cacheKey, res.value);
                }
            })
            .catch(() => {});
    });

    /* ==========================================
       SERVICES IMAGES SYNC (Showcase & Mission Quote Section Images)
       ========================================== */
    const updateServicesImageInDOM = (key, url) => {
        if (!url) return;
        const cleanUrl = url.startsWith('../frontend/') ? url.replace('../frontend/', '') : url;
        const showcaseImgs = document.querySelectorAll('.lower-showcase-image-col img');
        const quoteImgs = document.querySelectorAll('.quote-image-panel img');
        if (key === 'services_showcase_image_1' && showcaseImgs[0]) {
            showcaseImgs[0].src = cleanUrl;
        } else if (key === 'services_showcase_image_2' && showcaseImgs[1]) {
            showcaseImgs[1].src = cleanUrl;
        } else if (key === 'services_quote_image_1' && quoteImgs[0]) {
            quoteImgs[0].src = cleanUrl;
        } else if (key === 'services_quote_image_2' && quoteImgs[1]) {
            quoteImgs[1].src = cleanUrl;
        }
    };

    const servicesKeys = [
        'services_showcase_image_1',
        'services_showcase_image_2',
        'services_quote_image_1',
        'services_quote_image_2'
    ];

    servicesKeys.forEach(key => {
        const cacheKey = `ar_${key}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) updateServicesImageInDOM(key, cached);

        fetch(`${API_BASE_URL}/api/settings/${key}`)
            .then(r => r.json())
            .then(res => {
                if (res && res.success && res.value) {
                    updateServicesImageInDOM(key, res.value);
                    localStorage.setItem(cacheKey, res.value);
                }
            })
            .catch(() => {});
    });


});
// Lightbox for Wayanad project gallery
function openWayanadGalleryLightbox(src) {
    let lb = document.getElementById('wg-lightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'wg-lightbox';
        lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
                const imgEl = document.createElement('img');
        imgEl.id = 'wg-lb-img';
        imgEl.alt = 'Project';
        imgEl.style.cssText = 'max-width:92vw;max-height:88vh;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,0.6);';
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute;top:18px;right:22px;background:transparent;border:none;color:#fff;font-size:1.8rem;cursor:pointer;line-height:1;';
        closeBtn.addEventListener('click', function() { lb.remove(); });
        lb.appendChild(imgEl);
        lb.appendChild(closeBtn);
        lb.addEventListener('click', (e) => { if (e.target === lb) lb.remove(); });
        document.body.appendChild(lb);
    }
    document.getElementById('wg-lb-img').src = src;
    lb.style.display = 'flex';
}
