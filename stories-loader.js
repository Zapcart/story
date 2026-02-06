// Stories Loader for DesiStory - Firebase Integration
import { db } from "./firebase.js";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const storiesContainer = document.getElementById("storiesContainer");

async function loadStories() {
  console.log('🔥 Loading stories from Firestore...');
  
  try {
    const q = query(
      collection(db, "stories"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    console.log(`✅ Found ${querySnapshot.docs.length} stories`);

    storiesContainer.innerHTML = "";

    if (querySnapshot.empty) {
      storiesContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <h3>No stories found</h3>
          <p>Check back later for amazing content!</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📖 Story:', data.title, data);

      const storyCard = `
        <div class="story-card">
          <img src="${data.imageUrl || 'https://picsum.photos/seed/' + doc.id + '/400/300.jpg'}" alt="${data.title}" onerror="this.src='https://picsum.photos/seed/fallback/400/300.jpg'">
          <h3>${data.title}</h3>
          <p>${data.description || data.excerpt || 'No description available'}</p>
          <div class="story-meta">
            <span class="date">📅 ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'No date'}</span>
            ${data.category ? `<span class="category">📁 ${data.category}</span>` : ''}
          </div>
        </div>
      `;

      storiesContainer.innerHTML += storyCard;
    });

    console.log('✅ Stories loaded successfully');
  } catch (error) {
    console.error('❌ Error loading stories:', error);
    storiesContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: red;">
        <h3>Error loading stories</h3>
        <p>Please try again later.</p>
        <small>Error: ${error.message}</small>
      </div>
    `;
  }
}

// Load stories when page loads
document.addEventListener('DOMContentLoaded', loadStories);

// Also make it globally accessible
window.loadStories = loadStories;
