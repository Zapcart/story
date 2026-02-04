// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Config
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
const db = getDatabase(app);

/* =========================
   SITE SETTINGS (TITLE, LOGO)
========================= */

const siteRef = ref(db, "site");

onValue(siteRef, (snapshot) => {
  if (snapshot.exists()) {
    const site = snapshot.val();
    console.log("Live Site Data:", site);

    // Update site title
    if (site.title) {
      document.title = site.title;
      const brandTitle = document.querySelector(".nav-brand h1 a");
      if (brandTitle) brandTitle.textContent = site.title;
    }

    // Update logo if you add img later
    const logoImg = document.getElementById("siteLogo");
    if (logoImg && site.logo) {
      logoImg.src = site.logo;
    }
  }
});

/* =========================
   CATEGORIES (FUTURE READY)
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
   STORIES (FUTURE READY)
========================= */

const storiesRef = ref(db, "stories");

onValue(storiesRef, (snapshot) => {
  const storyGrid = document.getElementById("storyGrid");
  if (!storyGrid) return;

  storyGrid.innerHTML = "";

  if (snapshot.exists()) {
    const stories = snapshot.val();
    Object.keys(stories).forEach((key) => {
      const story = stories[key];
      const div = document.createElement("div");
      div.className = "story-card";
      div.innerHTML = `
        <h3>${story.title || "Story Title"}</h3>
        <p>${story.excerpt || ""}</p>
        <a href="story.html?id=${key}">Read More</a>
      `;
      storyGrid.appendChild(div);
    });
  }
});
