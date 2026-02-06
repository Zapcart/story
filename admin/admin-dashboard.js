// DesiStory Admin Dashboard - Production Grade CMS
// Version: 2.0.0 - Firestore Only

class DesiStoryAdmin {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.storage = window.storage;
        this.currentUser = null;
        this.stories = [];
        this.categories = [];
        this.siteSettings = {};
        this.homepageSettings = {};
        this.isOnline = navigator.onLine;
        this.version = '2.0.0';
        
        this.init();
    }

    async init() {
        console.log(`🚀 DesiStory Admin v${this.version} initializing...`);
        
        // Check Firebase connection
        if (!this.db) {
            this.showError('Firebase not initialized. Check firebase-config.js');
            return;
        }

        // Setup authentication
        await this.setupAuth();
        
        // Load initial data
        await this.loadAllData();
        
        // Setup UI
        this.setupUI();
        this.setupEventListeners();
        
        // Setup real-time listeners
        this.setupRealtimeListeners();
        
        console.log('✅ Admin dashboard initialized successfully');
    }

    async setupAuth() {
        this.auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('👤 Admin authenticated:', user.email);
                this.showDashboard();
                await this.loadAllData();
            } else {
                console.log('🔒 Admin not authenticated');
                this.showLogin();
            }
        });
    }

    showLogin() {
        document.getElementById('app').innerHTML = `
            <div class="admin-login">
                <div class="login-card">
                    <div class="login-header">
                        <h1>🔐 DesiStory Admin</h1>
                        <p>Sign in to manage your content</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" required placeholder="admin@desistory.in">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" required placeholder="••••••••••">
                        </div>
                        <button type="submit" class="login-btn">
                            <span class="btn-text">Sign In</span>
                            <span class="btn-loader" style="display: none;">⏳ Signing in...</span>
                        </button>
                    </form>
                    <div id="loginError" class="error-message" style="display: none;"></div>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const btnText = document.querySelector('.btn-text');
        const btnLoader = document.querySelector('.btn-loader');

        try {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            errorDiv.style.display = 'none';

            console.log('🔐 Attempting admin login...');
            await this.auth.signInWithEmailAndPassword(email, password);
            
            console.log('✅ Admin login successful');
            this.showToast('Success', 'Welcome back to DesiStory Admin', 'success');
            
        } catch (error) {
            console.error('❌ Login error:', error);
            errorDiv.textContent = this.getAuthErrorMessage(error.code);
            errorDiv.style.display = 'block';
            
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    }

    getAuthErrorMessage(errorCode) {
        const errors = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-email': 'Invalid email address',
            'auth/user-disabled': 'Account disabled',
            'auth/too-many-requests': 'Too many failed attempts. Try again later'
        };
        return errors[errorCode] || 'Login failed. Please try again.';
    }

    showDashboard() {
        document.getElementById('app').innerHTML = `
            <div class="admin-dashboard">
                <header class="admin-header">
                    <div class="admin-nav">
                        <div class="admin-brand">
                            <h1>🔥 DesiStory Admin</h1>
                            <span class="version">v${this.version}</span>
                        </div>
                        <div class="admin-user">
                            <span>👤 ${this.currentUser.email}</span>
                            <button onclick="admin.signOut()" class="sign-out-btn">Sign Out</button>
                        </div>
                    </div>
                </header>

                <main class="admin-main">
                    <nav class="admin-sidebar">
                        <ul class="sidebar-menu">
                            <li><a href="#" data-section="stories" class="sidebar-link active">📚 Stories</a></li>
                            <li><a href="#" data-section="categories" class="sidebar-link">🏷️ Categories</a></li>
                            <li><a href="#" data-section="site" class="sidebar-link">⚙️ Site Settings</a></li>
                            <li><a href="#" data-section="homepage" class="sidebar-link">🏠 Homepage</a></li>
                        </ul>
                    </nav>

                    <div class="admin-content">
                        <div id="stories-section" class="content-section active">
                            ${this.renderStoriesSection()}
                        </div>
                        <div id="categories-section" class="content-section">
                            ${this.renderCategoriesSection()}
                        </div>
                        <div id="site-section" class="content-section">
                            ${this.renderSiteSection()}
                        </div>
                        <div id="homepage-section" class="content-section">
                            ${this.renderHomepageSection()}
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.setupNavigation();
    }

    renderStoriesSection() {
        const publishedStories = this.stories.filter(s => s.status === 'published');
        const draftStories = this.stories.filter(s => s.status === 'draft');

        return `
            <div class="section-header">
                <h2>📚 Stories Management</h2>
                <button onclick="admin.showAddStoryForm()" class="btn btn-primary">
                    ➕ Add New Story
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${this.stories.length}</div>
                    <div class="stat-label">Total Stories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${publishedStories.length}</div>
                    <div class="stat-label">Published</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${draftStories.length}</div>
                    <div class="stat-label">Drafts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.stories.filter(s => s.featured).length}</div>
                    <div class="stat-label">Featured</div>
                </div>
            </div>

            <div class="content-actions">
                <button onclick="admin.filterStories('all')" class="filter-btn active">All</button>
                <button onclick="admin.filterStories('published')" class="filter-btn">Published</button>
                <button onclick="admin.filterStories('draft')" class="filter-btn">Drafts</button>
                <button onclick="admin.filterStories('featured')" class="filter-btn">Featured</button>
            </div>

            <div id="storiesList" class="stories-list">
                ${this.renderStoriesList(this.stories)}
            </div>
        `;
    }

    renderStoriesList(stories) {
        if (stories.length === 0) {
            return '<div class="empty-state">No stories found</div>';
        }

        return stories.map(story => `
            <div class="story-item" data-id="${story.id}">
                <div class="story-status ${story.status}">
                    ${story.status === 'published' ? '🟢 Published' : '🟡 Draft'}
                    ${story.featured ? '⭐ Featured' : ''}
                </div>
                <div class="story-content">
                    <h3>${story.title}</h3>
                    <p class="story-excerpt">${story.excerpt || 'No excerpt'}</p>
                    <div class="story-meta">
                        <span>📁 ${story.category}</span>
                        <span>📅 ${this.formatDate(story.publish_date)}</span>
                        <span>👁 ${story.views || 0} views</span>
                    </div>
                </div>
                <div class="story-actions">
                    <button onclick="admin.editStory('${story.id}')" class="btn btn-secondary">✏️ Edit</button>
                    <button onclick="admin.togglePublish('${story.id}')" class="btn btn-warning">
                        ${story.status === 'published' ? '📝 Unpublish' : '🚀 Publish'}
                    </button>
                    <button onclick="admin.toggleFeatured('${story.id}')" class="btn btn-info">
                        ${story.featured ? '⭐ Unfeature' : '⭐ Feature'}
                    </button>
                    <button onclick="admin.deleteStory('${story.id}')" class="btn btn-danger">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderCategoriesSection() {
        return `
            <div class="section-header">
                <h2>🏷️ Categories Management</h2>
                <button onclick="admin.showAddCategoryForm()" class="btn btn-primary">
                    ➕ Add New Category
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${this.categories.length}</div>
                    <div class="stat-label">Total Categories</div>
                </div>
            </div>

            <div id="categoriesList" class="categories-list">
                ${this.renderCategoriesList()}
            </div>
        `;
    }

    renderCategoriesList() {
        if (this.categories.length === 0) {
            return '<div class="empty-state">No categories found</div>';
        }

        return this.categories.map(category => `
            <div class="category-item" data-id="${category.id}">
                <div class="category-icon">${category.icon || '📚'}</div>
                <div class="category-content">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'No description'}</p>
                    <div class="category-meta">
                        <span>🔗 ${category.slug}</span>
                        <span>📚 ${this.getStoriesByCategory(category.slug).length} stories</span>
                    </div>
                </div>
                <div class="category-actions">
                    <button onclick="admin.editCategory('${category.id}')" class="btn btn-secondary">✏️ Edit</button>
                    <button onclick="admin.deleteCategory('${category.id}')" class="btn btn-danger">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderSiteSection() {
        return `
            <div class="section-header">
                <h2>⚙️ Site Settings</h2>
            </div>

            <form id="siteSettingsForm" class="settings-form">
                <div class="form-group">
                    <label for="siteName">Site Name</label>
                    <input type="text" id="siteName" value="${this.siteSettings.site_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="tagline">Tagline</label>
                    <input type="text" id="tagline" value="${this.siteSettings.tagline || ''}" required>
                </div>
                <div class="form-group">
                    <label for="metaDescription">Meta Description</label>
                    <textarea id="metaDescription" rows="3" required>${this.siteSettings.meta_description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="footerText">Footer Text</label>
                    <textarea id="footerText" rows="2" required>${this.siteSettings.footer_text || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">💾 Save Site Settings</button>
            </form>
        `;
    }

    renderHomepageSection() {
        return `
            <div class="section-header">
                <h2>🏠 Homepage Settings</h2>
            </div>

            <form id="homepageSettingsForm" class="settings-form">
                <div class="form-group">
                    <label for="heroTitle">Hero Title</label>
                    <input type="text" id="heroTitle" value="${this.homepageSettings.hero_title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="heroSubtitle">Hero Subtitle</label>
                    <textarea id="heroSubtitle" rows="2" required>${this.homepageSettings.hero_subtitle || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="heroImage">Hero Image URL</label>
                    <input type="url" id="heroImage" value="${this.homepageSettings.hero_image || ''}">
                </div>
                <div class="form-group">
                    <label for="featuredSectionTitle">Featured Section Title</label>
                    <input type="text" id="featuredSectionTitle" value="${this.homepageSettings.featured_section_title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="latestSectionTitle">Latest Section Title</label>
                    <input type="text" id="latestSectionTitle" value="${this.homepageSettings.latest_section_title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="latestStoryCount">Latest Story Count</label>
                    <input type="number" id="latestStoryCount" value="${this.homepageSettings.latest_story_count || 6}" min="1" max="20" required>
                </div>
                <div class="form-group">
                    <label for="searchPlaceholder">Search Placeholder</label>
                    <input type="text" id="searchPlaceholder" value="${this.homepageSettings.search_placeholder || ''}" required>
                </div>
                <button type="submit" class="btn btn-primary">💾 Save Homepage Settings</button>
            </form>
        `;
    }

    setupNavigation() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const contentSections = document.querySelectorAll('.content-section');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = e.target.dataset.section;
                
                // Update active states
                sidebarLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show target section
                contentSections.forEach(section => section.classList.remove('active'));
                document.getElementById(`${targetSection}-section`).classList.add('active');
            });
        });

        // Setup form submissions
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        // Site settings form
        const siteForm = document.getElementById('siteSettingsForm');
        if (siteForm) {
            siteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSiteSettings();
            });
        }

        // Homepage settings form
        const homeForm = document.getElementById('homepageSettingsForm');
        if (homeForm) {
            homeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveHomepageSettings();
            });
        }
    }

    async loadAllData() {
        console.log('📊 Loading all admin data...');
        
        try {
            await Promise.all([
                this.loadStories(),
                this.loadCategories(),
                this.loadSiteSettings(),
                this.loadHomepageSettings()
            ]);
            
            console.log('✅ All data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError('Failed to load data: ' + error.message);
        }
    }

    async loadStories() {
        console.log('📚 Loading stories from Firestore...');
        const snapshot = await this.db.collection('stories').orderBy('publish_date', 'desc').get();
        this.stories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${this.stories.length} stories loaded`);
    }

    async loadCategories() {
        console.log('🏷️ Loading categories from Firestore...');
        const snapshot = await this.db.collection('categories').get();
        this.categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ ${this.categories.length} categories loaded`);
    }

    async loadSiteSettings() {
        console.log('⚙️ Loading site settings from Firestore...');
        const doc = await this.db.collection('site').doc('settings').get();
        if (doc.exists) {
            this.siteSettings = doc.data();
            console.log('✅ Site settings loaded');
        }
    }

    async loadHomepageSettings() {
        console.log('🏠 Loading homepage settings from Firestore...');
        const doc = await this.db.collection('homepage').doc('settings').get();
        if (doc.exists) {
            this.homepageSettings = doc.data();
            console.log('✅ Homepage settings loaded');
        }
    }

    setupRealtimeListeners() {
        console.log('🔄 Setting up real-time listeners...');

        // Stories listener
        this.db.collection('stories').onSnapshot((snapshot) => {
            console.log('📚 Stories updated:', snapshot.docChanges().length, 'changes');
            snapshot.docChanges().forEach(change => {
                this.handleStoryChange(change);
            });
            this.refreshStoriesList();
        });

        // Categories listener
        this.db.collection('categories').onSnapshot((snapshot) => {
            console.log('🏷️ Categories updated:', snapshot.docChanges().length, 'changes');
            this.loadCategories();
            this.refreshCategoriesList();
        });
    }

    handleStoryChange(change) {
        const story = { id: change.doc.id, ...change.doc.data() };
        
        switch (change.type) {
            case 'added':
                console.log('➕ Story added:', story.title);
                this.showToast('Story Added', `"${story.title}" has been created`, 'success');
                break;
            case 'modified':
                console.log('✏️ Story modified:', story.title);
                this.showToast('Story Updated', `"${story.title}" has been updated`, 'success');
                break;
            case 'removed':
                console.log('🗑️ Story removed:', story.title);
                this.showToast('Story Deleted', `"${story.title}" has been removed`, 'warning');
                break;
        }
    }

    async saveSiteSettings() {
        const formData = {
            site_name: document.getElementById('siteName').value,
            tagline: document.getElementById('tagline').value,
            meta_description: document.getElementById('metaDescription').value,
            footer_text: document.getElementById('footerText').value
        };

        try {
            console.log('💾 Saving site settings...', formData);
            await this.db.collection('site').doc('settings').set(formData);
            this.siteSettings = formData;
            this.showToast('Success', 'Site settings saved successfully', 'success');
            console.log('✅ Site settings saved');
        } catch (error) {
            console.error('❌ Error saving site settings:', error);
            this.showToast('Error', 'Failed to save site settings', 'error');
        }
    }

    async saveHomepageSettings() {
        const formData = {
            hero_title: document.getElementById('heroTitle').value,
            hero_subtitle: document.getElementById('heroSubtitle').value,
            hero_image: document.getElementById('heroImage').value,
            featured_section_title: document.getElementById('featuredSectionTitle').value,
            latest_section_title: document.getElementById('latestSectionTitle').value,
            latest_story_count: parseInt(document.getElementById('latestStoryCount').value),
            search_placeholder: document.getElementById('searchPlaceholder').value
        };

        try {
            console.log('💾 Saving homepage settings...', formData);
            await this.db.collection('homepage').doc('settings').set(formData);
            this.homepageSettings = formData;
            this.showToast('Success', 'Homepage settings saved successfully', 'success');
            console.log('✅ Homepage settings saved');
        } catch (error) {
            console.error('❌ Error saving homepage settings:', error);
            this.showToast('Error', 'Failed to save homepage settings', 'error');
        }
    }

    async togglePublish(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        const newStatus = story.status === 'published' ? 'draft' : 'published';
        
        try {
            console.log(`🔄 Toggling story ${storyId} to ${newStatus}`);
            await this.db.collection('stories').doc(storyId).update({ status: newStatus });
            
            const action = newStatus === 'published' ? 'published' : 'unpublished';
            this.showToast('Success', `Story ${action} successfully`, 'success');
        } catch (error) {
            console.error('❌ Error toggling publish status:', error);
            this.showToast('Error', 'Failed to update story status', 'error');
        }
    }

    async toggleFeatured(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        const newFeatured = !story.featured;
        
        try {
            console.log(`⭐ Toggling featured status for story ${storyId} to ${newFeatured}`);
            await this.db.collection('stories').doc(storyId).update({ featured: newFeatured });
            
            const action = newFeatured ? 'featured' : 'unfeatured';
            this.showToast('Success', `Story ${action} successfully`, 'success');
        } catch (error) {
            console.error('❌ Error toggling featured status:', error);
            this.showToast('Error', 'Failed to update featured status', 'error');
        }
    }

    async deleteStory(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        if (!confirm(`Are you sure you want to delete "${story.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log(`🗑️ Deleting story ${storyId}: ${story.title}`);
            await this.db.collection('stories').doc(storyId).delete();
            this.showToast('Success', 'Story deleted successfully', 'success');
        } catch (error) {
            console.error('❌ Error deleting story:', error);
            this.showToast('Error', 'Failed to delete story', 'error');
        }
    }

    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        if (!confirm(`Are you sure you want to delete "${category.name}"? Stories in this category will not be deleted.`)) {
            return;
        }

        try {
            console.log(`🗑️ Deleting category ${categoryId}: ${category.name}`);
            await this.db.collection('categories').doc(categoryId).delete();
            this.showToast('Success', 'Category deleted successfully', 'success');
        } catch (error) {
            console.error('❌ Error deleting category:', error);
            this.showToast('Error', 'Failed to delete category', 'error');
        }
    }

    refreshStoriesList() {
        const storiesList = document.getElementById('storiesList');
        if (storiesList) {
            storiesList.innerHTML = this.renderStoriesList(this.stories);
        }
    }

    refreshCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.innerHTML = this.renderCategoriesList();
        }
    }

    filterStories(filter) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        let filtered = this.stories;
        switch (filter) {
            case 'published':
                filtered = this.stories.filter(s => s.status === 'published');
                break;
            case 'draft':
                filtered = this.stories.filter(s => s.status === 'draft');
                break;
            case 'featured':
                filtered = this.stories.filter(s => s.featured);
                break;
        }

        this.refreshStoriesList();
    }

    getStoriesByCategory(categorySlug) {
        return this.stories.filter(story => story.category === categorySlug);
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-banner';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">❌</span>
                <span class="error-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    async signOut() {
        try {
            console.log('👋 Signing out admin...');
            await this.auth.signOut();
            this.showToast('Success', 'Signed out successfully', 'success');
        } catch (error) {
            console.error('❌ Error signing out:', error);
            this.showToast('Error', 'Failed to sign out', 'error');
        }
    }

    setupEventListeners() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Connection restored');
            this.showToast('Connection Restored', 'You are back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📵 Connection lost');
            this.showToast('Connection Lost', 'You are offline. Some features may not work.', 'warning');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        // Save current form
                        break;
                    case 'n':
                        e.preventDefault();
                        // New story
                        this.showAddStoryForm();
                        break;
                }
            }
        });
    }

    showAddStoryForm() {
        // Implementation for add story form
        this.showToast('Info', 'Story editor coming in next update', 'info');
    }

    showAddCategoryForm() {
        // Implementation for add category form
        this.showToast('Info', 'Category editor coming in next update', 'info');
    }

    editStory(storyId) {
        // Implementation for story editor
        this.showToast('Info', 'Story editor coming in next update', 'info');
    }

    editCategory(categoryId) {
        // Implementation for category editor
        this.showToast('Info', 'Category editor coming in next update', 'info');
    }
}

// Initialize admin dashboard
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new DesiStoryAdmin();
});

// Export for global access
window.DesiStoryAdmin = DesiStoryAdmin;
