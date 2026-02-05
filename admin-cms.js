// Firebase SDK v9 imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit, onSnapshot, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const toastContainer = document.getElementById('toastContainer');
const bulkActions = document.getElementById('bulkActions');

// State
let currentUser = null;
let stories = [];
let currentEditId = null;
let deleteStoryId = null;
let unsubscribeRealtime = null;
let currentPage = 1;
let itemsPerPage = 10;
let selectedStories = new Set();
let sortBy = 'updatedAt';
let sortOrder = 'desc';

// Theme Management
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.querySelector('.theme-toggle').textContent = isDark ? '☀️' : '🌙';
}

// Load theme preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  document.querySelector('.theme-toggle').textContent = '☀️';
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
    
    showToast('Login Successful', `Welcome back, ${user.email}`, 'success');
    initializeDashboard();
  } else {
    currentUser = null;
    loginScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
    
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
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = '';
  } catch (error) {
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
    showToast('Logout Failed', error.message, 'error');
  }
});

// Initialize Dashboard
async function initializeDashboard() {
  await loadStories();
  setupRealtimeUpdates();
  setupEventListeners();
  updateDashboardStats();
  updatePagination();
}

// Setup Event Listeners
function setupEventListeners() {
  // Search and Filters
  document.getElementById('searchInput').addEventListener('input', filterStories);
  document.getElementById('statusFilter').addEventListener('change', filterStories);
  document.getElementById('categoryFilter').addEventListener('change', filterStories);
  document.getElementById('sortBy').addEventListener('change', (e) => {
    sortBy = e.target.value;
    loadStories();
  });
  
  // Story Form Submit
  storyForm.addEventListener('submit', handleStorySubmit);
  
  // Delete Confirmation
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  
  // Auto-generate slug from title
  document.getElementById('title').addEventListener('input', (e) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    document.getElementById('slug').value = slug;
  });
}

// Load Stories from Firestore
async function loadStories() {
  try {
    showLoadingState();
    
    const storiesQuery = query(
      collection(firestore, 'stories'),
      orderBy(sortBy, sortOrder)
    );
    
    const querySnapshot = await getDocs(storiesQuery);
    stories = [];
    
    querySnapshot.forEach((doc) => {
      stories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('📚 Stories loaded:', stories.length);
    renderStories();
    updateDashboardStats();
    
  } catch (error) {
    console.error('Error loading stories:', error);
    showErrorState('Error loading stories. Please refresh the page.');
    showToast('Load Failed', 'Unable to load stories from Firestore', 'error');
  }
}

// Setup Real-time Updates
function setupRealtimeUpdates() {
  try {
    const storiesQuery = query(
      collection(firestore, 'stories'),
      orderBy(sortBy, sortOrder)
    );
    
    unsubscribeRealtime = onSnapshot(storiesQuery, (snapshot) => {
      const changes = snapshot.docChanges();
      if (changes.length > 0) {
        changes.forEach((change) => {
          const story = change.doc.data();
          const storyId = change.doc.id;
          
          switch (change.type) {
            case 'added':
              console.log('➕ Story added:', story.title);
              showToast('New Story Created', `"${story.title}" has been added`, 'success');
              break;
            case 'modified':
              console.log('✏️ Story modified:', story.title);
              showToast('Story Updated', `"${story.title}" has been updated`, 'info');
              break;
            case 'removed':
              console.log('🗑️ Story removed:', story.title);
              showToast('Story Deleted', `"${story.title}" has been removed`, 'warning');
              break;
          }
        });
        
        loadStories();
      }
    });
    
  } catch (error) {
    console.error('Error setting up real-time updates:', error);
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
  
  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStories = storiesToRender.slice(startIndex, endIndex);
  
  const tableHTML = `
    <table class="stories-table">
      <thead>
        <tr>
          <th><input type="checkbox" id="selectAll" onchange="toggleSelectAll()"></th>
          <th>Story</th>
          <th>Status</th>
          <th>Category</th>
          <th>Views</th>
          <th>Featured</th>
          <th>Publish Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${paginatedStories.map(story => `
          <tr>
            <td>
              <input type="checkbox" class="story-checkbox" value="${story.id}" onchange="toggleStorySelection('${story.id}')">
            </td>
            <td>
              <div class="story-title">${story.title || 'Untitled'}</div>
              <div class="story-meta">
                <span class="story-id">${story.id.substring(0, 8)}...</span>
                <span>By: ${story.author || currentUser?.email}</span>
              </div>
            </td>
            <td>
              <span class="status-badge status-${story.status || 'draft'}" onclick="toggleStatus('${story.id}')">
                ${story.status || 'draft'}
              </span>
            </td>
            <td>${story.category || 'N/A'}</td>
            <td>${story.views || 0}</td>
            <td>
              ${story.featured ? '<span class="featured-badge">⭐ Featured</span>' : '-'}
            </td>
            <td>${formatDate(story.publish_date)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-sm btn-primary" onclick="editStory('${story.id}')">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="previewStory('${story.id}')">Preview</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStory('${story.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  storiesContainer.innerHTML = tableHTML;
  updatePagination(filteredStories || stories);
}

// Filter Stories
function filterStories() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  const filtered = stories.filter(story => {
    const matchesSearch = !searchTerm || 
      story.title?.toLowerCase().includes(searchTerm) ||
      story.slug?.toLowerCase().includes(searchTerm) ||
      story.category?.toLowerCase().includes(searchTerm);
    
    const matchesStatus = !statusFilter || story.status === statusFilter;
    const matchesCategory = !categoryFilter || story.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  currentPage = 1;
  renderStories(filtered);
}

// Update Dashboard Stats
function updateDashboardStats() {
  const total = stories.length;
  const published = stories.filter(s => s.status === 'published').length;
  const drafts = stories.filter(s => s.status === 'draft').length;
  const totalViews = stories.reduce((sum, story) => sum + (story.views || 0), 0);
  
  document.getElementById('totalStories').textContent = total;
  document.getElementById('publishedStories').textContent = published;
  document.getElementById('draftStories').textContent = drafts;
  document.getElementById('totalViews').textContent = totalViews.toLocaleString();
  
  // Calculate weekly changes (mock data for now)
  document.getElementById('totalChange').textContent = '+12% this week';
  document.getElementById('publishedChange').textContent = '+8% this week';
  document.getElementById('draftChange').textContent = '-2% this week';
  document.getElementById('viewsChange').textContent = '+25% this week';
}

// Update Pagination
function updatePagination(storiesList = stories) {
  const totalPages = Math.ceil(storiesList.length / itemsPerPage);
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      Previous
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += '<span>...</span>';
    }
  }
  
  // Next button
  paginationHTML += `
    <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next
    </button>
  `;
  
  pagination.innerHTML = paginationHTML;
}

// Change Page
function changePage(page) {
  const totalPages = Math.ceil(stories.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderStories();
}

// Toggle Story Selection
function toggleStorySelection(storyId) {
  if (selectedStories.has(storyId)) {
    selectedStories.delete(storyId);
  } else {
    selectedStories.add(storyId);
  }
  
  updateBulkActions();
}

// Toggle Select All
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.story-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
    const storyId = checkbox.value;
    if (selectAll.checked) {
      selectedStories.add(storyId);
    } else {
      selectedStories.delete(storyId);
    }
  });
  
  updateBulkActions();
}

// Update Bulk Actions
function updateBulkActions() {
  const count = selectedStories.size;
  document.getElementById('selectedCount').textContent = `${count} selected`;
  
  if (count > 0) {
    bulkActions.classList.add('active');
  } else {
    bulkActions.classList.remove('active');
  }
}

// Bulk Actions
async function bulkPublish() {
  for (const storyId of selectedStories) {
    await updateDoc(doc(firestore, 'stories', storyId), {
      status: 'published',
      publish_date: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  showToast('Bulk Publish', `${selectedStories.size} stories published`, 'success');
  selectedStories.clear();
  updateBulkActions();
}

async function bulkUnpublish() {
  for (const storyId of selectedStories) {
    await updateDoc(doc(firestore, 'stories', storyId), {
      status: 'draft',
      updatedAt: serverTimestamp()
    });
  }
  
  showToast('Bulk Unpublish', `${selectedStories.size} stories unpublished`, 'success');
  selectedStories.clear();
  updateBulkActions();
}

async function bulkDelete() {
  if (!confirm(`Are you sure you want to delete ${selectedStories.size} stories?`)) return;
  
  for (const storyId of selectedStories) {
    await deleteDoc(doc(firestore, 'stories', storyId));
  }
  
  showToast('Bulk Delete', `${selectedStories.size} stories deleted`, 'success');
  selectedStories.clear();
  updateBulkActions();
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
    form.seo_title.value = story.seo_title || '';
    form.seo_description.value = story.seo_description || '';
    form.cover_image.value = story.cover_image || '';
    form.og_image.value = story.og_image || '';
    form.featured.checked = story.featured || false;
    form.status.value = story.status || 'draft';
    
    if (story.publish_date) {
      const date = story.publish_date.toDate ? story.publish_date.toDate() : new Date(story.publish_date);
      form.publish_date.value = date.toISOString().slice(0, 16);
    }
  } else {
    modalTitle.textContent = 'Add New Story';
    form.reset();
    // Set default publish date to now
    form.publish_date.value = new Date().toISOString().slice(0, 16);
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
    seo_title: form.seo_title.value.trim(),
    seo_description: form.seo_description.value.trim(),
    cover_image: form.cover_image.value.trim(),
    og_image: form.og_image.value.trim(),
    featured: form.featured.checked,
    status: form.status.value,
    author: currentUser?.email,
    views: 0,
    updatedAt: serverTimestamp()
  };
  
  // Handle publish date
  if (form.publish_date.value) {
    storyData.publish_date = new Date(form.publish_date.value);
  } else if (form.status.value === 'published') {
    storyData.publish_date = serverTimestamp();
  }
  
  try {
    if (currentEditId) {
      // Update existing story
      await updateDoc(doc(firestore, 'stories', currentEditId), storyData);
      showToast('Story Updated', `"${storyData.title}" has been updated successfully`, 'success');
    } else {
      // Add new story
      const docRef = await addDoc(collection(firestore, 'stories'), {
        ...storyData,
        createdAt: serverTimestamp()
      });
      showToast('Story Created', `"${storyData.title}" has been created successfully`, 'success');
    }
    
    closeStoryModal();
    
  } catch (error) {
    showToast('Save Failed', `Unable to save story: ${error.message}`, 'error');
  }
}

// Edit Story
function editStory(storyId) {
  openStoryModal(storyId);
}

// Preview Story
function previewStory(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  // Open story in new tab
  window.open(`story.html?id=${storyId}`, '_blank');
}

// Toggle Story Status
async function toggleStatus(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  const newStatus = story.status === 'published' ? 'draft' : 'published';
  
  try {
    await updateDoc(doc(firestore, 'stories', storyId), {
      status: newStatus,
      publish_date: newStatus === 'published' ? serverTimestamp() : story.publish_date,
      updatedAt: serverTimestamp()
    });
    
    showToast('Status Updated', `Story status changed to ${newStatus}`, 'success');
    
  } catch (error) {
    showToast('Update Failed', `Unable to update status: ${error.message}`, 'error');
  }
}

// Delete Story
function deleteStory(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  
  deleteStoryId = storyId;
  document.getElementById('deleteStoryTitle').textContent = story.title;
  deleteModal.classList.add('active');
}

// Confirm Delete
async function confirmDelete() {
  if (!deleteStoryId) return;
  
  try {
    await deleteDoc(doc(firestore, 'stories', deleteStoryId));
    showToast('Story Deleted', 'Story has been deleted successfully', 'success');
    closeDeleteModal();
    
  } catch (error) {
    showToast('Delete Failed', `Unable to delete story: ${error.message}`, 'error');
  }
}

// Export Data
function exportData() {
  const dataStr = JSON.stringify(stories, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `stories-export-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast('Export Complete', 'Stories data exported successfully', 'success');
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
window.previewStory = previewStory;
window.deleteStory = deleteStory;
window.closeStoryModal = closeStoryModal;
window.closeDeleteModal = closeDeleteModal;
window.toggleStatus = toggleStatus;
window.toggleTheme = toggleTheme;
window.changePage = changePage;
window.toggleStorySelection = toggleStorySelection;
window.toggleSelectAll = toggleSelectAll;
window.bulkPublish = bulkPublish;
window.bulkUnpublish = bulkUnpublish;
window.bulkDelete = bulkDelete;
window.exportData = exportData;

console.log('🚀 DesiStory CMS initialized');
