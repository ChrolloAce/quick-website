/**
 * PreviewManager - Manages slider preview functionality
 * Responsible for displaying preview, handling updates, and managing preview state
 */
window.PreviewManager = class PreviewManager {
    constructor() {
        this.slider = null;
        this.previewContainer = null;
        this.isVisible = false;
        this.currentImages = [];
        
        this.initializeElements();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.previewSection = document.getElementById('previewSection');
        this.previewContainer = document.getElementById('previewContainer');
        
        if (!this.previewSection || !this.previewContainer) {
            throw new Error('Preview elements not found');
        }
    }

    /**
     * Show preview with images
     */
    showPreview(images) {
        if (!images || images.length === 0) {
            this.hidePreview();
            return;
        }

        this.currentImages = images;
        this.createSlider(images);
        this.showPreviewSection();
    }

    /**
     * Create slider instance
     */
    createSlider(images) {
        // Destroy existing slider
        if (this.slider) {
            this.slider.destroy();
        }

        // Create new slider
        this.slider = new SliderComponent(images, {
            autoPlay: true,
            autoPlayDelay: 4000,
            showIndicators: true,
            showNavigation: true,
            enableKeyboard: true,
            enableTouch: true
        });

        // Render slider
        this.slider.render(this.previewContainer);
        
        // Add slide change listener
        this.slider.on('slideChanged', (data) => {
            this.onSlideChanged(data);
        });
    }

    /**
     * Show preview section
     */
    showPreviewSection() {
        if (!this.isVisible) {
            this.previewSection.style.display = 'block';
            this.previewSection.classList.add('fade-in');
            this.isVisible = true;
            
            // Scroll to preview
            setTimeout(() => {
                this.previewSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    /**
     * Hide preview section
     */
    hidePreview() {
        if (this.isVisible) {
            this.previewSection.style.display = 'none';
            this.previewSection.classList.remove('fade-in');
            this.isVisible = false;
        }

        if (this.slider) {
            this.slider.destroy();
            this.slider = null;
        }
    }

    /**
     * Update preview with new images
     */
    updatePreview(images) {
        if (images && images.length > 0) {
            this.showPreview(images);
        } else {
            this.hidePreview();
        }
    }

    /**
     * Regenerate slider with current images
     */
    regenerateSlider() {
        if (this.currentImages.length > 0) {
            this.createSlider(this.currentImages);
            this.showSuccessMessage('Slider regenerated successfully!');
        }
    }

    /**
     * Handle slide change events
     */
    onSlideChanged(data) {
        // Update URL hash if needed
        if (window.location.hash !== `#slide-${data.currentSlide}`) {
            history.replaceState(null, null, `#slide-${data.currentSlide}`);
        }
        
        // Fire custom event
        this.fireCustomEvent('previewSlideChanged', data);
    }

    /**
     * Get current slider configuration
     */
    getSliderConfig() {
        if (!this.slider) {
            return null;
        }

        return this.slider.getEmbedConfig();
    }

    /**
     * Update slider options
     */
    updateSliderOptions(options) {
        if (!this.slider) {
            return;
        }

        // Create new slider with updated options
        const currentImages = this.slider.images;
        this.slider.destroy();
        
        this.slider = new SliderComponent(currentImages, options);
        this.slider.render(this.previewContainer);
    }

    /**
     * Take screenshot of current slide
     */
    takeScreenshot(callback) {
        if (!this.slider || !this.previewContainer) {
            callback(null);
            return;
        }

        try {
            // Use html2canvas or similar library if available
            if (typeof html2canvas !== 'undefined') {
                html2canvas(this.previewContainer).then(canvas => {
                    callback(canvas.toDataURL('image/png'));
                });
            } else {
                // Fallback: get current slide image
                const currentSlide = this.slider.getCurrentSlide();
                if (currentSlide && currentSlide.image) {
                    callback(currentSlide.image.src);
                } else {
                    callback(null);
                }
            }
        } catch (error) {
            console.error('Error taking screenshot:', error);
            callback(null);
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        if (!this.slider) {
            return null;
        }

        return {
            totalImages: this.currentImages.length,
            currentSlide: this.slider.currentSlide,
            totalImageSize: this.calculateTotalImageSize(),
            averageImageSize: this.calculateAverageImageSize(),
            isAutoPlaying: this.slider.autoPlayInterval !== null
        };
    }

    /**
     * Calculate total image size
     */
    calculateTotalImageSize() {
        return this.currentImages.reduce((total, image) => {
            return total + (image.size || 0);
        }, 0);
    }

    /**
     * Calculate average image size
     */
    calculateAverageImageSize() {
        if (this.currentImages.length === 0) {
            return 0;
        }

        const total = this.calculateTotalImageSize();
        return Math.round(total / this.currentImages.length);
    }

    /**
     * Export preview as JSON
     */
    exportPreviewData() {
        return {
            images: this.currentImages,
            config: this.getSliderConfig(),
            metrics: this.getPerformanceMetrics(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import preview data
     */
    importPreviewData(data) {
        try {
            if (data.images && Array.isArray(data.images)) {
                this.showPreview(data.images);
                
                if (data.config && data.config.options) {
                    this.updateSliderOptions(data.config.options);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error importing preview data:', error);
        }
        
        return false;
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            z-index: 1000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Fire custom event
     */
    fireCustomEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Check if preview is visible
     */
    isPreviewVisible() {
        return this.isVisible;
    }

    /**
     * Get current images
     */
    getCurrentImages() {
        return [...this.currentImages];
    }

    /**
     * Destroy preview manager
     */
    destroy() {
        this.hidePreview();
        
        if (this.slider) {
            this.slider.destroy();
            this.slider = null;
        }
        
        this.currentImages = [];
        this.previewContainer = null;
        this.previewSection = null;
    }
} 