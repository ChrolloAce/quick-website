/**
 * WebImageExtractor - Extracts images from websites
 * Handles URL validation, CORS proxy, image discovery, and filtering
 */
window.WebImageExtractor = class WebImageExtractor {
    constructor() {
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://proxy.cors.sh/'
        ];
        this.currentProxyIndex = 0;
        this.listeners = {};
        this.isExtracting = false;
        this.extractedImages = [];
    }

    /**
     * Extract images from a website URL
     */
    async extractImages(url) {
        if (this.isExtracting) {
            throw new Error('Already extracting images from another URL');
        }

        try {
            this.isExtracting = true;
            this.extractedImages = [];
            
            const validatedUrl = this.validateUrl(url);
            this.notifyListeners('extractionStarted', { url: validatedUrl });
            
            // Try different methods to extract images
            const images = await this.tryExtractMethods(validatedUrl);
            
            if (images.length === 0) {
                throw new Error('No images found on this website');
            }

            // Process and validate images
            const processedImages = await this.processImages(images, validatedUrl);
            
            this.extractedImages = processedImages;
            this.notifyListeners('extractionCompleted', { 
                url: validatedUrl, 
                images: processedImages 
            });
            
            return processedImages;
            
        } catch (error) {
            this.notifyListeners('extractionError', { 
                url, 
                error: error.message 
            });
            throw error;
        } finally {
            this.isExtracting = false;
        }
    }

    /**
     * Try different extraction methods
     */
    async tryExtractMethods(url) {
        const methods = [
            () => this.extractViaAPI(url),
            () => this.extractViaMetaTags(url),
            () => this.extractViaCommonPatterns(url)
        ];

        for (const method of methods) {
            try {
                const images = await method();
                if (images.length > 0) {
                    return images;
                }
            } catch (error) {
                console.warn('Extraction method failed:', error.message);
                continue;
            }
        }

        return [];
    }

    /**
     * Extract images via API/scraping
     */
    async extractViaAPI(url) {
        try {
            // Use a web scraping API or service
            const response = await this.fetchWithProxy(url);
            const html = await response.text();
            
            return this.parseImagesFromHTML(html, url);
        } catch (error) {
            throw new Error(`Failed to fetch website content: ${error.message}`);
        }
    }

    /**
     * Extract via meta tags and structured data
     */
    async extractViaMetaTags(url) {
        try {
            const response = await this.fetchWithProxy(url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const images = [];
            
            // Extract from meta tags
            const metaImages = [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                'meta[name="twitter:image:src"]',
                'link[rel="image_src"]'
            ];
            
            metaImages.forEach(selector => {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => {
                    const content = el.getAttribute('content') || el.getAttribute('href');
                    if (content) {
                        images.push(this.resolveUrl(content, url));
                    }
                });
            });
            
            return [...new Set(images)]; // Remove duplicates
        } catch (error) {
            throw new Error(`Failed to extract meta images: ${error.message}`);
        }
    }

    /**
     * Parse images from HTML content
     */
    parseImagesFromHTML(html, baseUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const images = [];
        const imgElements = doc.querySelectorAll('img');
        
        imgElements.forEach(img => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src && this.isValidImageUrl(src)) {
                const fullUrl = this.resolveUrl(src, baseUrl);
                images.push({
                    src: fullUrl,
                    alt: img.getAttribute('alt') || '',
                    width: img.getAttribute('width'),
                    height: img.getAttribute('height')
                });
            }
        });
        
        // Also look for background images in CSS
        const elementsWithBg = doc.querySelectorAll('[style*="background-image"]');
        elementsWithBg.forEach(el => {
            const style = el.getAttribute('style');
            const match = style.match(/background-image:\s*url\(['"]?([^'"]*?)['"]?\)/);
            if (match && match[1]) {
                const fullUrl = this.resolveUrl(match[1], baseUrl);
                if (this.isValidImageUrl(fullUrl)) {
                    images.push({
                        src: fullUrl,
                        alt: 'Background image',
                        width: null,
                        height: null
                    });
                }
            }
        });
        
        return images;
    }

    /**
     * Extract via common image patterns
     */
    async extractViaCommonPatterns(url) {
        const domain = new URL(url).hostname;
        const images = [];
        
        // Common image paths to try
        const commonPaths = [
            '/images/',
            '/img/',
            '/assets/',
            '/media/',
            '/uploads/',
            '/content/'
        ];
        
        // This is a fallback method - in reality, you'd need more sophisticated discovery
        const baseImages = [
            'logo.png', 'banner.jpg', 'hero.jpg', 'header.png',
            'favicon.ico', 'screenshot.png', 'preview.jpg'
        ];
        
        for (const path of commonPaths) {
            for (const imgName of baseImages) {
                const testUrl = `${url.replace(/\/$/, '')}${path}${imgName}`;
                try {
                    if (await this.imageExists(testUrl)) {
                        images.push({
                            src: testUrl,
                            alt: imgName,
                            width: null,
                            height: null
                        });
                    }
                } catch (error) {
                    // Ignore failed attempts
                }
            }
        }
        
        return images;
    }

    /**
     * Check if image exists
     */
    async imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok && response.headers.get('content-type')?.startsWith('image/');
        } catch (error) {
            return false;
        }
    }

    /**
     * Fetch with CORS proxy
     */
    async fetchWithProxy(url) {
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
            const proxy = this.corsProxies[proxyIndex];
            
            try {
                const response = await fetch(proxy + encodeURIComponent(url), {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ImageExtractor/1.0)'
                    }
                });
                
                if (response.ok) {
                    this.currentProxyIndex = proxyIndex;
                    return response;
                }
            } catch (error) {
                console.warn(`Proxy ${proxy} failed:`, error.message);
                continue;
            }
        }
        
        // If all proxies fail, try direct request
        try {
            return await fetch(url);
        } catch (error) {
            throw new Error('All proxy attempts failed and direct request blocked by CORS');
        }
    }

    /**
     * Process and validate extracted images
     */
    async processImages(images, baseUrl) {
        const processedImages = [];
        
        this.notifyListeners('processingImages', { total: images.length });
        
        for (let i = 0; i < images.length; i++) {
            try {
                const imageData = await this.createImageData(images[i], baseUrl);
                if (imageData) {
                    processedImages.push(imageData);
                }
                
                this.notifyListeners('processingProgress', { 
                    current: i + 1, 
                    total: images.length 
                });
            } catch (error) {
                console.warn('Failed to process image:', images[i], error);
            }
        }
        
        return processedImages;
    }

    /**
     * Create image data object
     */
    async createImageData(imageInfo, baseUrl) {
        try {
            const response = await fetch(imageInfo.src);
            if (!response.ok) return null;
            
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) return null;
            
            // Skip very small images (likely icons)
            if (blob.size < 1024) return null;
            
            const dataUrl = await this.blobToDataUrl(blob);
            
            return {
                id: this.generateId(),
                name: this.extractImageName(imageInfo.src) || imageInfo.alt || 'Extracted Image',
                src: dataUrl,
                originalUrl: imageInfo.src,
                size: blob.size,
                type: blob.type,
                width: imageInfo.width,
                height: imageInfo.height,
                source: 'web-extraction'
            };
        } catch (error) {
            console.warn('Failed to create image data:', error);
            return null;
        }
    }

    /**
     * Convert blob to data URL
     */
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Validate and normalize URL
     */
    validateUrl(url) {
        try {
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const urlObj = new URL(url);
            return urlObj.href;
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    }

    /**
     * Resolve relative URL to absolute
     */
    resolveUrl(url, baseUrl) {
        try {
            return new URL(url, baseUrl).href;
        } catch (error) {
            return url;
        }
    }

    /**
     * Check if URL is a valid image
     */
    isValidImageUrl(url) {
        if (!url) return false;
        
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
        return imageExtensions.test(url) || url.includes('image');
    }

    /**
     * Extract image name from URL
     */
    extractImageName(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const fileName = pathname.split('/').pop();
            return fileName || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get extraction status
     */
    isCurrentlyExtracting() {
        return this.isExtracting;
    }

    /**
     * Get last extracted images
     */
    getLastExtractedImages() {
        return [...this.extractedImages];
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