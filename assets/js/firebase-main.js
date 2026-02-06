// Firebase Integration for DesiStory Website
class FirebaseStoryWebsite {
    constructor() {
        this.stories = [];
        this.categories = [];
        this.homepageSettings = {};
        this.siteSettings = {};
        this.currentPage = 1;
        this.storiesPerPage = 9;
        this.filteredStories = [];
        this.isLoading = false;
        this.useFirebase = window.db !== undefined;
        this.init();
    }

    async init() {
        this.showLoadingState();
        
        if (this.useFirebase) {
            console.log('🔥 Using Firebase Firestore');
            await this.loadFromFirebase();
        } else {
            console.log('📁 Using local files (fallback)');
            await this.loadFromLocalFiles();
        }
        
        this.setupEventListeners();
        this.renderSiteBranding();
        this.renderHomepage();
        this.renderCategories();
        this.renderStories();
        this.renderFooter();
        this.hideLoadingState();
    }

    async loadFromFirebase() {
        try {
            // Load site settings
            const siteDoc = await db.collection('site').doc('settings').get();
            if (siteDoc.exists) {
                this.siteSettings = siteDoc.data();
                console.log('✅ Site settings loaded from Firebase');
            }

            // Load homepage settings
            const homeDoc = await db.collection('homepage').doc('settings').get();
            if (homeDoc.exists) {
                this.homepageSettings = homeDoc.data();
                console.log('✅ Homepage settings loaded from Firebase');
            }

            // Load categories
            const categoriesSnapshot = await db.collection('categories').get();
            this.categories = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.categories.length} categories loaded from Firebase`);

            // Load published stories only
            const storiesSnapshot = await db.collection('stories')
                .where('status', '==', 'published')
                .orderBy('publish_date', 'desc')
                .get();
            
            this.stories = storiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ ${this.stories.length} stories loaded from Firebase`);

            this.filteredStories = [...this.stories];
        } catch (error) {
            console.error('❌ Firebase loading error:', error);
            // Fallback to local files
            await this.loadFromLocalFiles();
        }
    }

    async loadFromLocalFiles() {
        // Fallback to original file-based loading
        try {
            const response = await fetch('content/site.json');
            if (response.ok) {
                this.siteSettings = await response.json();
            }
        } catch (error) {
            console.log('Using default site settings...');
            this.siteSettings = {
                site_name: "DesiStory",
                tagline: "दिल से लिखी कहानियाँ",
                footer_text: "दिल से लिखी कहानियाँ - Your destination for amazing Hindi stories and cultural narratives.",
                meta_description: "Read amazing Hindi stories, folk tales, and modern narratives. Discover the best collection of desi stories.",
                social_links: []
            };
        }

        try {
            const response = await fetch('content/homepage.json');
            if (response.ok) {
                this.homepageSettings = await response.json();
            }
        } catch (error) {
            console.log('Using default homepage settings...');
            this.homepageSettings = {
                hero_title: "Discover Amazing Hindi Stories",
                hero_subtitle: "Explore our collection of traditional folk tales, modern narratives, and cultural stories from India",
                hero_image: "https://picsum.photos/seed/hero/1200/600.jpg",
                featured_section_title: "Featured Story",
                latest_section_title: "Latest Stories",
                latest_story_count: 6,
                search_placeholder: "Search stories, categories, or keywords..."
            };
        }

        // Load categories from markdown files
        const categoryFiles = [
            'folk-tales', 'inspirational', 'children-stories', 'adventure',
            'romance', 'mystery', 'mythology', 'modern-stories'
        ];
        
        const categoryPromises = categoryFiles.map(async (slug) => {
            try {
                const response = await fetch(`content/categories/${slug}.md`);
                if (response.ok) {
                    const text = await response.text();
                    const frontMatter = this.parseFrontMatter(text);
                    return frontMatter;
                }
            } catch (error) {
                console.log(`Could not load category: ${slug}`);
            }
            return null;
        });

        const results = await Promise.all(categoryPromises);
        this.categories = results.filter(cat => cat !== null);

        // Load stories from markdown files
        const storyFiles = [
            'jungle-ki-kahani', 'raja-aur-garib', 'chalak-lomdi',
            'veer-yoddha', 'pyar-ki-kahani', 'rahasyamay-ghar'
        ];
        
        const storyPromises = storyFiles.map(async (slug) => {
            try {
                const response = await fetch(`content/stories/${slug}.md`);
                if (response.ok) {
                    const text = await response.text();
                    const frontMatter = this.parseFrontMatter(text);
                    if (frontMatter) {
                        frontMatter.slug = slug;
                        frontMatter.content = text.split('---')[2] || '';
                        return frontMatter;
                    }
                }
            } catch (error) {
                console.log(`Could not load story: ${slug}`);
            }
            return null;
        });

        const storyResults = await Promise.all(storyPromises);
        this.stories = storyResults.filter(story => story !== null && story.status === 'published');
        
        // Sort by publish date
        this.stories.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
        
        this.filteredStories = [...this.stories];
    }

    parseFrontMatter(text) {
        const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = text.match(frontMatterRegex);
        
        if (match) {
            try {
                return JSON.parse(match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
            } catch (e) {
                console.error('Error parsing front matter:', e);
            }
        }
        return null;
    }

    getFeaturedStory() {
        return this.stories.find(story => story.featured === true);
    }

    renderSiteBranding() {
        const siteTitle = document.querySelector('title');
        const navBrand = document.querySelector('.nav-brand h1 a');
        const navTagline = document.querySelector('.nav-tagline');
        
        if (siteTitle) {
            siteTitle.textContent = `${this.siteSettings.site_name} - ${this.siteSettings.tagline}`;
        }
        
        if (navBrand) {
            navBrand.textContent = this.siteSettings.site_name;
        }
        
        if (navTagline) {
            navTagline.textContent = this.siteSettings.tagline;
        }

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = this.siteSettings.meta_description;
        }
    }

    renderHomepage() {
        const heroHeadline = document.querySelector('.hero-headline');
        const heroTagline = document.querySelector('.hero-tagline');
        const searchPlaceholder = document.getElementById('searchInput');
        const featuredLabel = document.querySelector('.featured-story-label');
        const storiesHeader = document.querySelector('.stories-header h2');
        
        if (heroHeadline) {
            heroHeadline.textContent = this.homepageSettings.hero_title;
        }
        
        if (heroTagline) {
            heroTagline.textContent = this.homepageSettings.hero_subtitle;
        }
        
        if (searchPlaceholder) {
            searchPlaceholder.placeholder = this.homepageSettings.search_placeholder;
        }
        
        if (featuredLabel) {
            featuredLabel.textContent = `✨ ${this.homepageSettings.featured_section_title}`;
        }
        
        if (storiesHeader) {
            storiesHeader.textContent = this.homepageSettings.latest_section_title;
        }

        // Update hero background image if set
        if (this.homepageSettings.hero_image) {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.style.backgroundImage = `url(${this.homepageSettings.hero_image})`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.style.backgroundBlendMode = 'overlay';
            }
        }

        // Render featured story
        this.renderFeaturedStory();
    }

    renderFeaturedStory() {
        const featuredStoryCard = document.getElementById('featuredStoryCard');
        if (!featuredStoryCard) return;

        const featuredStory = this.getFeaturedStory();
        if (!featuredStory) {
            featuredStoryCard.style.display = 'none';
            return;
        }

        const category = this.categories.find(cat => cat.slug === featuredStory.category);
        
        featuredStoryCard.innerHTML = `
            <img src="${featuredStory.cover_image || 'https://picsum.photos/seed/' + featuredStory.slug + '/600/400.jpg'}" 
                 alt="${featuredStory.title}" class="featured-story-image">
            <div class="featured-story-content">
                <h3 class="featured-story-title">${featuredStory.title}</h3>
                <p class="featured-story-description">${featuredStory.excerpt}</p>
                <div class="featured-story-meta">
                    <span>${category ? category.name : featuredStory.category}</span>
                    <span>📖 ${Math.ceil((featuredStory.content || '').length / 500)} min read</span>
                </div>
            </div>
        `;
        
        featuredStoryCard.onclick = () => {
            window.location.href = `story.html?slug=${featuredStory.slug}`;
        };
    }

    renderCategories() {
        const categoryGrid = document.getElementById('categoryGrid');
        if (!categoryGrid) return;

        categoryGrid.innerHTML = this.categories.map((category) => `
            <div class="category-card" onclick="window.location.href='#stories'">
                <div class="category-icon">
                    ${category.icon || '📚'}
                </div>
                <h3>${category.name}</h3>
                <p>${category.description || `Explore amazing ${category.name.toLowerCase()}`}</p>
                <div class="category-count">
                    <span>${this.getStoriesByCategory(category.slug).length} stories</span>
                </div>
            </div>
        `).join('');

        // Add click handlers to category cards
        categoryGrid.querySelectorAll('.category-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.filterByCategory(this.categories[index].slug);
            });
        });
    }

    getStoriesByCategory(categorySlug) {
        return this.stories.filter(story => story.category === categorySlug);
    }

    renderStories() {
        const storyGrid = document.getElementById('storyGrid');
        if (!storyGrid) return;

        // Get featured story and latest stories
        const featuredStory = this.getFeaturedStory();
        const latestStories = this.filteredStories.filter(story => !story.featured);
        const storyCount = this.homepageSettings.latest_story_count || 6;
        const storiesToShow = latestStories.slice(0, storyCount);

        if (storiesToShow.length === 0 && !featuredStory) {
            storyGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No stories found</h3>
                    <p style="color: var(--text-muted);">Try adjusting your search or browse our categories</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        // Add featured story if exists
        if (featuredStory) {
            const category = this.categories.find(cat => cat.slug === featuredStory.category);
            html += `
                <div class="story-card featured" onclick="window.location.href='story.html?slug=${featuredStory.slug}'">
                    <div class="story-card-image-wrapper">
                        <img src="${featuredStory.cover_image || 'https://picsum.photos/seed/' + featuredStory.slug + '/400/300.jpg'}" 
                             alt="${featuredStory.title}" class="story-card-image" loading="lazy">
                        <span class="story-card-category">⭐ Featured</span>
                    </div>
                    <div class="story-card-content">
                        <h3 class="story-card-title">${featuredStory.title}</h3>
                        <p class="story-card-description">${featuredStory.excerpt}</p>
                        <div class="story-card-meta">
                            <div class="story-card-date">
                                📅 ${this.formatDate(featuredStory.publish_date)}
                            </div>
                            <div class="story-card-read-time">
                                📖 ${Math.ceil((featuredStory.content || '').length / 500)} min read
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Add latest stories
        storiesToShow.forEach(story => {
            const category = this.categories.find(cat => cat.slug === story.category);
            html += `
                <div class="story-card" onclick="window.location.href='story.html?slug=${story.slug}'">
                    <div class="story-card-image-wrapper">
                        <img src="${story.cover_image || 'https://picsum.photos/seed/' + story.slug + '/400/300.jpg'}" 
                             alt="${story.title}" class="story-card-image" loading="lazy">
                        <span class="story-card-category">${category ? category.name : story.category}</span>
                    </div>
                    <div class="story-card-content">
                        <h3 class="story-card-title">${story.title}</h3>
                        <p class="story-card-description">${story.excerpt}</p>
                        <div class="story-card-meta">
                            <div class="story-card-date">
                                📅 ${this.formatDate(story.publish_date)}
                            </div>
                            <div class="story-card-read-time">
                                📖 ${Math.ceil((story.content || '').length / 500)} min read
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        storyGrid.innerHTML = html;

        // Update load more button
        this.updateLoadMoreButton();
        
        // Add entrance animations
        this.animateStoryCards();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    renderFooter() {
        const footerText = document.querySelector('.footer-section p');
        const socialLinks = document.querySelector('.footer-social');
        
        if (footerText) {
            footerText.textContent = this.siteSettings.footer_text;
        }
        
        if (socialLinks && this.siteSettings.social_links) {
            socialLinks.innerHTML = this.siteSettings.social_links.map(link => {
                const icon = this.getSocialIcon(link.platform);
                return `<a href="${link.url}" aria-label="${link.platform}" target="_blank">${icon}</a>`;
            }).join('');
        }
    }

    getSocialIcon(platform) {
        const icons = {
            'Facebook': '📘',
            'Twitter': '🐦',
            'Instagram': '📷',
            'YouTube': '📺'
        };
        return icons[platform] || '🔗';
    }

    showLoadingState() {
        const storyGrid = document.getElementById('storyGrid');
        const categoryGrid = document.getElementById('categoryGrid');
        
        if (storyGrid) {
            storyGrid.innerHTML = this.generateSkeletonCards(6);
        }
        
        if (categoryGrid) {
            categoryGrid.innerHTML = this.generateSkeletonCategories(4);
        }
    }

    generateSkeletonCards(count) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="story-card skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-meta"></div>
                </div>
            `;
        }
        return skeletons;
    }

    generateSkeletonCategories(count) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="category-card skeleton-card">
                    <div class="skeleton skeleton-icon"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            `;
        }
        return skeletons;
    }

    hideLoadingState() {
        const skeletonCards = document.querySelectorAll('.skeleton-card');
        skeletonCards.forEach(card => {
            card.classList.remove('skeleton-card');
        });
    }

    animateStoryCards() {
        const cards = document.querySelectorAll('.story-card:not(.skeleton-card)');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.handleSearch(searchInput.value);
            });
        }

        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreStories();
            });
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredStories = [...this.stories];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredStories = this.stories.filter(story => 
                story.title.toLowerCase().includes(searchTerm) ||
                story.excerpt.toLowerCase().includes(searchTerm) ||
                story.category.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentPage = 1;
        this.renderStories();
    }

    filterByCategory(categorySlug) {
        this.filteredStories = this.stories.filter(story => story.category === categorySlug);
        this.currentPage = 1;
        this.renderStories();
        
        // Scroll to stories section
        const storiesSection = document.getElementById('stories');
        if (storiesSection) {
            storiesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    loadMoreStories() {
        this.currentPage++;
        this.renderStories();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        const totalShown = this.currentPage * this.storiesPerPage;
        
        if (totalShown >= this.filteredStories.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
            const remaining = this.filteredStories.length - totalShown;
            loadMoreBtn.textContent = `Load More (${remaining} remaining)`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FirebaseStoryWebsite();
});

// Export for use in other files
window.FirebaseStoryWebsite = FirebaseStoryWebsite;
