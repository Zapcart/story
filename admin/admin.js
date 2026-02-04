import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
document.getElementById("addStoryBtn").onclick = () => {
  const newRef = push(ref(db, "stories"));
  set(newRef, {
    title: storyTitle.value,
    slug: storySlug.value,
    category: storyCategory.value,
    excerpt: storyExcerpt.value,
    body: storyBody.value,
    featured: storyFeatured.value === "true",
    createdAt: Date.now()
  });
  alert("Story added!");
};

// Load Stories
function loadStories() {
  const storyList = document.getElementById("storyList");
  onValue(ref(db, "stories"), (snap) => {
    storyList.innerHTML = "";
    if (!snap.exists()) return;

    const data = snap.val();
    Object.keys(data).forEach(id => {
      const s = data[id];
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <strong>${s.title}</strong><br>
        Category: ${s.category}<br>
        Featured: ${s.featured}<br>
        <small>ID: ${id}</small>
      `;
      storyList.appendChild(div);
    });
  });
}
