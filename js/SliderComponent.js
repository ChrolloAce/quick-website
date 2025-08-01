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
        this.totalPages = Math.ceil(this.images.length / 9); // 9 images per page (3x3)
        this.currentPage = 0;
        
        this.container.innerHTML = `
            <div class="slider-container" data-slider>
                <div class="slider-wrapper">
                    <div class="slider-track" data-track>
                        ${this.buildCurrentPageHTML()}
                    </div>
                    ${this.options.showNavigation && this.totalPages > 1 ? this.buildNavigationHTML() : ''}
                    ${this.options.showIndicators && this.totalPages > 1 ? this.buildPageIndicatorsHTML() : ''}
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
     * Build current page HTML (3x3 grid)
     */
    buildCurrentPageHTML() {
        const startIndex = this.currentPage * 9;
        const endIndex = Math.min(startIndex + 9, this.images.length);
        const pageImages = this.images.slice(startIndex, endIndex);
        
        return pageImages.map((image, index) => `
            <div class="slider-slide cube-item" data-slide="${startIndex + index}" data-lightbox-trigger>
                <img src="${image.src}" alt="${image.name}" loading="lazy">
            </div>
        `).join('');
    }

    /**
     * Build page indicators HTML
     */
    buildPageIndicatorsHTML() {
        const indicators = Array.from({ length: this.totalPages }, (_, index) => 
            `<button class="slider-indicator ${index === 0 ? 'active' : ''}" 
                    data-page="${index}" 
                    aria-label="Go to page ${index + 1}"></button>`
        ).join('');

        return `<div class="slider-indicators">${indicators}</div>`;
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
     * Navigate to next page (9 images)
     */
    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.updatePage();
        }
    }

    /**
     * Navigate to previous page (9 images)
     */
    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.updatePage();
        }
    }

    /**
     * Go to specific page
     */
    goToPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < this.totalPages && pageIndex !== this.currentPage) {
            this.currentPage = pageIndex;
            this.updatePage();
        }
    }

    /**
     * Update page content with smooth transition
     */
    updatePage() {
        const track = this.track;
        
        // Add transition class
        track.classList.add('paginating');
        
        setTimeout(() => {
            // Update content
            track.innerHTML = this.buildCurrentPageHTML();
            
            // Re-bind lightbox events for new images
            this.bindLightboxEventsForCurrentPage();
            
            // Update indicators
            this.updatePageIndicators();
            
            // Remove transition class
            track.classList.remove('paginating');
            
            // Update navigation button states
            this.updateNavigationStates();
            
        }, 200);
    }

    /**
     * Update page indicators
     */
    updatePageIndicators() {
        const indicators = this.container.querySelectorAll('[data-page]');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentPage);
        });
    }

    /**
     * Update navigation button states
     */
    updateNavigationStates() {
        if (this.prevBtn) {
            this.prevBtn.classList.toggle('disabled', this.currentPage === 0);
        }
        if (this.nextBtn) {
            this.nextBtn.classList.toggle('disabled', this.currentPage === this.totalPages - 1);
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.sliderElement = this.container.querySelector('[data-slider]');
        this.track = this.container.querySelector('[data-track]');
        this.prevBtn = this.container.querySelector('[data-nav="prev"]');
        this.nextBtn = this.container.querySelector('[data-nav="next"]');
        this.lightbox = this.container.querySelector('[data-lightbox]');
        this.lightboxImg = this.container.querySelector('[data-lightbox-img]');
        this.lightboxClose = this.container.querySelector('[data-lightbox-close]');
        
        // Update navigation states
        this.updateNavigationStates();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation buttons (now for pages)
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousPage());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPage());
        }

        // Page indicators
        const pageIndicators = this.container.querySelectorAll('[data-page]');
        pageIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToPage(index));
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
        this.bindLightboxEventsForCurrentPage();
    }

    /**
     * Bind lightbox events for current page images
     */
    bindLightboxEventsForCurrentPage() {
        const currentSlides = this.container.querySelectorAll('[data-slide]');
        currentSlides.forEach((slide) => {
            const slideIndex = parseInt(slide.getAttribute('data-slide'));
            slide.addEventListener('click', () => this.openLightbox(slideIndex));
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
     * Update images and rebuild grid
     */
    updateImages(images) {
        this.images = images;
        this.currentPage = 0;
        
        if (this.container) {
            this.render(this.container);
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