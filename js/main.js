/**
 * Main entry point for the Image Slider Generator application
 * Initializes the AppController when DOM is ready
 */

// Global app instance
let app = null;

/**
 * Initialize the application
 */
function initializeApp() {
    try {
        // Create main app controller
        app = new AppController();
        
        // Set global reference for debugging
        window.SliderApp = app;
        
        console.log('Image Slider Generator initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show fallback error message
        showFallbackError('Failed to load the application. Please refresh the page and try again.');
    }
}

/**
 * Show fallback error message when app fails to initialize
 */
function showFallbackError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #dc3545;
        color: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 1rem 0;">Application Error</h3>
        <p style="margin: 0 0 1.5rem 0;">${message}</p>
        <button onclick="location.reload()" style="
            background: white;
            color: #dc3545;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
        ">Refresh Page</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Check if all required classes are available
 */
function checkDependencies() {
    const requiredClasses = [
        'ImageUploadManager',
        'SliderComponent', 
        'EmbedCodeGenerator',
        'WebImageExtractor',
        'ProjectManager',
        'PreviewManager',
        'AppController'
    ];
    
    const missing = requiredClasses.filter(className => 
        typeof window[className] === 'undefined'
    );
    
    if (missing.length > 0) {
        throw new Error(`Missing required classes: ${missing.join(', ')}`);
    }
    
    return true;
}

/**
 * DOM ready handler
 */
function onDOMReady() {
    try {
        checkDependencies();
        initializeApp();
    } catch (error) {
        console.error('Initialization error:', error);
        showFallbackError(error.message || 'Unknown initialization error');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
    // DOM is already ready
    onDOMReady();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (app && typeof app.destroy === 'function') {
        app.destroy();
    }
});

// Add some helpful global utilities for debugging
window.SliderUtils = {
    /**
     * Get app state for debugging
     */
    getAppState() {
        return app ? app.getAppState() : null;
    },
    
    /**
     * Clear all data
     */
    clearAll() {
        if (app && confirm('Clear all data?')) {
            app.clearAll();
        }
    },
    
    /**
     * Export current state
     */
    exportState() {
        if (!app) return null;
        
        const state = {
            images: app.currentImages,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Create download link
        const blob = new Blob([JSON.stringify(state, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slider-state-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        return state;
    },
    
    /**
     * Import state from file
     */
    importState(file) {
        if (!file || !app) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                if (state.images && Array.isArray(state.images)) {
                    // Clear current images
                    app.imageUploadManager.clearImages();
                    
                    // Add imported images
                    state.images.forEach(image => {
                        app.imageUploadManager.addImage(image);
                    });
                    
                    app.imageUploadManager.renderImages();
                    app.handleImagesUpdated(state.images);
                    
                    console.log('State imported successfully');
                }
            } catch (error) {
                console.error('Error importing state:', error);
                alert('Error importing state file');
            }
        };
        
        reader.readAsText(file);
    }
};

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 