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
const debugLogs = document.getElementById('debugLogs');
const toastContainer = document.getElementById('toastContainer');

// State
let currentUser = null;
let stories = [];
let currentEditId = null;
let deleteStoryId = null;
let unsubscribeRealtime = null;

// Debug Logging System
function debugLog(message, type = 'info', data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `debug-entry ${type}`;
  
  let logText = `[${timestamp}] ${message}`;
  if (data) {
    logText += ` | Data: ${JSON.stringify(data)}`;
  }
  
  logEntry.textContent = logText;
  debugLogs.appendChild(logEntry);
  debugLogs.scrollTop = debugLogs.scrollHeight;
  
  // Also log to console with proper formatting
  const consoleMessage = `[${type.toUpperCase()}] ${message}`;
  switch(type) {
    case 'success':
      console.log(`%c${consoleMessage}`, 'color: #10b981; font-weight: bold;', data);
      break;
    case 'error':
      console.error(`%c${consoleMessage}`, 'color: #ef4444; font-weight: bold;', data);
      break;
    case 'warning':
      console.warn(`%c${consoleMessage}`, 'color: #f59e0b; font-weight: bold;', data);
      break;
    default:
      console.log(`%c${consoleMessage}`, 'color: #3b82f6; font-weight: bold;', data);
  }
}

// Clear debug logs
function clearDebugLogs() {
  debugLogs.innerHTML = '';
  debugLog('Debug logs cleared', 'info');
}

// Toast Notification System
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type]}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// Authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('userEmail').textContent = user.email;
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    debugLog(`User authenticated: ${user.email}`, 'success', { uid: user.uid });
    showToast('Login Successful', `Welcome back, ${user.email}`, 'success');
    
    initializeDashboard();
  } else {
    currentUser = null;
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
    
    debugLog('User logged out', 'info');
    
    // Cleanup real-time listener
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
      unsubscribeRealtime = null;
    }
  }
});

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('loginError');
  
  try {
    debugLog(`Attempting login for: ${email}`, 'info');
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = '';
  } catch (error) {
    debugLog(`Login failed: ${error.message}`, 'error', { code: error.code });
    loginError.textContent = error.message;
    showToast('Login Failed', error.message, 'error');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    showToast('Logged Out', 'You have been successfully logged out', 'success');
  } catch (error) {
    debugLog(`Logout error: ${error.message}`, 'error');
    showToast('Logout Failed', error.message, 'error');
  }
});

// Initialize Dashboard
function initializeDashboard() {
  loadStories();
  setupRealtimeUpdates();
  setupEventListeners();
  updateDashboardStats();
  debugLog('Dashboard initialized', 'success');
}

// Setup Event Listeners
function setupEventListeners() {
  // Add Story Button
  document.getElementById('addStoryBtn').addEventListener('click', () => {
    openStoryModal();
  });
  
  // Story Form Submit
  storyForm.addEventListener('submit', handleStorySubmit);
  
  // Search and Filters
  document.getElementById('searchInput').addEventListener('input', filterStories);
  document.getElementById('statusFilter').addEventListener('change', filterStories);
  document.getElementById('featuredFilter').addEventListener('change', filterStories);
  
  // Delete Confirmation
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  
  debugLog('Event listeners setup complete', 'info');
}

// Load Stories from Firestore
async function loadStories() {
  try {
    debugLog('Loading stories from Firestore...', 'info');
    showLoadingState();
    
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
    
    debugLog(`Loaded ${stories.length} stories from Firestore`, 'success', { count: stories.length });
    console.log('📚 Stories loaded:', stories);
    
    renderStories();
    updateDashboardStats();
    
  } catch (error) {
    debugLog(`Error loading stories: ${error.message}`, 'error', { error: error.code });
    showErrorState('Error loading stories. Please refresh the page.');
    showToast('Load Failed', 'Unable to load stories from Firestore', 'error');
  }
}

// Setup Real-time Updates
function setupRealtimeUpdates() {
  try {
    debugLog('Setting up real-time updates...', 'info');
    
    const storiesQuery = query(
      collection(firestore, 'stories'),
      orderBy('publish_date', 'desc')
    );
    
    unsubscribeRealtime = onSnapshot(storiesQuery, (snapshot) => {
      const changes = snapshot.docChanges();
      if (changes.length > 0) {
        debugLog(`Real-time update: ${changes.length} changes detected`, 'info');
        
        changes.forEach((change) => {
          const story = change.doc.data();
          const storyId = change.doc.id;
          
          switch (change.type) {
            case 'added':
              debugLog(`Story added: ${story.title}`, 'success', { id: storyId, title: story.title });
              break;
            case 'modified':
              debugLog(`Story modified: ${story.title}`, 'warning', { id: storyId, title: story.title });
              break;
            case 'removed':
              debugLog(`Story removed: ${story.title}`, 'error', { id: storyId, title: story.title });
              break;
          }
        });
        
        // Reload stories to reflect changes
        loadStories();
      }
    }, (error) => {
      debugLog(`Real-time update error: ${error.message}`, 'error', { error: error.code });
    });
    
    debugLog('Real-time updates setup complete', 'success');
    
  } catch (error) {
    debugLog(`Error setting up real-time updates: ${error.message}`, 'error');
  }
}

// Render Stories Table
function renderStories(filteredStories = null) {
  const storiesToRender = filteredStories || stories;
  
  if (storiesToRender.length === 0) {
    storiesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-title">No stories found</div>
        <p>Create your first story to get started!</p>
      </div>
    `;
    return;
  }
  
  const tableHTML = `
    <table class="stories-table">
      <thead>
        <tr>
          <th>Story</th>
          <th>ID</th>
          <th>Status</th>
          <th>Category</th>
          <th>Featured</th>
          <th>Publish Date</th>
          <th>Last Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${storiesToRender.map(story => `
          <tr>
            <td>
              <div class="story-title">${story.title || 'Untitled'}</div>
              <div class="story-meta">
                <span>Slug: ${story.slug || 'N/A'}</span>
              </div>
            </td>
            <td>
              <span class="story-id">${story.id.substring(0, 8)}...</span>
            </td>
            <td>
              <span class="status-badge status-${story.status || 'draft'}">
                ${story.status || 'draft'}
              </span>
            </td>
            <td>${story.category || 'N/A'}</td>
            <td>
              ${story.featured ? '<span class="featured-badge">⭐ Featured</span>' : '-'}
            </td>
            <td>${formatDate(story.publish_date)}</td>
            <td>${formatDate(story.updatedAt)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm btn-primary" onclick="editStory('${story.id}')">Edit</button>
                <button class="btn btn-sm ${story.status === 'published' ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleStatus('${story.id}')">
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
  debugLog(`Rendered ${storiesToRender.length} stories in table`, 'info');
}

// Filter Stories
function filterStories() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const featuredFilter = document.getElementById('featuredFilter').value;
  
  const filtered = stories.filter(story => {
    const matchesSearch = !searchTerm || 
      story.title?.toLowerCase().includes(searchTerm) ||
      story.slug?.toLowerCase().includes(searchTerm) ||
      story.category?.toLowerCase().includes(searchTerm);
    
    const matchesStatus = !statusFilter || story.status === statusFilter;
    const matchesFeatured = !featuredFilter || story.featured?.toString() === featuredFilter;
    
    return matchesSearch && matchesStatus && matchesFeatured;
  });
  
  debugLog(`Filtered stories: ${filtered.length} of ${stories.length}`, 'info', {
    searchTerm,
    statusFilter,
    featuredFilter,
    resultCount: filtered.length
  });
  
  renderStories(filtered);
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
  
  debugLog('Dashboard stats updated', 'info', { total, published, drafts, featured });
}

// Format Date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Modal Functions
function openStoryModal(storyId = null) {
  currentEditId = storyId;
  const modalTitle = document.getElementById('modalTitle');
  const form = storyForm;
  
  if (storyId) {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    
    modalTitle.textContent = 'Edit Story';
    form.title.value = story.title || '';
    form.slug.value = story.slug || '';
    form.category.value = story.category || '';
    form.excerpt.value = story.excerpt || '';
    form.body.value = story.body || '';
    form.cover_image.value = story.cover_image || '';
    form.featured.checked = story.featured || false;
    form.status.value = story.status || 'draft';
    
    debugLog(`Opening edit modal for story: ${story.title}`, 'info', { id: storyId });
  } else {
    modalTitle.textContent = 'Add New Story';
    form.reset();
    debugLog('Opening add story modal', 'info');
  }
  
  clearValidationErrors();
  storyModal.classList.add('active');
}

function closeStoryModal() {
  storyModal.classList.remove('active');
  clearValidationErrors();
  currentEditId = null;
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  deleteStoryId = null;
}

// Clear Validation Errors
function clearValidationErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

// Validate Form
function validateForm() {
  const form = storyForm;
  let isValid = true;
  clearValidationErrors();
  
  const title = form.title.value.trim();
  const slug = form.slug.value.trim();
  const category = form.category.value;
  const excerpt = form.excerpt.value.trim();
  const body = form.body.value.trim();
  
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
  
  if (!body) {
    document.getElementById('bodyError').textContent = 'Content is required';
    isValid = false;
  }
  
  return isValid;
}

// Handle Story Form Submit
async function handleStorySubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showToast('Validation Error', 'Please fill in all required fields', 'error');
    return;
  }
  
  const form = storyForm;
  const storyData = {
    title: form.title.value.trim(),
    slug: form.slug.value.trim(),
    category: form.category.value,
    excerpt: form.excerpt.value.trim(),
    body: form.body.value.trim(),
    cover_image: form.cover_image.value.trim(),
    featured: form.featured.checked,
    status: form.status.value,
    publish_date: form.status.value === 'published' ? serverTimestamp() : null,
    updatedAt: serverTimestamp()
  };
  
  try {
    if (currentEditId) {
      // Update existing story
      debugLog(`Updating story: ${storyData.title}`, 'info', { id: currentEditId });
      await updateDoc(doc(firestore, 'stories', currentEditId), storyData);
      debugLog(`Story updated successfully: ${currentEditId}`, 'success');
      showToast('Story Updated', `"${storyData.title}" has been updated successfully`, 'success');
    } else {
      // Add new story
      debugLog(`Creating new story: ${storyData.title}`, 'info');
      const docRef = await addDoc(collection(firestore, 'stories'), {
        ...storyData,
        createdAt: serverTimestamp()
      });
      debugLog(`Story created successfully: ${docRef.id}`, 'success', { id: docRef.id });
      showToast('Story Created', `"${storyData.title}" has been created successfully`, 'success');
    }
    
    closeStoryModal();
    
  } catch (error) {
    debugLog(`Error saving story: ${error.message}`, 'error', { code: error.code });
    showToast('Save Failed', `Unable to save story: ${error.message}`, 'error');
  }
}

// Edit Story
function editStory(storyId) {
  openStoryModal(storyId);
}

// Toggle Story Status
async function toggleStatus(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  const newStatus = story.status === 'published' ? 'draft' : 'published';
  const action = newStatus === 'published' ? 'publishing' : 'unpublishing';
  
  try {
    debugLog(`${action.charAt(0).toUpperCase() + action.slice(1)} story: ${story.title}`, 'info', { 
      id: storyId, 
      oldStatus: story.status, 
      newStatus 
    });
    
    await updateDoc(doc(firestore, 'stories', storyId), {
      status: newStatus,
      publish_date: newStatus === 'published' ? serverTimestamp() : story.publish_date,
      updatedAt: serverTimestamp()
    });
    
    debugLog(`Story ${action} successfully: ${storyId}`, 'success');
    showToast(
      `Story ${action.charAt(0).toUpperCase() + action.slice(1)}`, 
      `"${story.title}" has been ${action}d successfully`, 
      'success'
    );
    
  } catch (error) {
    debugLog(`Error ${action} story: ${error.message}`, 'error');
    showToast('Action Failed', `Unable to ${action} story: ${error.message}`, 'error');
  }
}

// Delete Story
function deleteStory(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  deleteStoryId = storyId;
  document.getElementById('deleteStoryTitle').textContent = story.title;
  deleteModal.classList.add('active');
  
  debugLog(`Opening delete confirmation for: ${story.title}`, 'warning', { id: storyId });
}

// Confirm Delete
async function confirmDelete() {
  if (!deleteStoryId) return;
  
  const story = stories.find(s => s.id === deleteStoryId);
  if (!story) return;
  
  try {
    debugLog(`Deleting story: ${story.title}`, 'error', { id: deleteStoryId });
    
    await deleteDoc(doc(firestore, 'stories', deleteStoryId));
    
    debugLog(`Story deleted successfully: ${deleteStoryId}`, 'success');
    showToast('Story Deleted', `"${story.title}" has been deleted permanently`, 'success');
    
    closeDeleteModal();
    
  } catch (error) {
    debugLog(`Error deleting story: ${error.message}`, 'error');
    showToast('Delete Failed', `Unable to delete story: ${error.message}`, 'error');
  }
}

// Loading States
function showLoadingState() {
  storiesContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading stories...</p>
    </div>
  `;
}

function showErrorState(message) {
  storiesContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">❌</div>
      <div class="empty-state-title">Error</div>
      <p>${message}</p>
    </div>
  `;
}

// Global functions for onclick handlers
window.editStory = editStory;
window.toggleStatus = toggleStatus;
window.deleteStory = deleteStory;
window.closeStoryModal = closeStoryModal;
window.closeDeleteModal = closeDeleteModal;
window.clearDebugLogs = clearDebugLogs;

// Initialize debug info
debugLog('Firebase Admin Panel initialized', 'success', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  timestamp: new Date().toISOString()
});

debugLog('Waiting for authentication...', 'info');
