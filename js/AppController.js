/**
 * AppController - Main application controller
 * Coordinates all components and manages application state and user interactions
 */
window.AppController = class AppController {
    constructor() {
        this.imageUploadManager = null;
        this.previewManager = null;
        this.embedCodeGenerator = null;
        this.currentImages = [];
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.initializeComponents();
            this.bindEvents();
            this.setupEventListeners();
            this.isInitialized = true;
            
            console.log('AppController initialized successfully');
        } catch (error) {
            console.error('Error initializing AppController:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize all components
     */
    async initializeComponents() {
        // Initialize project manager
        this.projectManager = new ProjectManager();
        
        // Initialize image upload manager
        this.imageUploadManager = new ImageUploadManager();
        
        // Initialize web image extractor
        this.webImageExtractor = new WebImageExtractor();
        
        // Initialize preview manager
        this.previewManager = new PreviewManager();
        
        // Initialize embed code generator
        this.embedCodeGenerator = new EmbedCodeGenerator();
        
        // Set up component communication
        this.setupComponentCommunication();
    }

    /**
     * Set up component communication
     */
    setupComponentCommunication() {
        // Listen to project manager events
        this.projectManager.on('projectLoaded', (project) => {
            this.handleProjectLoaded(project);
        });

        this.projectManager.on('projectCreated', (project) => {
            this.handleProjectCreated(project);
        });

        // Listen to image upload events
        this.imageUploadManager.on('imagesUpdated', (images) => {
            this.handleImagesUpdated(images);
        });

        // Listen to web extraction events
        this.webImageExtractor.on('extractionStarted', (data) => {
            this.handleExtractionStarted(data);
        });

        this.webImageExtractor.on('extractionCompleted', (data) => {
            this.handleExtractionCompleted(data);
        });

        this.webImageExtractor.on('extractionError', (data) => {
            this.handleExtractionError(data);
        });

        this.webImageExtractor.on('processingProgress', (data) => {
            this.handleProcessingProgress(data);
        });
        
        // Listen to preview events
        document.addEventListener('previewSlideChanged', (event) => {
            this.handleSlideChanged(event.detail);
        });
    }

    /**
     * Bind UI events
     */
    bindEvents() {
        // Method tabs
        const methodTabs = document.querySelectorAll('.method-tab');
        methodTabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleMethodTabClick(tab));
        });

        // Extract images button
        const extractImagesBtn = document.getElementById('extractImagesBtn');
        if (extractImagesBtn) {
            extractImagesBtn.addEventListener('click', () => this.handleExtractImages());
        }

        // URL input enter key
        const websiteUrl = document.getElementById('websiteUrl');
        if (websiteUrl) {
            websiteUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleExtractImages();
                }
            });
        }

        // Regenerate button
        const regenerateBtn = document.getElementById('regenerateBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.handleRegenerateSlider());
        }

        // Generate code button
        const generateCodeBtn = document.getElementById('generateCodeBtn');
        if (generateCodeBtn) {
            generateCodeBtn.addEventListener('click', () => this.handleGenerateCode());
        }

        // Copy code button
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.handleCopyCode());
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Handle resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleWindowResize();
        }, 250));
    }

    /**
     * Handle project loaded event
     */
    handleProjectLoaded(project) {
        // Clear current images
        this.imageUploadManager.clearImages();
        
        // Load project images
        if (project.images && project.images.length > 0) {
            project.images.forEach(image => {
                this.imageUploadManager.addImage(image);
            });
            
            this.imageUploadManager.renderImages();
            this.currentImages = project.images;
            this.previewManager.updatePreview(project.images);
            this.updateAppState('preview');
        } else {
            this.currentImages = [];
            this.previewManager.hidePreview();
            this.hideEmbedSection();
            this.updateAppState('upload');
        }
    }

    /**
     * Handle project created event
     */
    handleProjectCreated(project) {
        this.currentImages = [];
        this.imageUploadManager.clearImages();
        this.previewManager.hidePreview();
        this.hideEmbedSection();
        this.updateAppState('upload');
    }

    /**
     * Handle images updated event
     */
    handleImagesUpdated(images) {
        this.currentImages = images;
        
        // Update current project with new images
        this.projectManager.updateProjectImages(images);
        
        if (images.length > 0) {
            this.previewManager.updatePreview(images);
            this.updateAppState('preview');
        } else {
            this.previewManager.hidePreview();
            this.hideEmbedSection();
            this.updateAppState('upload');
        }
    }

    /**
     * Handle slide changed event
     */
    handleSlideChanged(data) {
        // Update analytics or tracking if needed
        this.trackEvent('slide_changed', {
            current_slide: data.currentSlide,
            total_slides: data.totalSlides
        });
    }

    /**
     * Handle regenerate slider
     */
    handleRegenerateSlider() {
        if (this.currentImages.length === 0) {
            this.showError('No images to regenerate slider with');
            return;
        }

        try {
            this.previewManager.regenerateSlider();
            this.trackEvent('slider_regenerated', {
                image_count: this.currentImages.length
            });
        } catch (error) {
            console.error('Error regenerating slider:', error);
            this.showError('Failed to regenerate slider');
        }
    }

    /**
     * Handle generate embed code
     */
    handleGenerateCode() {
        if (this.currentImages.length === 0) {
            this.showError('No images to generate code for');
            return;
        }

        try {
            const currentProject = this.projectManager.getCurrentProject();
            
            if (!currentProject) {
                this.showError('Please save your project first to generate embed code');
                return;
            }
            
            const embedCode = this.projectManager.generateDynamicEmbedCode();

            this.displayEmbedCode(embedCode);
            this.showEmbedSection();
            this.updateAppState('embed');
            
            this.trackEvent('embed_code_generated', {
                project_id: currentProject.id,
                image_count: this.currentImages.length,
                code_length: embedCode.length
            });
        } catch (error) {
            console.error('Error generating embed code:', error);
            this.showError('Failed to generate embed code: ' + error.message);
        }
    }

    /**
     * Handle copy embed code
     */
    async handleCopyCode() {
        const embedTextarea = document.getElementById('embedCode');
        if (!embedTextarea || !embedTextarea.value) {
            this.showError('No embed code to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(embedTextarea.value);
            this.showSuccess('Embed code copied to clipboard!');
            
            // Update button text temporarily
            const copyBtn = document.getElementById('copyCodeBtn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Copied!
                `;
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }
            
            this.trackEvent('embed_code_copied');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            
            // Fallback: select text
            embedTextarea.select();
            embedTextarea.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.showSuccess('Embed code copied to clipboard!');
                this.trackEvent('embed_code_copied', { method: 'fallback' });
            } catch (fallbackError) {
                this.showError('Failed to copy code. Please select and copy manually.');
            }
        }
    }

    /**
     * Display embed code
     */
    displayEmbedCode(code) {
        const embedTextarea = document.getElementById('embedCode');
        if (embedTextarea) {
            embedTextarea.value = code;
        }
    }

    /**
     * Show embed section
     */
    showEmbedSection() {
        const embedSection = document.getElementById('embedSection');
        if (embedSection) {
            embedSection.style.display = 'block';
            embedSection.classList.add('fade-in');
            
            // Scroll to embed section
            setTimeout(() => {
                embedSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    /**
     * Hide embed section
     */
    hideEmbedSection() {
        const embedSection = document.getElementById('embedSection');
        if (embedSection) {
            embedSection.style.display = 'none';
            embedSection.classList.remove('fade-in');
        }
    }

    /**
     * Update application state
     */
    updateAppState(state) {
        document.body.setAttribute('data-app-state', state);
        
        // Update URL without page reload
        const newUrl = `${window.location.pathname}${state !== 'upload' ? '#' + state : ''}`;
        history.replaceState({ state }, '', newUrl);
    }

    /**
     * Handle browser back/forward navigation
     */
    handlePopState(event) {
        const state = event.state?.state || 'upload';
        
        switch (state) {
            case 'preview':
                if (this.currentImages.length > 0) {
                    this.previewManager.showPreview(this.currentImages);
                }
                break;
            case 'embed':
                if (this.currentImages.length > 0) {
                    this.handleGenerateCode();
                }
                break;
            default:
                this.previewManager.hidePreview();
                this.hideEmbedSection();
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause any animations or auto-play
            if (this.previewManager.slider) {
                this.previewManager.slider.pauseAutoPlay();
            }
        } else {
            // Page is visible, resume animations or auto-play
            if (this.previewManager.slider) {
                this.previewManager.slider.startAutoPlay();
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + C to copy embed code (when embed section is visible)
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            const embedSection = document.getElementById('embedSection');
            if (embedSection && embedSection.style.display !== 'none') {
                event.preventDefault();
                this.handleCopyCode();
            }
        }
        
        // Escape to clear everything
        if (event.key === 'Escape') {
            this.clearAll();
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Refresh slider if needed
        if (this.previewManager.slider && this.previewManager.isPreviewVisible()) {
            this.previewManager.slider.updateSlider();
        }
    }

    /**
     * Handle method tab clicks
     */
    handleMethodTabClick(clickedTab) {
        const method = clickedTab.getAttribute('data-method');
        
        // Update tab states
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        clickedTab.classList.add('active');
        
        // Update method visibility
        document.querySelectorAll('.upload-method').forEach(methodDiv => {
            methodDiv.classList.remove('active');
        });
        
        const targetMethod = document.getElementById(method + 'Method');
        if (targetMethod) {
            targetMethod.classList.add('active');
        }
        
        this.trackEvent('method_switched', { method });
    }

    /**
     * Handle extract images from website
     */
    async handleExtractImages() {
        const urlInput = document.getElementById('websiteUrl');
        if (!urlInput || !urlInput.value.trim()) {
            this.showError('Please enter a website URL');
            return;
        }

        const url = urlInput.value.trim();
        
        try {
            await this.webImageExtractor.extractImages(url);
        } catch (error) {
            // Error is handled by extraction event listeners
        }
    }

    /**
     * Handle extraction started
     */
    handleExtractionStarted(data) {
        const progressDiv = document.getElementById('extractionProgress');
        const extractBtn = document.getElementById('extractImagesBtn');
        
        if (progressDiv) {
            progressDiv.style.display = 'block';
            progressDiv.querySelector('.progress-text').textContent = 'Extracting images from website...';
            progressDiv.querySelector('.progress-fill').style.width = '20%';
        }
        
        if (extractBtn) {
            extractBtn.disabled = true;
            extractBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.69 0 1.36.08 2 .22"></path>
                </svg>
                Extracting...
            `;
        }
        
        this.trackEvent('extraction_started', { url: data.url });
    }

    /**
     * Handle extraction completed
     */
    handleExtractionCompleted(data) {
        const progressDiv = document.getElementById('extractionProgress');
        const extractBtn = document.getElementById('extractImagesBtn');
        
        if (progressDiv) {
            progressDiv.querySelector('.progress-fill').style.width = '100%';
            progressDiv.querySelector('.progress-text').textContent = `Extracted ${data.images.length} images successfully!`;
            
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 2000);
        }
        
        if (extractBtn) {
            extractBtn.disabled = false;
            extractBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Extract Images
            `;
        }
        
        // Add extracted images to the upload manager
        data.images.forEach(image => {
            this.imageUploadManager.addImage(image);
        });
        
        this.imageUploadManager.renderImages();
        this.handleImagesUpdated(this.imageUploadManager.getImages());
        
        this.showSuccess(`Successfully extracted ${data.images.length} images from website!`);
        this.trackEvent('extraction_completed', { 
            url: data.url, 
            imageCount: data.images.length 
        });
    }

    /**
     * Handle extraction error
     */
    handleExtractionError(data) {
        const progressDiv = document.getElementById('extractionProgress');
        const extractBtn = document.getElementById('extractImagesBtn');
        
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        
        if (extractBtn) {
            extractBtn.disabled = false;
            extractBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Extract Images
            `;
        }
        
        this.showError(`Failed to extract images: ${data.error}`);
        this.trackEvent('extraction_error', { 
            url: data.url, 
            error: data.error 
        });
    }

    /**
     * Handle processing progress
     */
    handleProcessingProgress(data) {
        const progressDiv = document.getElementById('extractionProgress');
        
        if (progressDiv) {
            const progress = Math.round((data.current / data.total) * 60) + 20; // 20-80%
            progressDiv.querySelector('.progress-fill').style.width = `${progress}%`;
            progressDiv.querySelector('.progress-text').textContent = 
                `Processing images... ${data.current}/${data.total}`;
        }
    }

    /**
     * Clear all data and reset application
     */
    clearAll() {
        if (confirm('Are you sure you want to clear all images and start over?')) {
            this.imageUploadManager.clearImages();
            this.previewManager.hidePreview();
            this.hideEmbedSection();
            this.currentImages = [];
            this.updateAppState('upload');
            
            // Reset URL input
            const urlInput = document.getElementById('websiteUrl');
            if (urlInput) {
                urlInput.value = '';
            }
            
            this.showSuccess('Application reset successfully');
            this.trackEvent('app_reset');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            error: '#dc3545',
            success: '#28a745',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }

    /**
     * Track events (analytics placeholder)
     */
    trackEvent(eventName, properties = {}) {
        // Implement analytics tracking here
        console.log('Event tracked:', eventName, properties);
        
        // Example: Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', eventName, properties);
        // }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get application state
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            imageCount: this.currentImages.length,
            currentState: document.body.getAttribute('data-app-state'),
            previewVisible: this.previewManager.isPreviewVisible()
        };
    }

    /**
     * Destroy application
     */
    destroy() {
        if (this.imageUploadManager) {
            this.imageUploadManager = null;
        }
        
        if (this.previewManager) {
            this.previewManager.destroy();
            this.previewManager = null;
        }
        
        this.embedCodeGenerator = null;
        this.currentImages = [];
        this.isInitialized = false;
    }
} 