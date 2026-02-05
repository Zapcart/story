// Firebase SDK v9 imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGFiKZoeVJvWOlNqJS-Mf9SHzSpK_XQxo",
  authDomain: "story-34914.firebaseapp.com",
  projectId: "story-34914",
  storageBucket: "story-34914.firebasestorage.app",
  messagingSenderId: "86978846669",
  appId: "1:86978846669:web:e3237eaaad3bf8c392ae84",
  measurementId: "G-8Z8WKDQ8TG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const storyModal = document.getElementById('storyModal');
const deleteModal = document.getElementById('deleteModal');
const storyForm = document.getElementById('storyForm');
const storiesContainer = document.getElementById('storiesContainer');
const logsContainer = document.getElementById('logsContainer');

// State
let currentUser = null;
let stories = [];
let currentEditId = null;
let deleteStoryId = null;

// Logging System
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;
  
  logsContainer.appendChild(logEntry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('userEmail').textContent = user.email;
    loginScreen.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    log(`User logged in: ${user.email}`, 'success');
    loadStories();
    updateDashboardStats();
  } else {
    currentUser = null;
    loginScreen.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    log('User logged out', 'info');
  }
});

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('loginError');
  
  try {
    log(`Attempting login for: ${email}`, 'info');
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = '';
    showToast('Login successful!', 'success');
  } catch (error) {
    log(`Login failed: ${error.message}`, 'error');
    loginError.textContent = error.message;
    showToast('Login failed: ' + error.message, 'error');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    showToast('Logged out successfully', 'success');
  } catch (error) {
    log(`Logout error: ${error.message}`, 'error');
    showToast('Logout failed', 'error');
  }
});

// Load Stories
async function loadStories() {
  try {
    log('Loading stories from Firestore...', 'info');
    storiesContainer.innerHTML = '<div class="loading">Loading stories...</div>';
    
    const storiesQuery = query(
      collection(firestore, 'stories'),
      orderBy('publish_date', 'desc')
    );
    
    const querySnapshot = await getDocs(storiesQuery);
    stories = [];
    
    querySnapshot.forEach((doc) => {
      stories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    log(`Loaded ${stories.length} stories`, 'success');
    console.log('📚 Stories loaded:', stories);
    
    renderStories();
    updateDashboardStats();
    
  } catch (error) {
    log(`Error loading stories: ${error.message}`, 'error');
    storiesContainer.innerHTML = '<div class="error-message">Error loading stories. Please refresh.</div>';
    showToast('Error loading stories', 'error');
  }
}

// Render Stories Table
function renderStories() {
  if (stories.length === 0) {
    storiesContainer.innerHTML = '<div class="empty-state">No stories found. Create your first story!</div>';
    return;
  }
  
  const tableHTML = `
    <table class="stories-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Category</th>
          <th>Publish Date</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${stories.map(story => `
          <tr>
            <td><strong>${story.title || 'Untitled'}</strong></td>
            <td>
              <span class="status-badge status-${story.status}">
                ${story.status || 'draft'}
              </span>
            </td>
            <td>${story.category || 'N/A'}</td>
            <td>${formatDate(story.publish_date)}</td>
            <td>${story.featured ? '⭐' : '-'}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm btn-primary" onclick="editStory('${story.id}')">Edit</button>
                <button class="btn btn-sm ${story.status === 'published' ? 'btn-secondary' : 'btn-success'}" 
                        onclick="togglePublish('${story.id}')">
                  ${story.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStory('${story.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  storiesContainer.innerHTML = tableHTML;
}

// Update Dashboard Stats
function updateDashboardStats() {
  const total = stories.length;
  const published = stories.filter(s => s.status === 'published').length;
  const drafts = stories.filter(s => s.status === 'draft').length;
  const featured = stories.filter(s => s.featured).length;
  
  document.getElementById('totalStories').textContent = total;
  document.getElementById('publishedStories').textContent = published;
  document.getElementById('draftStories').textContent = drafts;
  document.getElementById('featuredStories').textContent = featured;
}

// Format Date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Modal Functions
document.getElementById('addStoryBtn').addEventListener('click', () => {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add New Story';
  storyForm.reset();
  clearValidationErrors();
  storyModal.style.display = 'block';
});

function closeModal() {
  storyModal.style.display = 'none';
  clearValidationErrors();
}

function closeDeleteModal() {
  deleteModal.style.display = 'none';
  deleteStoryId = null;
}

// Clear Validation Errors
function clearValidationErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

// Validate Form
function validateForm() {
  let isValid = true;
  clearValidationErrors();
  
  const title = document.getElementById('title').value.trim();
  const slug = document.getElementById('slug').value.trim();
  const category = document.getElementById('category').value;
  const excerpt = document.getElementById('excerpt').value.trim();
  const content = document.getElementById('content').value.trim();
  
  if (!title) {
    document.getElementById('titleError').textContent = 'Title is required';
    isValid = false;
  }
  
  if (!slug) {
    document.getElementById('slugError').textContent = 'Slug is required';
    isValid = false;
  }
  
  if (!category) {
    document.getElementById('categoryError').textContent = 'Category is required';
    isValid = false;
  }
  
  if (!excerpt) {
    document.getElementById('excerptError').textContent = 'Excerpt is required';
    isValid = false;
  }
  
  if (!content) {
    document.getElementById('contentError').textContent = 'Content is required';
    isValid = false;
  }
  
  return isValid;
}

// Story Form Submit
storyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const storyData = {
    title: document.getElementById('title').value.trim(),
    slug: document.getElementById('slug').value.trim(),
    category: document.getElementById('category').value,
    excerpt: document.getElementById('excerpt').value.trim(),
    content: document.getElementById('content').value.trim(),
    cover_image: document.getElementById('cover_image').value.trim(),
    featured: document.getElementById('featured').checked,
    status: document.getElementById('status').value,
    publish_date: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  
  try {
    if (currentEditId) {
      // Update existing story
      log(`Updating story: ${storyData.title}`, 'info');
      await updateDoc(doc(firestore, 'stories', currentEditId), storyData);
      log(`Story updated successfully: ${currentEditId}`, 'success');
      showToast('Story updated successfully!', 'success');
    } else {
      // Add new story
      log(`Creating new story: ${storyData.title}`, 'info');
      const docRef = await addDoc(collection(firestore, 'stories'), {
        ...storyData,
        created_at: serverTimestamp()
      });
      log(`Story created successfully: ${docRef.id}`, 'success');
      showToast('Story created successfully!', 'success');
    }
    
    closeModal();
    loadStories();
    
  } catch (error) {
    log(`Error saving story: ${error.message}`, 'error');
    showToast('Error saving story: ' + error.message, 'error');
  }
});

// Edit Story
function editStory(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  currentEditId = storyId;
  document.getElementById('modalTitle').textContent = 'Edit Story';
  
  document.getElementById('title').value = story.title || '';
  document.getElementById('slug').value = story.slug || '';
  document.getElementById('category').value = story.category || '';
  document.getElementById('excerpt').value = story.excerpt || '';
  document.getElementById('content').value = story.content || '';
  document.getElementById('cover_image').value = story.cover_image || '';
  document.getElementById('featured').checked = story.featured || false;
  document.getElementById('status').value = story.status || 'draft';
  
  clearValidationErrors();
  storyModal.style.display = 'block';
}

// Toggle Publish Status
async function togglePublish(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  const newStatus = story.status === 'published' ? 'draft' : 'published';
  
  try {
    log(`Toggling story status: ${story.title} -> ${newStatus}`, 'info');
    await updateDoc(doc(firestore, 'stories', storyId), {
      status: newStatus,
      publish_date: newStatus === 'published' ? serverTimestamp() : story.publish_date,
      updated_at: serverTimestamp()
    });
    
    log(`Story status updated: ${storyId} -> ${newStatus}`, 'success');
    showToast(`Story ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`, 'success');
    loadStories();
    
  } catch (error) {
    log(`Error updating story status: ${error.message}`, 'error');
    showToast('Error updating story status', 'error');
  }
}

// Delete Story
function deleteStory(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  deleteStoryId = storyId;
  document.getElementById('deleteStoryTitle').textContent = story.title;
  deleteModal.style.display = 'block';
}

// Confirm Delete
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteStoryId) return;
  
  try {
    const story = stories.find(s => s.id === deleteStoryId);
    log(`Deleting story: ${story?.title}`, 'info');
    
    await deleteDoc(doc(firestore, 'stories', deleteStoryId));
    
    log(`Story deleted successfully: ${deleteStoryId}`, 'success');
    showToast('Story deleted successfully!', 'success');
    
    closeDeleteModal();
    loadStories();
    
  } catch (error) {
    log(`Error deleting story: ${error.message}`, 'error');
    showToast('Error deleting story', 'error');
  }
});

// Real-time Updates
function setupRealtimeUpdates() {
  try {
    log('Setting up real-time updates...', 'info');
    
    const storiesQuery = query(
      collection(firestore, 'stories'),
      orderBy('publish_date', 'desc')
    );
    
    onSnapshot(storiesQuery, (snapshot) => {
      const changes = snapshot.docChanges();
      if (changes.length > 0) {
        log(`Real-time update: ${changes.length} changes detected`, 'info');
        
        changes.forEach((change) => {
          const story = change.doc.data();
          const storyId = change.doc.id;
          
          if (change.type === 'added') {
            log(`➕ Story added: ${story.title}`, 'success');
          } else if (change.type === 'modified') {
            log(`✏️ Story modified: ${story.title}`, 'info');
          } else if (change.type === 'removed') {
            log(`🗑️ Story removed: ${story.title}`, 'error');
          }
        });
        
        loadStories();
      }
    }, (error) => {
      log(`Real-time update error: ${error.message}`, 'error');
    });
    
    log('Real-time updates setup complete', 'success');
    
  } catch (error) {
    log(`Error setting up real-time updates: ${error.message}`, 'error');
  }
}

// Initialize
if (currentUser) {
  loadStories();
  setupRealtimeUpdates();
}

log('Admin panel initialized', 'success');
