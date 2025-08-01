/**
 * ImageUploadManager - Handles image upload functionality
 * Responsible for file uploads, drag & drop, validation, and image management
 */
window.ImageUploadManager = class ImageUploadManager {
    constructor() {
        this.images = [];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.listeners = {};
        
        this.initializeElements();
        this.bindEvents();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadedImagesContainer = document.getElementById('uploadedImages');
        
        if (!this.uploadArea || !this.fileInput || !this.uploadedImagesContainer) {
            throw new Error('Required DOM elements not found');
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Upload area click
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    }

    /**
     * Handle file selection from input
     */
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
        // Reset input value to allow same file to be selected again
        event.target.value = '';
    }

    /**
     * Handle drag over event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * Handle drop event
     */
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    /**
     * Process uploaded files
     */
    async processFiles(files) {
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showError('No valid image files found');
            return;
        }

        for (const file of validFiles) {
            try {
                const imageData = await this.processFile(file);
                this.addImage(imageData);
            } catch (error) {
                console.error('Error processing file:', error);
                this.showError(`Error processing ${file.name}`);
            }
        }

        this.renderImages();
        this.notifyListeners('imagesUpdated', this.images);
    }

    /**
     * Validate file type and size
     */
    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            this.showError(`${file.name}: Invalid file type. Please use JPG, PNG, GIF, or WebP.`);
            return false;
        }

        if (file.size > this.maxFileSize) {
            this.showError(`${file.name}: File too large. Maximum size is 10MB.`);
            return false;
        }

        return true;
    }

    /**
     * Process individual file
     */
    processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: this.generateId(),
                        name: file.name,
                        src: e.target.result,
                        width: img.width,
                        height: img.height,
                        size: file.size,
                        type: file.type
                    });
                };
                img.onerror = () => reject(new Error('Invalid image file'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Add image to collection
     */
    addImage(imageData) {
        this.images.push(imageData);
    }

    /**
     * Remove image by ID
     */
    removeImage(imageId) {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index !== -1) {
            this.images.splice(index, 1);
            this.renderImages();
            this.notifyListeners('imagesUpdated', this.images);
        }
    }

    /**
     * Render uploaded images
     */
    renderImages() {
        this.uploadedImagesContainer.innerHTML = '';
        
        if (this.images.length === 0) {
            return;
        }

        this.images.forEach(image => {
            const imageElement = this.createImageElement(image);
            this.uploadedImagesContainer.appendChild(imageElement);
        });

        // Add animation class
        this.uploadedImagesContainer.classList.add('fade-in');
    }

    /**
     * Create image element
     */
    createImageElement(image) {
        const div = document.createElement('div');
        div.className = 'image-item scale-in';
        div.innerHTML = `
            <img src="${image.src}" alt="${image.name}" loading="lazy">
            <button class="remove-btn" data-id="${image.id}" title="Remove image">×</button>
        `;

        // Add remove event listener
        const removeBtn = div.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(image.id);
        });

        return div;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create or update error display
        let errorDiv = document.querySelector('.upload-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'upload-error';
            errorDiv.style.cssText = `
                background: #ff4757;
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 4px;
                margin-top: 1rem;
                font-size: 0.9rem;
                animation: fadeIn 0.3s ease;
            `;
            this.uploadArea.parentNode.insertBefore(errorDiv, this.uploadArea.nextSibling);
        }

        errorDiv.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Get all images
     */
    getImages() {
        return [...this.images];
    }

    /**
     * Clear all images
     */
    clearImages() {
        this.images = [];
        this.renderImages();
        this.notifyListeners('imagesUpdated', this.images);
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
} 