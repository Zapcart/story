// Sitemap Generator for DesiStory
// This script generates sitemap.xml dynamically from Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const firestore = getFirestore(app);

// Generate Sitemap
async function generateSitemap() {
  try {
    console.log("🗺️ Generating sitemap from Firestore...");
    
    const storiesQuery = query(
      collection(firestore, "stories"),
      where("status", "==", "published"),
      orderBy("publish_date", "desc")
    );
    
    const querySnapshot = await getDocs(storiesQuery);
    const baseUrl = "https://story-34914.firebaseapp.com"; // Replace with your domain
    
    let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Published Stories -->`;
    
    querySnapshot.forEach((doc) => {
      const story = doc.data();
      const storyId = doc.id;
      const lastmod = story.updatedAt ? 
        (story.updatedAt.toDate ? story.updatedAt.toDate() : new Date(story.updatedAt)).toISOString() : 
        new Date().toISOString();
      
      sitemapXML += `
  <url>
    <loc>${baseUrl}/story-enhanced.html?id=${storyId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
    
    sitemapXML += `
</urlset>`;
    
    console.log("✅ Sitemap generated successfully");
    console.log(`📊 Total URLs: ${querySnapshot.docs.length + 1} (including homepage)`);
    
    return sitemapXML;
    
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    return null;
  }
}

// Ping Google
async function pingGoogle() {
  try {
    const sitemapUrl = "https://story-34914.firebaseapp.com/sitemap.xml"; // Replace with your domain
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    console.log("📡 Pinging Google with sitemap...");
    
    const response = await fetch(pingUrl);
    if (response.ok) {
      console.log("✅ Google ping successful");
    } else {
      console.log("⚠️ Google ping response:", response.status);
    }
  } catch (error) {
    console.error("❌ Error pinging Google:", error);
  }
}

// Export functions for use in other scripts
window.generateSitemap = generateSitemap;
window.pingGoogle = pingGoogle;

console.log("🗺️ Sitemap generator loaded");
