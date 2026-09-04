document.addEventListener('DOMContentLoaded', () => {
    
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
    handleScroll(); // Initial check on load
    
    /* ==========================================
       MOBILE NAV DRAWER TOGGLE & MINIMIZE HANDLERS
       ========================================== */
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (mobileDrawer) {
        // Ensure overlay element exists for backdrop click minimize
        let mobileOverlay = document.querySelector('.mobile-nav-overlay');
        if (!mobileOverlay) {
            mobileOverlay = document.createElement('div');
            mobileOverlay.className = 'mobile-nav-overlay';
            document.body.appendChild(mobileOverlay);
        }

        // Ensure 3-lines minimize button inside drawer exists
        let drawerCloseBtn = mobileDrawer.querySelector('.mobile-drawer-close');
        if (!drawerCloseBtn) {
            drawerCloseBtn = document.createElement('button');
            drawerCloseBtn.className = 'mobile-drawer-close';
            drawerCloseBtn.setAttribute('aria-label', 'Minimize menu');
            drawerCloseBtn.setAttribute('title', 'Minimize menu');
            drawerCloseBtn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
            mobileDrawer.insertBefore(drawerCloseBtn, mobileDrawer.firstChild);
        }

        const openMenu = () => {
            if (mobileToggle) mobileToggle.classList.add('active');
            mobileDrawer.classList.add('active');
            if (mobileOverlay) mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            if (mobileToggle) mobileToggle.classList.remove('active');
            mobileDrawer.classList.remove('active');
            if (mobileOverlay) mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        const toggleMenu = () => {
            if (mobileDrawer.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        };

        if (mobileToggle) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMenu();
            });
        }

        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMenu();
            });
        }

        // Close drawer when clicking backdrop overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                closeMenu();
            });
        }

        // Close drawer when clicking outside side nav
        document.addEventListener('click', (e) => {
            if (mobileDrawer.classList.contains('active')) {
                if (!mobileDrawer.contains(e.target) && (!mobileToggle || !mobileToggle.contains(e.target))) {
                    closeMenu();
                }
            }
        });

        // Close drawer when clicking a mobile nav link
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileDrawer.classList.contains('active')) {
                    closeMenu();
                }
            });
        });

        // Close drawer when resizing screen beyond mobile width
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && mobileDrawer.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    /* ==========================================
       MOBILE TOUCH/TAP CARD FLIPPING
       ========================================== */
    const cardWrappers = document.querySelectorAll('.info-card-wrapper');
    
    cardWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            // Check if user clicked an anchor tag (to let links function correctly)
            if (e.target.closest('a')) return;
            
            // Toggle flipped state on click (supports tap interaction on mobile)
            wrapper.classList.toggle('flipped');
            
            // Un-flip other cards
            cardWrappers.forEach(otherWrapper => {
                if (otherWrapper !== wrapper) {
                    otherWrapper.classList.remove('flipped');
                }
            });
        });
    });

    /* ==========================================
       SCROLL REVEAL ANIMATIONS (IntersectionObserver)
       ========================================== */
    const animElements = document.querySelectorAll('.animate-up, .animate-left, .animate-right, .animate-fade');
    
    const observerOptions = {
        root: null,
        threshold: 0.12, // Trigger when 12% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Offset trigger point slightly from screen bottom
    };
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target); // Reveal once only
            }
        });
    };
    
    const observer = new IntersectionObserver(revealCallback, observerOptions);
    
    animElements.forEach(el => observer.observe(el));

    /* ==========================================
       HERO CAROUSEL / SLIDER
       ========================================== */
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    
    if (slides.length > 0) {
        let currentSlide = 0;
        let slideInterval;
        const intervalTime = 6000; // Slide rotation speed: 6s
        
        const goToSlide = (n) => {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = (n + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        };
        
        const nextSlide = () => {
            goToSlide(currentSlide + 1);
        };
        
        const prevSlide = () => {
            goToSlide(currentSlide - 1);
        };
        
        const startSlideShow = () => {
            slideInterval = setInterval(nextSlide, intervalTime);
        };
        
        const stopSlideShow = () => {
            clearInterval(slideInterval);
        };
        
        // Navigation button listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                stopSlideShow();
                startSlideShow(); // Reset timer
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                stopSlideShow();
                startSlideShow(); // Reset timer
            });
        }
        
        // Dot indicator listeners
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                stopSlideShow();
                startSlideShow(); // Reset timer
            });
        });
        
        // Initialize slideshow
        startSlideShow();
    }

    /* ==========================================
       FORM VALIDATION & ASYNC SUBMISSION
       ========================================== */
    const form = document.getElementById('contact-form');
    if (form) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const successModal = document.getElementById('success-modal');
        const closeModalBtn = document.getElementById('close-modal');

        // Email regex check
        const isValidEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        // Show/Hide field errors
        const validateField = (input, condition, parentGroup) => {
            if (condition) {
                parentGroup.classList.remove('invalid');
                return true;
            } else {
                parentGroup.classList.add('invalid');
                return false;
            }
        };

        // Live validation on input
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                const group = nameInput.closest('.form-group');
                validateField(nameInput, nameInput.value.trim() !== '', group);
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const group = emailInput.closest('.form-group');
                validateField(emailInput, isValidEmail(emailInput.value.trim()), group);
            });
        }

        const serviceSelect = document.getElementById('service');
        const customDropdown = document.getElementById('custom-service-dropdown');

        if (customDropdown && serviceSelect) {
            const trigger = customDropdown.querySelector('.custom-dropdown-trigger');
            const selectedText = customDropdown.querySelector('.custom-dropdown-selected');
            const items = customDropdown.querySelectorAll('.custom-dropdown-item');
            const group = customDropdown.closest('.form-group');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                customDropdown.classList.toggle('active');
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = item.getAttribute('data-value');
                    selectedText.textContent = item.textContent;
                    serviceSelect.value = val;

                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    customDropdown.classList.remove('active');
                    group.classList.add('has-value');
                    validateField(serviceSelect, serviceSelect.value !== '', group);
                });
            });

            document.addEventListener('click', () => {
                customDropdown.classList.remove('active');
            });
        } else if (serviceSelect) {
            serviceSelect.addEventListener('change', () => {
                const group = serviceSelect.closest('.form-group');
                validateField(serviceSelect, serviceSelect.value !== '', group);
            });
        }

        // Form submit listener
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nameGroup = nameInput.closest('.form-group');
            const emailGroup = emailInput.closest('.form-group');
            const serviceGroup = serviceSelect ? serviceSelect.closest('.form-group') : null;
            const subjectInput = document.getElementById('subject');
            const phoneInput = document.getElementById('phone');
            const messageInput = document.getElementById('message');
            
            const isNameValid = validateField(nameInput, nameInput.value.trim() !== '', nameGroup);
            const isEmailValid = validateField(emailInput, isValidEmail(emailInput.value.trim()), emailGroup);
            const isServiceValid = serviceSelect ? validateField(serviceSelect, serviceSelect.value !== '', serviceGroup) : true;
            
            if (isNameValid && isEmailValid && isServiceValid) {
                submitBtn.disabled = true;
                btnText.textContent = 'Sending...';
                submitBtn.querySelector('.btn-icon').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                
                const selectedService = serviceSelect ? serviceSelect.value : '';
                const payload = {
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    phone: phoneInput ? phoneInput.value.trim() : '',
                    service: selectedService,
                    subject: selectedService ? `Service: ${selectedService}` : (subjectInput ? subjectInput.value.trim() : 'General Inquiry'),
                    message: messageInput ? messageInput.value.trim() : '',
                    source: 'website-contact-form'
                };

                try {
                    const response = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        if (successModal) successModal.classList.add('active');
                        form.reset();
                        if (customDropdown) {
                            const selectedText = customDropdown.querySelector('.custom-dropdown-selected');
                            if (selectedText) selectedText.textContent = '';
                            customDropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
                        }
                        document.querySelectorAll('.form-group').forEach(group => {
                            group.classList.remove('invalid', 'has-value');
                        });
                    } else {
                        alert(data.message || 'Unable to submit your inquiry. Please try again.');
                    }
                } catch (err) {
                    console.error('Contact Form Submit Error:', err);
                    alert('Could not connect to server. Please check your network and try again.');
                } finally {
                    submitBtn.disabled = false;
                    btnText.textContent = 'Send Message';
                    submitBtn.querySelector('.btn-icon').innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
                }
            }
        });

        // Close Modal event
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (successModal) successModal.classList.remove('active');
            });
        }

        // Close modal when clicking on overlay background
        if (successModal) {
            successModal.addEventListener('click', (e) => {
                if (e.target === successModal) {
                    successModal.classList.remove('active');
                }
            });
        }
    }

    /* ==========================================
       TESTIMONIALS SLIDER
       ========================================== */
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');
    
    if (testimonialSlides.length > 0) {
        let currentTestimonial = 0;
        let testimonialInterval;
        const intervalTime = 5000; // Auto rotation: 5s
        
        const goToTestimonial = (n) => {
            testimonialSlides[currentTestimonial].classList.remove('active');
            testimonialDots[currentTestimonial].classList.remove('active');
            currentTestimonial = (n + testimonialSlides.length) % testimonialSlides.length;
            testimonialSlides[currentTestimonial].classList.add('active');
            testimonialDots[currentTestimonial].classList.add('active');
        };
        
        const nextTestimonial = () => {
            goToTestimonial(currentTestimonial + 1);
        };
        
        const startTestimonialShow = () => {
            testimonialInterval = setInterval(nextTestimonial, intervalTime);
        };
        
        const stopTestimonialShow = () => {
            clearInterval(testimonialInterval);
        };
        
        // Dot indicator listeners
        testimonialDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToTestimonial(index);
                stopTestimonialShow();
                startTestimonialShow(); // Reset timer
            });
        });
        
        // Initialize
        startTestimonialShow();
    }

    /* ==========================================
       ABOUT PAGE PROJECTS SLIDER
       ========================================== */
    const aboutTrack = document.querySelector('.about-slider-track');
    const aboutSlides = document.querySelectorAll('.about-slide');
    const aboutPrevBtn = document.querySelector('.about-slider-arrow.prev');
    const aboutNextBtn = document.querySelector('.about-slider-arrow.next');
    
    if (aboutTrack && aboutSlides.length > 0) {
        let currentAboutSlide = 0;
        let aboutInterval;
        const intervalTime = 4000; // Auto rotate: 4s
        
        const goToAboutSlide = (n) => {
            currentAboutSlide = (n + aboutSlides.length) % aboutSlides.length;
            aboutTrack.style.transform = `translateX(-${currentAboutSlide * 100}%)`;
        };
        
        const nextAboutSlide = () => {
            goToAboutSlide(currentAboutSlide + 1);
        };
        
        const prevAboutSlide = () => {
            goToAboutSlide(currentAboutSlide - 1);
        };
        
        const startAboutShow = () => {
            aboutInterval = setInterval(nextAboutSlide, intervalTime);
        };
        
        const stopAboutShow = () => {
            clearInterval(aboutInterval);
        };
        
        if (aboutNextBtn) {
            aboutNextBtn.addEventListener('click', () => {
                nextAboutSlide();
                stopAboutShow();
                startAboutShow(); // Reset timer
            });
        }
        
        if (aboutPrevBtn) {
            aboutPrevBtn.addEventListener('click', () => {
                prevAboutSlide();
                stopAboutShow();
                startAboutShow(); // Reset timer
            });
        }
        
        // Initialize
        startAboutShow();
    }

});
