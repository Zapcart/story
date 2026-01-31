// Story page JavaScript - Premium Edition

class StoryPage {
    constructor() {
        this.story = null;
        this.relatedStories = [];
        this.readingProgress = 0;
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        
        if (!slug) {
            window.location.href = '/';
            return;
        }

        this.setupReadingProgress();
        await this.loadStory(slug);
        await this.loadRelatedStories();
        this.renderStory();
        this.renderRelatedStories();
        this.updateSEO();
        this.setupShareButtons();
    }

    setupReadingProgress() {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            this.readingProgress = (winScroll / height) * 100;
            
            const progressBar = document.getElementById('readingProgress');
            if (progressBar) {
                progressBar.style.width = this.readingProgress + '%';
            }
        });
    }

    setupShareButtons() {
        // Add event listeners for share buttons
        const shareButtons = document.querySelectorAll('.share-button');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
            });
        });
    }

    async loadStory(slug) {
        try {
            // Try to load from individual story file
            const response = await fetch(`content/stories/${slug}.json`);
            if (response.ok) {
                this.story = await response.json();
                return;
            }
        } catch (error) {
            console.log('Individual story file not found, trying index...');
        }

        // Fallback to loading from index
        try {
            const response = await fetch('content/stories/index.json');
            if (response.ok) {
                const data = await response.json();
                this.story = data.stories.find(s => s.slug === slug);
            }
        } catch (error) {
            console.log('Index not found, using demo data...');
        }

        // Final fallback to demo stories
        if (!this.story) {
            const demoStories = [
                {
                    title: "जंगल की कहानी",
                    slug: "jungle-ki-kahani",
                    category: "Folk Tales",
                    description: "एक पुरानी जंगल की रोचक कहानी जो बच्चों को बहुत पसंद आएगी।",
                    coverImage: "https://picsum.photos/seed/jungle/800/400.jpg",
                    date: "2024-01-15",
                    status: "Published",
                    tags: ["जंगल", "बच्चे", "कहानी"],
                    content: `# जंगल की कहानी

एक समय की बात है, एक घने जंगल में एक छोटा बच्चा रहता था। वह रोज जंगल में घूमना पसंद करता था। एक दिन उसे जंगल में एक बहुत ही सुंदर फूल दिखाई दिया।

## फूल की खूबसूरती

फूल इतना सुंदर था कि बच्चा उसे तोड़कर अपने घर ले जाना चाहता था। जैसे ही उसने फूल तोड़ने के लिए हाथ बढ़ाया, एक छोटी चिड़िया आकर उसके कंधे पर बैठ गई।

"यह फूल मत तोड़ो," चिड़िया ने कहा।

"क्यों?" बच्चे ने पूछा।

"यह फूल हमारे जंगल की शान है। अगर तुम इसे तोड़ोगे तो यह मर जाएगा और दूसरे बच्चे इसकी खूबसूरती नहीं देख पाएंगे।"

## बच्चे की समझ

बच्चा चिड़िया की बात समझ गया। उसने फूल तोड़ने का विचार छोड़ दिया। उसने सोचा कि सच में, अगर हर कोई फूल तोड़ने लगे तो जंगल की खूबसूरती ही क्या रहेगी।

बच्चे ने चिड़िया से कहा, "तुम्हारी बात सही है। मैं इस फूल को यहीं छोड़ देता हूं।"

## सीख

यह कहानी हमें सिखाती है कि प्रकृति की खूबसूरती को बचाना हम सबकी जिम्मेदारी है। हमें केवल अपनी इच्छाओं के बारे में नहीं सोचना चाहिए, बल्कि दूसरों के बारे में भी सोचना चाहिए।

जब हम प्रकृति का देखभाल करते हैं, तो प्रकृति भी हमें अपनी खूबसूरती से रोशन करती है।`
                },
                {
                    title: "राजा और गरीब",
                    slug: "raja-aur-garib",
                    category: "Inspirational",
                    description: "एक राजा और गरीब की यह कहानी सिखाती है कि असली खुशी क्या होती है।",
                    coverImage: "https://picsum.photos/seed/king/800/400.jpg",
                    date: "2024-01-14",
                    status: "Published",
                    tags: ["राजा", "गरीब", "सीख"],
                    content: `# राजा और गरीब

किसी राज्य में एक बहुत ही धनवान राजा रहता था। उसके पास सब कुछ था - पैसा, महल, सेवक, पर फिर भी वह उदास रहता था।

## राजा की चिंता

एक दिन राजा ने अपने मंत्री से कहा, "मेरे पास सब कुछ है, पर मुझे खुशी नहीं मिल रही। मुझे बताओ कि मैं क्या करूं?"

मंत्री ने कहा, "महाराज, शायद आपको अपने राज्य में घूमना चाहिए। देखना चाहिए कि आपकी प्रजा कैसे जीती है।"

## राजा की यात्रा

अगले दिन राजा सादे कपड़ों में अपने राज्य में घूमने निकला। वह एक छोटे से गांव में पहुंचा। वहां उसने एक गरीब किसान देखा जो अपने खेत में काम कर रहा था।

किसान के कपड़े फटे हुए थे, पर उसके चेहरे पर एक अजीब सी खुशी थी। वह गा रहा था और अपने काम में मगन था।

## राजा और किसान की बातचीत

राजा किसान के पास गया और पूछा, "तुम इतने गरीब हो, फिर भी इतने खुश कैसे हो?"

किसान मुस्कुराया और बोला, "मैं गरीब हूं, पर मेरे पास मेरा परिवार है, मेरा खेत है, और भगवान की कृपा है। मैं ईमानदारी से काम करता हूं और भगवान पर भरोसा रखता हूं।"

## राजा को समझ

राजा को किसान की बात समझ में आ गई। उसने सोचा कि असली खुशी पैसे में नहीं, बल्कि संतोष और ईमानदारी में है।

राजा ने किसान से कहा, "तुमने मुझे असली खुशी का रास्ता दिखाया है। मैं भी अपने राज्य की सेवा करूंगा और अपनी प्रजा के लिए काम करूंगा।"

## सीख

यह कहानी हमें सिखाती है कि असली खुशी धन-संपत्ति में नहीं, बल्कि संतोष, ईमानदारी और दूसरों की सेवा करने में है।`
                }
            ];
            
            this.story = demoStories.find(s => s.slug === slug);
        }

        if (!this.story) {
            window.location.href = '/';
            return;
        }
    }

    async loadRelatedStories() {
        // Load all stories to find related ones
        try {
            const response = await fetch('content/stories/index.json');
            if (response.ok) {
                const data = await response.json();
                const allStories = data.stories || [];
                this.relatedStories = allStories
                    .filter(s => s.slug !== this.story.slug && s.category === this.story.category)
                    .slice(0, 3);
                return;
            }
        } catch (error) {
            console.log('Using demo related stories...');
        }

        // Fallback to demo related stories
        this.relatedStories = [
            {
                title: "चालाक लोमड़ी",
                slug: "chalak-lomdi",
                category: "Children Stories",
                description: "चालाक लोमड़ी की मजेदार कहानी।",
                coverImage: "https://picsum.photos/seed/fox/400/300.jpg",
                date: "2024-01-13"
            },
            {
                title: "वीर योद्धा",
                slug: "veer-yoddha",
                category: "Adventure",
                description: "एक वीर योद्धा की रोमांचक कहानी।",
                coverImage: "https://picsum.photos/seed/warrior/400/300.jpg",
                date: "2024-01-12"
            }
        ];
    }

    renderStory() {
        // Update story title with animation
        const storyTitle = document.getElementById('storyTitle');
        if (storyTitle) {
            storyTitle.style.opacity = '0';
            setTimeout(() => {
                storyTitle.textContent = this.story.title;
                storyTitle.style.opacity = '1';
            }, 300);
        }

        // Update story meta
        const storyDate = document.getElementById('storyDate');
        if (storyDate) {
            storyDate.textContent = this.formatDate(this.story.date);
        }

        const storyCategory = document.getElementById('storyCategory');
        const storyCategoryBadge = document.getElementById('storyCategoryBadge');
        if (storyCategory && storyCategoryBadge) {
            storyCategory.textContent = this.story.category;
            storyCategoryBadge.textContent = this.story.category;
        }

        // Update read time
        const readTime = document.getElementById('readTime');
        if (readTime) {
            const wordsPerMinute = 200;
            const wordCount = this.story.content.split(' ').length;
            const minutes = Math.ceil(wordCount / wordsPerMinute);
            readTime.textContent = `${minutes} min read`;
        }

        // Update story image with lazy loading
        const storyImage = document.getElementById('storyImage');
        if (storyImage) {
            storyImage.src = this.story.coverImage || `https://picsum.photos/seed/${this.story.slug}/800/400.jpg`;
            storyImage.alt = this.story.title;
            storyImage.loading = 'lazy';
        }

        // Update story content with enhanced markdown
        const storyContent = document.getElementById('storyContent');
        if (storyContent) {
            const htmlContent = this.markdownToHtml(this.story.content);
            storyContent.innerHTML = htmlContent;
            
            // Add fade-in animation to content
            storyContent.style.opacity = '0';
            setTimeout(() => {
                storyContent.style.transition = 'opacity 0.5s ease';
                storyContent.style.opacity = '1';
            }, 500);
        }
    }

    renderRelatedStories() {
        const relatedGrid = document.getElementById('relatedGrid');
        if (!relatedGrid || this.relatedStories.length === 0) {
            const relatedSection = document.querySelector('.related-stories');
            if (relatedSection) {
                relatedSection.style.display = 'none';
            }
            return;
        }

        relatedGrid.innerHTML = this.relatedStories.map(story => `
            <div class="story-card" onclick="window.location.href='story.html?slug=${story.slug}'">
                <img src="${story.coverImage || 'https://picsum.photos/seed/' + story.slug + '/400/300.jpg'}" 
                     alt="${story.title}" class="story-card-image">
                <div class="story-card-content">
                    <span class="story-card-category">${story.category}</span>
                    <h3 class="story-card-title">${story.title}</h3>
                    <p class="story-card-description">${story.description}</p>
                    <div class="story-card-meta">
                        <span>${this.formatDate(story.date)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        return markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // Paragraphs
            .replace(/\n\n/gim, '</p><p>')
            // Start with paragraph
            .replace(/^/, '<p>')
            // End with paragraph
            .replace(/$/, '</p>')
            // Line breaks
            .replace(/\n/gim, '<br>');
    }

    updateSEO() {
        // Update page title
        document.title = `${this.story.title} - Desi Story`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = this.story.description;
        }

        // Update meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            const keywords = [
                this.story.title.toLowerCase(),
                this.story.category.toLowerCase(),
                ... (this.story.tags || [])
            ].join(', ');
            metaKeywords.content = keywords;
        }

        // Update canonical URL
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = `https://desistory.in/story/${this.story.slug}`;

        // Add structured data (JSON-LD)
        this.addStructuredData();
    }

    addStructuredData() {
        // Remove existing structured data if any
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": this.story.title,
            "description": this.story.description,
            "image": this.story.coverImage || `https://desistory.in/assets/images/${this.story.slug}.jpg`,
            "author": {
                "@type": "Organization",
                "name": "Desi Story"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Desi Story",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://desistory.in/assets/logo.png"
                }
            },
            "datePublished": this.story.date,
            "dateModified": this.story.date,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://desistory.in/story/${this.story.slug}`
            }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData, null, 2);
        document.head.appendChild(script);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('hi-IN', options);
    }
}

// Share functionality
function shareStory(platform) {
    const url = window.location.href;
    const title = document.getElementById('storyTitle')?.textContent || 'Amazing Hindi Story';
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        // Show success feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.style.color = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

// Initialize the story page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StoryPage();
});
