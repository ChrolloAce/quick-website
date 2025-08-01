/**
 * SliderComponent - Creates and manages image slider functionality
 * Responsible for rendering slider, navigation, indicators, and user interactions
 */
window.SliderComponent = class SliderComponent {
    constructor(images = [], options = {}) {
        this.images = images;
        this.currentSlide = 0;
        this.autoPlayInterval = null;
        
        // Default options
        this.options = {
            autoPlay: true,
            autoPlayDelay: 3000,
            showIndicators: true,
            showNavigation: true,
            enableKeyboard: true,
            enableTouch: true,
            transitionDuration: 500,
            ...options
        };

        this.listeners = {};
        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    /**
     * Render the slider component
     */
    render(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        if (this.images.length === 0) {
            container.innerHTML = '<div class="no-images">No images to display</div>';
            return;
        }

        this.container = container;
        this.buildSliderHTML();
        this.initializeElements();
        this.bindEvents();
        this.startAutoPlay();
        
        return this.sliderElement;
    }

    /**
     * Build slider HTML structure
     */
    buildSliderHTML() {
        this.container.innerHTML = `
            <div class="slider-container" data-slider>
                <div class="slider-wrapper">
                    <div class="slider-track grid-view" data-track>
                        ${this.buildSlidesHTML()}
                    </div>
                    ${this.options.showNavigation ? this.buildNavigationHTML() : ''}
                    ${this.options.showIndicators ? this.buildIndicatorsHTML() : ''}
                </div>
            </div>
            <div class="lightbox" data-lightbox>
                <div class="lightbox-content">
                    <button class="lightbox-close" data-lightbox-close>×</button>
                    <img src="" alt="" data-lightbox-img>
                </div>
            </div>
        `;
    }

    /**
     * Build slides HTML
     */
    buildSlidesHTML() {
        return this.images.map((image, index) => `
            <div class="slider-slide compact" data-slide="${index}" data-lightbox-trigger>
                <img src="${image.src}" alt="${image.name}" loading="lazy">
            </div>
        `).join('');
    }

    /**
     * Build navigation HTML
     */
    buildNavigationHTML() {
        return `
            <button class="slider-nav prev" data-nav="prev" aria-label="Previous slide">
                &#8249;
            </button>
            <button class="slider-nav next" data-nav="next" aria-label="Next slide">
                &#8250;
            </button>
        `;
    }

    /**
     * Build indicators HTML
     */
    buildIndicatorsHTML() {
        const indicators = this.images.map((_, index) => 
            `<button class="slider-indicator ${index === 0 ? 'active' : ''}" 
                    data-indicator="${index}" 
                    aria-label="Go to slide ${index + 1}"></button>`
        ).join('');

        return `<div class="slider-indicators">${indicators}</div>`;
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.sliderElement = this.container.querySelector('[data-slider]');
        this.track = this.container.querySelector('[data-track]');
        this.slides = this.container.querySelectorAll('[data-slide]');
        this.prevBtn = this.container.querySelector('[data-nav="prev"]');
        this.nextBtn = this.container.querySelector('[data-nav="next"]');
        this.indicators = this.container.querySelectorAll('[data-indicator]');
        this.lightbox = this.container.querySelector('[data-lightbox]');
        this.lightboxImg = this.container.querySelector('[data-lightbox-img]');
        this.lightboxClose = this.container.querySelector('[data-lightbox-close]');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Keyboard navigation
        if (this.options.enableKeyboard) {
            this.bindKeyboardEvents();
        }

        // Touch events
        if (this.options.enableTouch) {
            this.bindTouchEvents();
        }

        // Pause on hover
        this.sliderElement.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.sliderElement.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Lightbox functionality
        this.bindLightboxEvents();
    }
    
    /**
     * Bind lightbox events
     */
    bindLightboxEvents() {
        // Click on images to open lightbox
        this.slides.forEach((slide, index) => {
            slide.addEventListener('click', () => this.openLightbox(index));
        });
        
        // Close lightbox events
        if (this.lightboxClose) {
            this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        }
        
        if (this.lightbox) {
            this.lightbox.addEventListener('click', (e) => {
                if (e.target === this.lightbox) {
                    this.closeLightbox();
                }
            });
        }
        
        // Keyboard navigation in lightbox
        document.addEventListener('keydown', (e) => {
            if (this.lightbox && this.lightbox.classList.contains('active')) {
                switch (e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.lightboxPrevious();
                        break;
                    case 'ArrowRight':
                        this.lightboxNext();
                        break;
                }
            }
        });
    }
    
    /**
     * Open lightbox with specific image
     */
    openLightbox(index) {
        if (!this.lightbox || !this.lightboxImg) return;
        
        this.currentLightboxIndex = index;
        const image = this.images[index];
        
        this.lightboxImg.src = image.src;
        this.lightboxImg.alt = image.name;
        
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close lightbox
     */
    closeLightbox() {
        if (!this.lightbox) return;
        
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    /**
     * Navigate to previous image in lightbox
     */
    lightboxPrevious() {
        const prevIndex = this.currentLightboxIndex === 0 
            ? this.images.length - 1 
            : this.currentLightboxIndex - 1;
        this.openLightbox(prevIndex);
    }
    
    /**
     * Navigate to next image in lightbox
     */
    lightboxNext() {
        const nextIndex = (this.currentLightboxIndex + 1) % this.images.length;
        this.openLightbox(nextIndex);
    }

    /**
     * Bind keyboard events
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.sliderElement.matches(':hover')) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case ' ': // Spacebar
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
            }
        });
    }

    /**
     * Bind touch events
     */
    bindTouchEvents() {
        this.sliderElement.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.sliderElement.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

    /**
     * Handle swipe gesture
     */
    handleSwipe() {
        const threshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    }

    /**
     * Go to next slide
     */
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.images.length;
        this.goToSlide(nextIndex);
    }

    /**
     * Go to previous slide
     */
    previousSlide() {
        const prevIndex = this.currentSlide === 0 
            ? this.images.length - 1 
            : this.currentSlide - 1;
        this.goToSlide(prevIndex);
    }

    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (index < 0 || index >= this.images.length || index === this.currentSlide) {
            return;
        }

        this.currentSlide = index;
        this.updateSlider();
        this.notifyListeners('slideChanged', {
            currentSlide: this.currentSlide,
            totalSlides: this.images.length
        });
    }

    /**
     * Update slider position and indicators
     */
    updateSlider() {
        const translateX = -this.currentSlide * 100;
        this.track.style.transform = `translateX(${translateX}%)`;

        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });

        // Update navigation button states
        if (this.prevBtn && this.nextBtn) {
            this.prevBtn.style.opacity = this.images.length <= 1 ? '0.5' : '1';
            this.nextBtn.style.opacity = this.images.length <= 1 ? '0.5' : '1';
        }
    }

    /**
     * Start auto play
     */
    startAutoPlay() {
        if (!this.options.autoPlay || this.images.length <= 1) return;
        
        this.pauseAutoPlay(); // Clear existing interval
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.options.autoPlayDelay);
    }

    /**
     * Pause auto play
     */
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    /**
     * Toggle auto play
     */
    toggleAutoPlay() {
        if (this.autoPlayInterval) {
            this.pauseAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    /**
     * Update images
     */
    updateImages(images) {
        this.images = images;
        this.currentSlide = 0;
        
        if (this.container) {
            this.render(this.container);
        }
    }

    /**
     * Destroy slider
     */
    destroy() {
        this.pauseAutoPlay();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.listeners = {};
    }

    /**
     * Get current slide info
     */
    getCurrentSlide() {
        return {
            index: this.currentSlide,
            image: this.images[this.currentSlide],
            total: this.images.length
        };
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index !== -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get slider configuration for embed
     */
    getEmbedConfig() {
        return {
            images: this.images.map(img => ({
                src: img.src,
                name: img.name
            })),
            options: this.options
        };
    }
} 