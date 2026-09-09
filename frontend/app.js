document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // PRODUCTION API BASE URL (Render Backend)
    // ==========================================================

    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:9100'
        : 'https://ar-constructions-realtors.onrender.com';

    // ==========================================================
    // BACKGROUND WAKE-UP PING (prevents Render cold-start delay)
    // Fires silently on every page so the backend is warm by the
    // time the user reaches the Projects page.
    // ==========================================================
    if (!window.location.pathname.includes('projects.html')) {
        fetch(`${API_BASE_URL}/api/projects`).catch(() => {});
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
       PREVENT RELOAD ON CURRENT-PAGE NAV LINKS
       ========================================== */

    const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const currentPage = window.location.href.split('?')[0].split('#')[0];

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const linkHref = link.href.split('?')[0].split('#')[0];
            if (linkHref === currentPage) {
                e.preventDefault();
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
                    serviceSelect.value = val;

                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    customDropdown.classList.remove('active');
                    syncDropdownState();
                    validateField(serviceSelect, serviceSelect.value !== '', group);
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
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.project-card').forEach(c => {
                if (c !== card) c.classList.remove('active');
            });
            card.classList.toggle('active');
        });
    });

    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {

        // ── Cache helpers ──────────────────────────────────────────
        const CACHE_KEY     = 'ar_projects_cache';
        const CACHE_TTL_MS  = 10 * 60 * 1000;   // 10 minutes

        const readCache = () => {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (!raw) return null;
                const { ts, data } = JSON.parse(raw);
                if (Date.now() - ts > CACHE_TTL_MS) return null;   // expired
                return data;
            } catch { return null; }
        };

        const writeCache = (data) => {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
            } catch {}
        };

        // ── Render a list of project objects into the grid ─────────
        const attachCardListeners = () => {
            document.querySelectorAll('.project-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.project-card').forEach(c => {
                        if (c !== card) c.classList.remove('active');
                    });
                    card.classList.toggle('active');
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

            projectsGrid.innerHTML = data.map(p => {
                const imgUrl = (p.images && p.images.length > 0 && p.images[0])
                    ? p.images[0]
                    : 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80';

                const displayTitle = p.title
                    ? p.title
                    : (p.location
                        ? `${p.category || 'Project'} (${p.location})`
                        : (p.category || 'Project'));

                const clientText = p.location
                    ? `${p.category || 'Residential'} • ${p.location}`
                    : (p.description || p.category || 'Custom Project');

                return `
                    <div class="project-card animate-up reveal-active" tabindex="0">
                        <img class="project-img" src="${imgUrl}"
                             onerror="this.src='https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'"
                             loading="eager"
                             decoding="async"
                             alt="${displayTitle}">
                        <div class="project-overlay">
                            <h3 class="project-title">${displayTitle}</h3>
                            <p class="project-client">${clientText}</p>
                        </div>
                    </div>`;
            }).join('');

            attachCardListeners();
        };

        // ── Skeleton placeholders (first visit only) ───────────────
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
                    if (!silent) renderProjects(result.data);       // first-time visitor
                    else         renderProjects(result.data);       // silently refresh view
                } else {
                    if (!silent) showError();
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                if (!silent) showError();
            }
        };

        // ── Main entry: stale-while-revalidate ─────────────────────
        const loadProjects = () => {
            // Immediately activate interactions on pre-rendered or existing cards
            attachCardListeners();

            const cached = readCache();

            if (cached) {
                // ✅ Cached data → render and keep interactive
                renderProjects(cached);
                fetchFresh(true);       // silent background refresh
            } else {
                // If pre-rendered HTML cards already exist in DOM, keep them visible!
                // Only show skeletons if grid is completely empty
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

        loadProjects();
    }


});