# 🔥 Firebase Setup Instructions for DesiStory

## STEP 1: Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `desistory`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database
1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll add rules)
4. Select location (choose closest to your users)
5. Click "Create"

### 3. Set Up Security Rules
1. Go to Firestore → Rules tab
2. Replace existing rules with content from `firestore-rules.txt`
3. Click "Publish"

### 4. Enable Authentication
1. Go to Build → Authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

### 5. Get Firebase Config
1. Go to Project Settings (⚙️ icon)
2. General tab → Your apps
3. Click "Web" icon (</>)
## STEP 2: Update Firebase Config

### 1. Get Your Config Values
From Firebase Project Settings → Your apps → Web app:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "desistory.firebaseapp.com",
    projectId: "desistory",
    storageBucket: "desistory.appspot.com",
    messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID"
};
```

### 2. Update firebase-config.js
Replace placeholder values in `firebase-config.js` with your actual Firebase config.

## STEP 3: Create Collections in Firestore

### 1. Site Settings Collection
1. Go to Firestore → Start collection
2. Collection ID: `site`
3. Document ID: `settings`
4. Add fields:
   ```
   site_name: "DesiStory"
   tagline: "दिल से लिखी कहानियाँ"
   footer_text: "दिल से लिखी कहानियाँ - Your destination for amazing Hindi stories"
   meta_description: "Read amazing Hindi stories, folk tales, and modern narratives"
   social_links: [
     {platform: "Facebook", url: "https://facebook.com/desistory"},
     {platform: "Twitter", url: "https://twitter.com/desistory"}
   ]
   ```

### 2. Homepage Settings Collection
1. Collection ID: `homepage`
2. Document ID: `settings`
3. Add fields:
   ```
   hero_title: "Discover Amazing Hindi Stories"
   hero_subtitle: "Explore our collection of traditional folk tales, modern narratives"
   hero_image: "https://picsum.photos/seed/hero/1200/600.jpg"
   featured_section_title: "Featured Story"
   latest_section_title: "Latest Stories"
   latest_story_count: 6
   search_placeholder: "Search stories, categories, or keywords..."
   ```

### 3. Categories Collection
Create documents for each category (folk-tales, inspirational, etc.):

Example for `folk-tales`:
```
name: "Folk Tales"
slug: "folk-tales"
description: "Traditional stories passed down through generations"
category_image: "https://picsum.photos/seed/folktales/400/400.jpg"
icon: "📖"
```

### 4. Stories Collection
Create documents for each story:

Example for `jungle-ki-kahani`:
```
title: "जंगल की कहानी"
slug: "jungle-ki-kahani"
category: "folk-tales"
featured: true
excerpt: "एक पुरानी जंगल की रोचक कहानी जो बच्चों को बहुत पसंद आएगी।"
cover_image: "https://picsum.photos/seed/jungle/800/400.jpg"
publish_date: "2024-01-15 10:00:00"
status: "published"
tags: ["जंगल", "बच्चे", "कहानी"]
body: "# जंगल की कहानी\n\nएक समय की बात है..."
```

## STEP 4: Test the Integration

### 1. Check Console Logs
Open https://desistory.in and check browser console:
- Should see "🔥 Using Firebase Firestore"
- Should see "✅ X categories loaded from Firebase"
- Should see "✅ X stories loaded from Firebase"

### 2. Debug Common Issues

#### No Stories Loading?
Check:
1. Firestore collection name is exactly `stories`
2. Documents have `status: "published"`
3. `publish_date` is proper Timestamp
4. Firebase config is correct

#### Permission Errors?
Check:
1. Firestore rules are published
2. Authentication is enabled
3. User is logged in (for write operations)

#### Data Not Showing?
Check:
1. Document IDs match what frontend expects
2. Field names are exactly as expected
3. Data types are correct (string, boolean, etc.)

## STEP 5: Create Super Admin

### 1. Create Admin User
1. Go to Authentication → Users
2. Click "Add user"
3. Email: your-admin-email@desistory.in
4. Password: strong password
5. Click "Add user"

### 2. Remove Test Users
Delete any test emails to keep only your admin account.

## STEP 6: Next Phase Features

After basic Firebase integration works, we'll implement:
✅ Story status control (Draft/Published)
✅ One-click Delete + Edit
✅ Publish/Unpublish toggle
✅ Featured toggle
✅ SEO fields (Meta title, description)
✅ Auto slug generator
✅ Error logs in UI
✅ Firebase role-based admin

## Troubleshooting

### Common Console Errors:
- `Missing or insufficient permissions` → Check Firestore rules
- `7 PERMISSION_DENIED` → User not authenticated for write operations
- `5 NOT_FOUND` → Collection or document doesn't exist
- `3 INVALID_ARGUMENT` → Wrong data type or field name

### Debug Steps:
1. Open browser DevTools → Console
2. Look for Firebase error messages
3. Check Network tab for failed requests
4. Verify Firestore data structure matches frontend expectations

---

**🔥 Your DesiStory is now ready for Firebase integration!**
