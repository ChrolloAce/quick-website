/**
 * ProjectManager - Handles project creation, saving, and management
 * Enables dynamic embed updates by storing projects with unique IDs
 */
window.ProjectManager = class ProjectManager {
    constructor() {
        this.projects = new Map();
        this.currentProject = null;
        this.listeners = {};
        
        this.loadProjectsFromStorage();
        this.initializeElements();
        this.bindEvents();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.projectSelect = document.getElementById('projectSelect');
        this.saveProjectBtn = document.getElementById('saveProjectBtn');
        this.deleteProjectBtn = document.getElementById('deleteProjectBtn');
        this.projectNameInput = document.getElementById('projectName');
        this.projectIdDisplay = document.getElementById('projectId');
        this.embedCountDisplay = document.getElementById('embedCount');
        
        this.updateProjectsList();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (this.projectSelect) {
            this.projectSelect.addEventListener('change', (e) => {
                this.handleProjectSelection(e.target.value);
            });
        }

        if (this.saveProjectBtn) {
            this.saveProjectBtn.addEventListener('click', () => {
                this.saveCurrentProject();
            });
        }

        if (this.deleteProjectBtn) {
            this.deleteProjectBtn.addEventListener('click', () => {
                this.deleteCurrentProject();
            });
        }

        if (this.projectNameInput) {
            this.projectNameInput.addEventListener('input', () => {
                this.handleProjectNameChange();
            });
        }
    }

    /**
     * Create a new project
     */
    createNewProject(name = '') {
        const project = {
            id: this.generateProjectId(),
            name: name || 'Untitled Project',
            images: [],
            settings: {
                autoPlay: true,
                autoPlayDelay: 4000,
                showIndicators: true,
                showNavigation: true
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            embedCount: 0
        };

        this.currentProject = project;
        this.projects.set(project.id, project);
        
        this.updateUI();
        this.saveProjectsToStorage();
        
        this.notifyListeners('projectCreated', project);
        
        return project;
    }

    /**
     * Save current project
     */
    saveCurrentProject() {
        if (!this.currentProject) {
            this.createNewProject(this.projectNameInput.value || 'Untitled Project');
            return;
        }

        // Update project data
        this.currentProject.name = this.projectNameInput.value || 'Untitled Project';
        this.currentProject.updatedAt = new Date().toISOString();
        
        // Save to storage
        this.saveProjectsToStorage();
        
        this.updateUI();
        this.updateProjectsList();
        
        this.notifyListeners('projectSaved', this.currentProject);
        
        this.showSuccessMessage(`Project "${this.currentProject.name}" saved successfully!`);
    }

    /**
     * Load project by ID
     */
    loadProject(projectId) {
        const project = this.projects.get(projectId);
        if (project) {
            this.currentProject = project;
            this.updateUI();
            this.notifyListeners('projectLoaded', project);
            return project;
        }
        return null;
    }

    /**
     * Delete current project
     */
    deleteCurrentProject() {
        if (!this.currentProject) return;

        const projectName = this.currentProject.name;
        
        if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            this.projects.delete(this.currentProject.id);
            this.saveProjectsToStorage();
            
            this.notifyListeners('projectDeleted', this.currentProject);
            
            this.currentProject = null;
            this.updateUI();
            this.updateProjectsList();
            
            this.showSuccessMessage(`Project "${projectName}" deleted successfully.`);
        }
    }

    /**
     * Update project images
     */
    updateProjectImages(images) {
        if (!this.currentProject) {
            this.createNewProject();
        }
        
        this.currentProject.images = images;
        this.currentProject.updatedAt = new Date().toISOString();
        
        this.enableSaveButton();
        this.notifyListeners('projectImagesUpdated', { project: this.currentProject, images });
    }

    /**
     * Handle project selection
     */
    handleProjectSelection(projectId) {
        if (!projectId) {
            // Create new project
            this.createNewProject();
        } else {
            // Load existing project
            this.loadProject(projectId);
        }
    }

    /**
     * Handle project name change
     */
    handleProjectNameChange() {
        if (this.currentProject || this.projectNameInput.value.trim()) {
            this.enableSaveButton();
        } else {
            this.disableSaveButton();
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.currentProject) {
            // Update form fields
            this.projectNameInput.value = this.currentProject.name;
            this.projectIdDisplay.textContent = `ID: ${this.currentProject.id}`;
            this.embedCountDisplay.textContent = `${this.currentProject.embedCount} embeds active`;
            
            // Update select
            this.projectSelect.value = this.currentProject.id;
            
            // Enable buttons
            this.enableSaveButton();
            this.deleteProjectBtn.disabled = false;
        } else {
            // Clear form
            this.projectNameInput.value = '';
            this.projectIdDisplay.textContent = '';
            this.embedCountDisplay.textContent = '0 embeds active';
            
            // Update select
            this.projectSelect.value = '';
            
            // Disable buttons
            this.disableSaveButton();
            this.deleteProjectBtn.disabled = true;
        }
    }

    /**
     * Update projects list in select
     */
    updateProjectsList() {
        if (!this.projectSelect) return;

        // Clear existing options except "New Project"
        this.projectSelect.innerHTML = '<option value="">+ New Project</option>';
        
        // Add existing projects
        for (const [id, project] of this.projects.entries()) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${project.name} (${project.images.length} images)`;
            this.projectSelect.appendChild(option);
        }
    }

    /**
     * Enable save button
     */
    enableSaveButton() {
        if (this.saveProjectBtn) {
            this.saveProjectBtn.disabled = false;
        }
    }

    /**
     * Disable save button
     */
    disableSaveButton() {
        if (this.saveProjectBtn) {
            this.saveProjectBtn.disabled = true;
        }
    }

    /**
     * Generate unique project ID
     */
    generateProjectId() {
        return 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save projects to localStorage
     */
    saveProjectsToStorage() {
        try {
            const projectsData = {};
            for (const [id, project] of this.projects.entries()) {
                projectsData[id] = project;
            }
            localStorage.setItem('imageSliderProjects', JSON.stringify(projectsData));
        } catch (error) {
            console.error('Failed to save projects to storage:', error);
        }
    }

    /**
     * Load projects from localStorage
     */
    loadProjectsFromStorage() {
        try {
            const stored = localStorage.getItem('imageSliderProjects');
            if (stored) {
                const projectsData = JSON.parse(stored);
                this.projects.clear();
                
                for (const [id, project] of Object.entries(projectsData)) {
                    this.projects.set(id, project);
                }
            }
        } catch (error) {
            console.error('Failed to load projects from storage:', error);
        }
    }

    /**
     * Get current project
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * Get all projects
     */
    getAllProjects() {
        return Array.from(this.projects.values());
    }

    /**
     * Get project by ID
     */
    getProject(projectId) {
        return this.projects.get(projectId);
    }

    /**
     * Generate dynamic embed code
     */
    generateDynamicEmbedCode(projectId = null) {
        const targetProjectId = projectId || (this.currentProject ? this.currentProject.id : null);
        
        if (!targetProjectId) {
            throw new Error('No project selected for embed generation');
        }

        // Increment embed count
        const project = this.projects.get(targetProjectId);
        if (project) {
            project.embedCount++;
            this.saveProjectsToStorage();
            this.updateUI();
        }

        return `<!-- Dynamic Image Slider Embed -->
<div id="slider_${Date.now()}" data-project-id="${targetProjectId}"></div>

<script>
(function() {
    'use strict';
    
    const projectId = '${targetProjectId}';
    const container = document.querySelector('[data-project-id="' + projectId + '"]');
    
    if (!container) {
        console.error('Slider container not found');
        return;
    }
    
    // Fetch project data
    async function loadProject() {
        try {
            // In a real implementation, this would fetch from your API
            // For now, we'll use a placeholder URL
            const response = await fetch('https://your-api.com/projects/' + projectId);
            if (!response.ok) {
                throw new Error('Project not found');
            }
            
            const project = await response.json();
            renderSlider(project);
        } catch (error) {
            console.error('Failed to load project:', error);
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Unable to load slider</div>';
        }
    }
    
    // Render slider with project data
    function renderSlider(project) {
        if (!project.images || project.images.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No images in this project</div>';
            return;
        }
        
        // Build 3x3 grid slider
        const totalPages = Math.ceil(project.images.length / 9);
        let currentPage = 0;
        
        function buildPage(pageIndex) {
            const startIndex = pageIndex * 9;
            const endIndex = Math.min(startIndex + 9, project.images.length);
            const pageImages = project.images.slice(startIndex, endIndex);
            
            return pageImages.map(image => 
                '<div class="cube-slide" style="aspect-ratio: 1; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><img src="' + image.src + '" alt="' + image.name + '" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy"></div>'
            ).join('');
        }
        
        function render() {
            container.innerHTML = 
                '<div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); padding: 20px; position: relative;">' +
                    '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">' + buildPage(currentPage) + '</div>' +
                    (totalPages > 1 ? 
                        '<button onclick="prevPage()" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7)); color: #667eea; cursor: pointer; font-size: 20px; backdrop-filter: blur(12px);">‹</button>' +
                        '<button onclick="nextPage()" style="position: absolute; right: -25px; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7)); color: #667eea; cursor: pointer; font-size: 20px; backdrop-filter: blur(12px);">›</button>'
                    : '') +
                '</div>';
        }
        
        window.nextPage = function() {
            if (currentPage < totalPages - 1) {
                currentPage++;
                render();
            }
        };
        
        window.prevPage = function() {
            if (currentPage > 0) {
                currentPage--;
                render();
            }
        };
        
        render();
    }
    
    // Load project data
    loadProject();
})();
</script>

<style>
.cube-slide:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
</style>`;
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
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
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
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
     * Notify listeners
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}