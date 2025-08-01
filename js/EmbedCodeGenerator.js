/**
 * EmbedCodeGenerator - Generates embeddable slider code
 * Responsible for creating standalone HTML, CSS, and JS code for external websites
 */
window.EmbedCodeGenerator = class EmbedCodeGenerator {
    constructor() {
        this.version = '1.0.0';
        this.cdnBase = 'https://cdn.jsdelivr.net/gh/yourusername/slider-embed@latest';
    }

    /**
     * Generate complete embed code
     */
    generateEmbedCode(images, options = {}) {
        if (!images || images.length === 0) {
            throw new Error('Images array is required and cannot be empty');
        }

        const config = this.prepareConfig(images, options);
        return this.buildEmbedHTML(config);
    }

    /**
     * Prepare configuration object
     */
    prepareConfig(images, options) {
        return {
            images: images.map(img => ({
                src: img.src,
                name: img.name || 'Image'
            })),
            options: {
                autoPlay: options.autoPlay !== false,
                autoPlayDelay: options.autoPlayDelay || 3000,
                showIndicators: options.showIndicators !== false,
                showNavigation: options.showNavigation !== false,
                enableKeyboard: options.enableKeyboard !== false,
                enableTouch: options.enableTouch !== false,
                width: options.width || '100%',
                height: options.height || '400px',
                borderRadius: options.borderRadius || '12px',
                ...options
            }
        };
    }

    /**
     * Build complete embed HTML
     */
    buildEmbedHTML(config) {
        const sliderId = 'slider_' + Date.now();
        
        return `<!-- Image Slider Embed v${this.version} -->
<div id="${sliderId}" class="image-slider-embed"></div>

<style>
${this.generateCSS(sliderId, config.options)}
</style>

<script>
${this.generateJavaScript(sliderId, config)}
</script>`;
    }

    /**
     * Generate CSS for the slider
     */
    generateCSS(sliderId, options) {
        return `
/* Image Slider Styles */
#${sliderId} {
    width: ${options.width};
    max-width: 100%;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#${sliderId} .slider-container {
    position: relative;
    width: 100%;
    height: ${options.height};
    background: #f8f9fa;
    border-radius: ${options.borderRadius};
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

#${sliderId} .slider-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

#${sliderId} .slider-track {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

#${sliderId} .slider-slide {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    position: relative;
}

#${sliderId} .slider-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

#${sliderId} .slider-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #333;
    transition: all 0.3s ease;
    z-index: 10;
    user-select: none;
}

#${sliderId} .slider-nav:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-50%) scale(1.1);
}

#${sliderId} .slider-nav:active {
    transform: translateY(-50%) scale(0.95);
}

#${sliderId} .slider-nav.prev {
    left: 15px;
}

#${sliderId} .slider-nav.next {
    right: 15px;
}

#${sliderId} .slider-indicators {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
}

#${sliderId} .slider-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
}

#${sliderId} .slider-indicator:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.2);
}

#${sliderId} .slider-indicator.active {
    background: white;
    transform: scale(1.2);
}

#${sliderId} .no-images {
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${options.height};
    color: #666;
    font-size: 1.1rem;
    background: #f8f9fa;
    border-radius: ${options.borderRadius};
}

/* Responsive Design */
@media (max-width: 768px) {
    #${sliderId} .slider-container {
        height: 250px;
    }
    
    #${sliderId} .slider-nav {
        width: 40px;
        height: 40px;
        font-size: 16px;
    }
    
    #${sliderId} .slider-nav.prev {
        left: 10px;
    }
    
    #${sliderId} .slider-nav.next {
        right: 10px;
    }
    
    #${sliderId} .slider-indicators {
        bottom: 15px;
    }
    
    #${sliderId} .slider-indicator {
        width: 10px;
        height: 10px;
    }
}

@media (max-width: 480px) {
    #${sliderId} .slider-container {
        height: 200px;
        border-radius: 8px;
    }
    
    #${sliderId} .slider-nav {
        width: 35px;
        height: 35px;
        font-size: 14px;
    }
}
`.trim();
    }

    /**
     * Generate JavaScript for the slider
     */
    generateJavaScript(sliderId, config) {
        return `
(function() {
    'use strict';
    
    // Configuration
    const config = ${JSON.stringify(config, null, 2)};
    const container = document.getElementById('${sliderId}');
    
    if (!container) {
        console.error('Slider container not found');
        return;
    }
    
    // Slider state
    let currentSlide = 0;
    let autoPlayInterval = null;
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Initialize slider
    function initSlider() {
        if (config.images.length === 0) {
            container.innerHTML = '<div class="no-images">No images to display</div>';
            return;
        }
        
        renderSlider();
        bindEvents();
        startAutoPlay();
    }
    
    // Render slider HTML
    function renderSlider() {
        const slidesHTML = config.images.map((image, index) => 
            '<div class="slider-slide"><img src="' + image.src + '" alt="' + image.name + '" loading="lazy"></div>'
        ).join('');
        
        const navHTML = config.options.showNavigation ? 
            '<button class="slider-nav prev" data-nav="prev">&#8249;</button>' +
            '<button class="slider-nav next" data-nav="next">&#8250;</button>' : '';
        
        const indicatorsHTML = config.options.showIndicators ?
            '<div class="slider-indicators">' +
            config.images.map((_, index) => 
                '<button class="slider-indicator' + (index === 0 ? ' active' : '') + '" data-indicator="' + index + '"></button>'
            ).join('') +
            '</div>' : '';
        
        container.innerHTML = 
            '<div class="slider-container">' +
                '<div class="slider-wrapper">' +
                    '<div class="slider-track">' + slidesHTML + '</div>' +
                    navHTML + indicatorsHTML +
                '</div>' +
            '</div>';
    }
    
    // Bind event listeners
    function bindEvents() {
        const track = container.querySelector('.slider-track');
        const prevBtn = container.querySelector('[data-nav="prev"]');
        const nextBtn = container.querySelector('[data-nav="next"]');
        const indicators = container.querySelectorAll('[data-indicator]');
        const sliderContainer = container.querySelector('.slider-container');
        
        // Navigation buttons
        if (prevBtn) prevBtn.addEventListener('click', previousSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        
        // Indicators
        indicators.forEach(function(indicator, index) {
            indicator.addEventListener('click', function() {
                goToSlide(index);
            });
        });
        
        // Touch events
        if (config.options.enableTouch && sliderContainer) {
            sliderContainer.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            sliderContainer.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
        }
        
        // Keyboard events
        if (config.options.enableKeyboard) {
            document.addEventListener('keydown', function(e) {
                if (!container.contains(document.activeElement)) return;
                
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        previousSlide();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        nextSlide();
                        break;
                }
            });
        }
        
        // Pause on hover
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', pauseAutoPlay);
            sliderContainer.addEventListener('mouseleave', startAutoPlay);
        }
    }
    
    // Navigation functions
    function nextSlide() {
        goToSlide((currentSlide + 1) % config.images.length);
    }
    
    function previousSlide() {
        goToSlide(currentSlide === 0 ? config.images.length - 1 : currentSlide - 1);
    }
    
    function goToSlide(index) {
        if (index < 0 || index >= config.images.length || index === currentSlide) return;
        
        currentSlide = index;
        updateSlider();
    }
    
    function updateSlider() {
        const track = container.querySelector('.slider-track');
        const indicators = container.querySelectorAll('[data-indicator]');
        
        if (track) {
            track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
        }
        
        indicators.forEach(function(indicator, index) {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }
    
    function handleSwipe() {
        const threshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                previousSlide();
            }
        }
    }
    
    function startAutoPlay() {
        if (!config.options.autoPlay || config.images.length <= 1) return;
        
        pauseAutoPlay();
        autoPlayInterval = setInterval(nextSlide, config.options.autoPlayDelay);
    }
    
    function pauseAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlider);
    } else {
        initSlider();
    }
})();
`.trim();
    }

    /**
     * Generate lightweight embed code (CDN version)
     */
    generateLightweightEmbed(images, options = {}) {
        const config = this.prepareConfig(images, options);
        const sliderId = 'slider_' + Date.now();
        
        return `<!-- Lightweight Image Slider Embed -->
<div id="${sliderId}" data-slider-config='${JSON.stringify(config)}'></div>
<script src="${this.cdnBase}/slider-embed.min.js"></script>`;
    }

    /**
     * Generate WordPress shortcode
     */
    generateWordPressShortcode(images, options = {}) {
        const imageUrls = images.map(img => img.src).join(',');
        const optionsStr = Object.entries(options)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
        
        return `[image_slider images="${imageUrls}" ${optionsStr}]`;
    }

    /**
     * Generate React component code
     */
    generateReactComponent(images, options = {}) {
        const config = this.prepareConfig(images, options);
        
        return `import React, { useEffect } from 'react';

const ImageSlider = () => {
    useEffect(() => {
        ${this.generateJavaScript('react-slider', config)}
    }, []);

    return (
        <div id="react-slider" className="image-slider-embed"></div>
    );
};

export default ImageSlider;`;
    }

    /**
     * Validate images for embed
     */
    validateImages(images) {
        if (!Array.isArray(images) || images.length === 0) {
            return { valid: false, error: 'Images array is required and cannot be empty' };
        }

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (!image.src) {
                return { valid: false, error: `Image at index ${i} missing src property` };
            }
        }

        return { valid: true };
    }
} 