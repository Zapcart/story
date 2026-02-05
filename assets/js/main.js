// Firebase SDK v9 modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGFiKZoeVJvWOlNqJS-Mf9SHzSpK_XQxo",
  authDomain: "story-34914.firebaseapp.com",
  databaseURL: "https://story-34914-default-rtdb.firebaseio.com",
  projectId: "story-34914",
  storageBucket: "story-34914.firebasestorage.app",
  messagingSenderId: "86978846669",
  appId: "1:86978846669:web:e3237eaaad3bf8c392ae84",
  measurementId: "G-8Z8WKDQ8TG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const db = getDatabase(app);

console.log("🔥 Firebase initialized successfully");
console.log("📚 Firestore instance:", firestore);
console.log("🔗 Firebase Project ID:", firebaseConfig.projectId);

/* =========================
   SITE SETTINGS (FROM REALTIME DB)
========================= */

const siteRef = ref(db, "site");

onValue(siteRef, (snapshot) => {
  if (snapshot.exists()) {
    const site = snapshot.val();
    console.log("🏠 Live Site Data:", site);

    // Update site title
    if (site.title) {
      document.title = site.title;
      const brandTitle = document.querySelector(".nav-brand h1 a");
      if (brandTitle) brandTitle.textContent = site.title;
    }

    // Update logo if available
    const logoImg = document.getElementById("siteLogo");
    if (logoImg && site.logo) {
      logoImg.src = site.logo;
    }
  }
});

/* =========================
   CATEGORIES (FROM REALTIME DB)
========================= */

const categoriesRef = ref(db, "categories");

onValue(categoriesRef, (snapshot) => {
  const categoryGrid = document.getElementById("categoryGrid");
  if (!categoryGrid) return;

  categoryGrid.innerHTML = "";

  if (snapshot.exists()) {
    const categories = snapshot.val();
    Object.keys(categories).forEach((key) => {
      const cat = categories[key];
      const div = document.createElement("div");
      div.className = "category-card";
      div.innerHTML = `
        <h3>${cat.name || "Category"}</h3>
        <p>${cat.description || ""}</p>
      `;
      categoryGrid.appendChild(div);
    });
  }
});

/* =========================
   STORIES FROM FIRESTORE
========================= */

// Format date helper function
function formatDate(timestamp) {
  if (!timestamp) return "No date";
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Load featured story
async function loadFeaturedStory() {
  try {
    console.log("⭐ Loading featured story from Firestore...");
    
    const featuredQuery = query(
      collection(firestore, "stories"),
      where("status", "==", "published"),
      where("featured", "==", true),
      orderBy("publish_date", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(featuredQuery);
    const featuredStoryCard = document.getElementById("featuredStoryCard");
    
    if (!featuredStoryCard) {
      console.log("❌ featuredStoryCard element not found");
      return;
    }
    
    if (querySnapshot.empty) {
      console.log("ℹ️ No featured stories found");
      featuredStoryCard.innerHTML = `
        <div class="featured-story-content">
          <h3>No featured story available</h3>
          <p>Check back later for amazing featured content!</p>
        </div>
      `;
      return;
    }
    
    const storyDoc = querySnapshot.docs[0];
    const story = storyDoc.data();
    const storyId = storyDoc.id;
    
    console.log("✅ Featured story loaded:", { id: storyId, title: story.title, data: story });
    console.log("📄 Raw Firestore doc:", story);
    
    featuredStoryCard.innerHTML = `
      <div class="featured-story-content">
        ${story.cover_image ? `<img src="${story.cover_image}" alt="${story.title}" class="featured-story-cover" onerror="this.style.display='none'">` : ''}
        <h3>${story.title || "Untitled Story"}</h3>
        <p class="featured-story-excerpt">${story.excerpt || "No excerpt available"}</p>
        <div class="featured-story-meta">
          <span class="category">${story.category || "General"}</span>
          <span class="date">${formatDate(story.publish_date)}</span>
          ${story.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
        </div>
        <a href="story.html?id=${storyId}" class="read-more-btn">Read Full Story</a>
      </div>
    `;
    
  } catch (error) {
    console.error("❌ Error loading featured story:", error);
    const featuredStoryCard = document.getElementById("featuredStoryCard");
    if (featuredStoryCard) {
      featuredStoryCard.innerHTML = `
        <div class="featured-story-content">
          <h3>Unable to load featured story</h3>
          <p>Please refresh the page or try again later.</p>
        </div>
      `;
    }
  }
}

// Load latest stories
async function loadLatestStories() {
  try {
    console.log("📚 Loading latest stories from Firestore...");
    
    const storiesQuery = query(
      collection(firestore, "stories"),
      where("status", "==", "published"),
      orderBy("publish_date", "desc"),
      limit(12)
    );
    
    const querySnapshot = await getDocs(storiesQuery);
    const storyGrid = document.getElementById("storyGrid");
    
    if (!storyGrid) {
      console.log("❌ storyGrid element not found");
      return;
    }
    
    storyGrid.innerHTML = "";
    
    if (querySnapshot.empty) {
      console.log("⚠️ WARNING: No published stories found in Firestore");
      console.log("📋 Query details:", {
        collection: "stories",
        status: "published",
        orderBy: "publish_date",
        limit: 12
      });
      
      storyGrid.innerHTML = `
        <div class="no-stories" style="text-align: center; padding: 3rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin: 1rem 0;">
          <h3 style="color: #92400e; margin-bottom: 0.5rem;">⚠️ No Stories Available</h3>
          <p style="color: #92400e; margin-bottom: 0.5rem;">No published stories found in Firestore.</p>
          <p style="color: #92400e; font-size: 0.875rem;">Please check the admin panel to add and publish stories.</p>
        </div>
      `;
      return;
    }
    
    console.log(`✅ Successfully loaded ${querySnapshot.docs.length} published stories from Firestore`);
    console.log("📊 Story count breakdown:", {
      totalLoaded: querySnapshot.docs.length,
      queryLimit: 12,
      status: "published",
      orderBy: "publish_date DESC"
    });
    
    querySnapshot.forEach((doc) => {
      const story = doc.data();
      const storyId = doc.id;
      
      console.log(`📖 Story: ${story.title} (${storyId})`, story);
      console.log("📄 Raw Firestore document:", {
        id: storyId,
        title: story.title,
        status: story.status,
        featured: story.featured,
        publish_date: story.publish_date,
        category: story.category,
        hasExcerpt: !!story.excerpt,
        hasCoverImage: !!story.cover_image
      });
      
      const storyCard = document.createElement("div");
      storyCard.className = "story-card";
      storyCard.innerHTML = `
        <div class="story-card-content">
          ${story.cover_image ? `<img src="${story.cover_image}" alt="${story.title}" class="story-cover" onerror="this.style.display='none'">` : ''}
          <h3>${story.title || "Untitled Story"}</h3>
          <p class="story-excerpt">${story.excerpt || "No excerpt available"}</p>
          <div class="story-meta">
            <span class="category">${story.category || "General"}</span>
            <span class="date">${formatDate(story.publish_date)}</span>
            ${story.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
          </div>
          <a href="story.html?id=${storyId}" class="read-more-btn">Read More</a>
        </div>
      `;
      
      storyGrid.appendChild(storyCard);
    });
    
    console.log("🎯 Frontend rendering complete - Stories should now be visible");
    
  } catch (error) {
    console.error("❌ Error loading latest stories:", error);
    console.error("🔍 Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    const storyGrid = document.getElementById("storyGrid");
    if (storyGrid) {
      storyGrid.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 3rem; background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; margin: 1rem 0;">
          <h3 style="color: #991b1b; margin-bottom: 0.5rem;">❌ Unable to Load Stories</h3>
          <p style="color: #991b1b; margin-bottom: 0.5rem;">We're having trouble loading stories from Firestore.</p>
          <p style="color: #991b1b; font-size: 0.875rem;">Error: ${error.message}</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
        </div>
      `;
    }
  }
}

// Real-time updates for stories
function setupRealtimeUpdates() {
  try {
    console.log("🔄 Setting up real-time updates for stories...");
    
    const storiesQuery = query(
      collection(firestore, "stories"),
      where("status", "==", "published"),
      orderBy("publish_date", "desc")
    );
    
    onSnapshot(storiesQuery, (snapshot) => {
      console.log("🔄 Real-time update received:", snapshot.docChanges().length, "changes");
      
      if (snapshot.docChanges().length > 0) {
        snapshot.docChanges().forEach((change) => {
          const story = change.doc.data();
          const storyId = change.doc.id;
          
          switch (change.type) {
            case 'added':
              console.log("➕ New story added:", story.title);
              console.log("📄 Raw Firestore doc:", story);
              showToast("New Story Published", `"${story.title}" is now live`, "success");
              break;
            case 'modified':
              console.log("✏️ Story modified:", story.title);
              console.log("📄 Raw Firestore doc:", story);
              showToast("Story Updated", `"${story.title}" has been updated`, "info");
              break;
            case 'removed':
              console.log("🗑️ Story removed:", story.title);
              showToast("Story Removed", `"${story.title}" has been removed`, "warning");
              break;
          }
        });
        
        console.log("🔄 Reloading stories due to real-time changes...");
        loadFeaturedStory();
        loadLatestStories();
      }
    }, (error) => {
      console.error("❌ Real-time update error:", error);
      console.error("🔍 Real-time error details:", {
        message: error.message,
        code: error.code
      });
    });
    
    console.log("✅ Real-time updates setup complete");
    
  } catch (error) {
    console.error("❌ Error setting up real-time updates:", error);
  }
}

// Toast notification system
function showToast(title, message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement("div");
  toast.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.innerHTML = `
    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 14px; color: #6b7280;">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
function initializeApp() {
  console.log("🚀 Initializing DesiStory frontend app...");
  console.log("📋 Configuration:", {
    projectId: firebaseConfig.projectId,
    collection: "stories",
    statusFilter: "published",
    orderBy: "publish_date DESC",
    limit: 12
  });
  
  // Load initial data
  loadFeaturedStory();
  loadLatestStories();
  
  // Setup real-time updates
  setupRealtimeUpdates();
  
  console.log("✅ Frontend app initialization complete");
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}

console.log("📚 DesiStory main.js loaded successfully");
