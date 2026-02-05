import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase Config (same as frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCGFiKZoeVJvWOlNqJS-Mf9SHzSpK_XQxo",
  authDomain: "story-34914.firebaseapp.com",
  databaseURL: "https://story-34914-default-rtdb.firebaseio.com",
  projectId: "story-34914",
  storageBucket: "story-34914.firebasestorage.app",
  messagingSenderId: "86978846669",
  appId: "1:86978846669:web:e3237eaaad3bf8c392ae84"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);

// UI Elements
const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.classList.add("hidden");
    adminBox.classList.remove("hidden");
    loadStories();
  } else {
    loginBox.classList.remove("hidden");
    adminBox.classList.add("hidden");
  }
});

// Login
document.getElementById("loginBtn").onclick = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
  } catch (e) {
    loginError.textContent = e.message;
  }
};

// Logout
document.getElementById("logoutBtn").onclick = () => signOut(auth);

// Save Site Settings
document.getElementById("saveSiteBtn").onclick = () => {
  set(ref(db, "site"), {
    title: siteTitle.value,
    tagline: siteTagline.value,
    logo: siteLogo.value
  });
  alert("Site settings saved!");
};

// Add Category
document.getElementById("addCategoryBtn").onclick = () => {
  const slug = catSlug.value;
  set(ref(db, "categories/" + slug), {
    name: catName.value,
    slug: slug,
    description: catDesc.value
  });
  alert("Category added!");
};

// Add Story
document.getElementById("addStoryBtn").onclick = async () => {
  try {
    const storyData = {
      title: storyTitle.value,
      slug: storySlug.value,
      category: storyCategory.value,
      excerpt: storyExcerpt.value,
      body: storyBody.value,
      featured: storyFeatured.value === "true",
      status: "published", // Default status to published
      publish_date: new Date(), // Current timestamp
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(firestore, "stories"), storyData);
    console.log("Story added with ID: ", docRef.id);
    alert("Story added successfully!");
    
    // Clear form
    storyTitle.value = "";
    storySlug.value = "";
    storyCategory.value = "";
    storyExcerpt.value = "";
    storyBody.value = "";
    storyFeatured.value = "false";
    
    // Reload stories list
    loadStories();
    
  } catch (error) {
    console.error("Error adding story:", error);
    alert("Error adding story: " + error.message);
  }
};

// Load Stories
async function loadStories() {
  const storyList = document.getElementById("storyList");
  if (!storyList) return;
  
  try {
    console.log("Loading stories from Firestore...");
    
    const storiesQuery = query(
      collection(firestore, "stories"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(storiesQuery);
    storyList.innerHTML = "";
    
    if (querySnapshot.empty) {
      storyList.innerHTML = "<p>No stories found.</p>";
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const story = doc.data();
      const storyId = doc.id;
      
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <strong>${story.title || "Untitled"}</strong><br>
        Category: ${story.category || "General"}<br>
        Status: ${story.status || "draft"}<br>
        Featured: ${story.featured ? "Yes" : "No"}<br>
        Published: ${story.publish_date ? new Date(story.publish_date.toDate ? story.publish_date.toDate() : story.publish_date).toLocaleDateString() : "Not set"}<br>
        <small>ID: ${storyId}</small>
        <button onclick="deleteStory('${storyId}')" style="margin-top: 10px; background: #ff4444; color: white; border: none; padding: 5px 10px; cursor: pointer;">Delete</button>
      `;
      storyList.appendChild(div);
    });
    
    console.log(`Loaded ${querySnapshot.docs.length} stories`);
    
  } catch (error) {
    console.error("Error loading stories:", error);
    storyList.innerHTML = "<p>Error loading stories. Please refresh.</p>";
  }
}

// Delete Story
window.deleteStory = async function(storyId) {
  if (!confirm("Are you sure you want to delete this story?")) return;
  
  try {
    await deleteDoc(doc(firestore, "stories", storyId));
    console.log("Story deleted successfully");
    alert("Story deleted successfully!");
    loadStories();
  } catch (error) {
    console.error("Error deleting story:", error);
    alert("Error deleting story: " + error.message);
  }
}
