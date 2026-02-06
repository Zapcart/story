# 🔥 DesiStory Firestore Schema

## Production-Grade CMS Structure

### Collections Overview

```
desistory (Firestore Database)
├── stories/
├── categories/
├── site/
└── homepage/
```

---

## 📚 Stories Collection

**Collection Path**: `stories`

**Document Structure**:
```javascript
{
  title: "जंगल की कहानी",           // String (Required)
  slug: "jungle-ki-kahani",        // String (Required, Unique)
  category: "folk-tales",            // String (Required, References categories.slug)
  featured: false,                    // Boolean (Default: false)
  excerpt: "एक पुरानी जंगल...",    // String (Required, Max: 300 chars)
  cover_image: "https://...",          // String (Optional, URL)
  publish_date: "2024-01-15T10:00:00Z", // Timestamp (Required)
  status: "published",               // String (Required, Enum: "draft"|"published")
  tags: ["जंगल", "बच्चे"],        // Array (Optional)
  body: "# जंगल की कहानी\n\n...", // String (Required, Markdown)
  views: 1500,                       // Number (Optional, Default: 0)
  created_at: "2024-01-15T10:00:00Z", // Timestamp (Auto-generated)
  updated_at: "2024-01-15T10:00:00Z"  // Timestamp (Auto-generated)
}
```

**Indexes Required**:
- `status` (Ascending)
- `publish_date` (Descending)
- `category` (Ascending)
- `featured` (Ascending)

---

## 🏷️ Categories Collection

**Collection Path**: `categories`

**Document Structure**:
```javascript
{
  name: "Folk Tales",               // String (Required)
  slug: "folk-tales",              // String (Required, Unique)
  description: "Traditional stories...",  // String (Optional)
  category_image: "https://...",       // String (Optional, URL)
  icon: "📖",                     // String (Optional, Emoji)
  created_at: "2024-01-15T10:00:00Z", // Timestamp (Auto-generated)
  updated_at: "2024-01-15T10:00:00Z"  // Timestamp (Auto-generated)
}
```

**Indexes Required**:
- `slug` (Ascending, Unique)

---

## ⚙️ Site Settings Collection

**Collection Path**: `site`

**Document ID**: `settings` (Single Document)

**Document Structure**:
```javascript
{
  site_name: "DesiStory",                    // String (Required)
  tagline: "दिल से लिखी कहानियाँ",           // String (Required)
  logo: "https://...",                        // String (Optional, URL)
  footer_text: "दिल से लिखी कहानियाँ...",      // String (Required)
  meta_description: "Read amazing Hindi...",    // String (Required, Max: 160 chars)
  social_links: [                             // Array (Optional)
    {
      platform: "Facebook",                   // String (Required, Enum: "Facebook"|"Twitter"|"Instagram"|"YouTube")
      url: "https://facebook.com/desistory"  // String (Required, URL)
    }
  ],
  google_analytics_id: "G-XXXXXXXXXX",        // String (Optional)
  adsense_publisher_id: "ca-pub-XXXXXXXXXX", // String (Optional)
  updated_at: "2024-01-15T10:00:00Z"      // Timestamp (Auto-generated)
}
```

---

## 🏠 Homepage Settings Collection

**Collection Path**: `homepage`

**Document ID**: `settings` (Single Document)

**Document Structure**:
```javascript
{
  hero_title: "Discover Amazing Hindi Stories",     // String (Required)
  hero_subtitle: "Explore our collection...",      // String (Required)
  hero_image: "https://...",                    // String (Optional, URL)
  featured_section_title: "Featured Story",        // String (Required)
  latest_section_title: "Latest Stories",         // String (Required)
  latest_story_count: 6,                        // Number (Required, Min: 1, Max: 20)
  search_placeholder: "Search stories...",          // String (Required)
  updated_at: "2024-01-15T10:00:00Z"         // Timestamp (Auto-generated)
}
```

---

## 🔒 Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Stories Collection
    match /stories/{storyId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
      allow delete: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
    }
    
    // Categories Collection
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
      allow delete: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
    }
    
    // Site Settings Collection
    match /site/{docId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
    }
    
    // Homepage Settings Collection
    match /homepage/{docId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email == "admin@desistory.in";
    }
  }
}
```

---

## 📊 Data Relationships

### Story → Category Relationship
- `story.category` references `categories.slug`
- One-to-Many: One Category → Many Stories
- Cascade Delete: Stories remain if category deleted (soft reference)

### Data Integrity
- **Required Fields**: All marked fields must be present
- **Data Types**: Strict type enforcement
- **Unique Constraints**: `slug` fields must be unique
- **Default Values**: Applied at document creation

---

## 🔄 Real-time Updates

### Listeners Setup
```javascript
// Stories Real-time Listener
db.collection('stories').onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    console.log('Story change:', change.type, change.doc.id);
    // Handle: added, modified, removed
  });
});

// Categories Real-time Listener
db.collection('categories').onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    console.log('Category change:', change.type, change.doc.id);
    // Handle: added, modified, removed
  });
});
```

---

## 📱 Frontend Integration

### Firebase Initialization
```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "desistory.firebaseapp.com",
  projectId: "desistory",
  storageBucket: "desistory.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
```

### Data Loading Pattern
```javascript
// Load stories with filtering
const storiesQuery = db.collection('stories')
  .where('status', '==', 'published')
  .orderBy('publish_date', 'desc')
  .limit(10);

const snapshot = await storiesQuery.get();
const stories = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

---

## 🚀 Production Deployment

### Index Setup
```javascript
// Create composite indexes for performance
firebase firestore:indexes create --project=desistory --collection=stories --fields=status,publish_date --order-by=desc,publish_date
firebase firestore:indexes create --project=desistory --collection=stories --fields=category,status --order-by=category,status
firebase firestore:indexes create --project=desistory --collection=categories --fields=slug --order-by=slug
```

### Data Migration
```javascript
// Migration script for existing data
async function migrateToFirestore() {
  const stories = await loadLegacyStories();
  
  for (const story of stories) {
    await db.collection('stories').add({
      ...story,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}
```

---

## 📈 Performance Optimization

### Batch Operations
```javascript
// Batch write for better performance
const batch = db.batch();

stories.forEach(story => {
  const docRef = db.collection('stories').doc();
  batch.set(docRef, story);
});

await batch.commit();
```

### Caching Strategy
- **Frontend**: Local cache with TTL (5 minutes)
- **Admin**: Real-time listeners for instant updates
- **Offline Support**: Firestore offline persistence

---

## 🔍 Debugging & Monitoring

### Console Logging
```javascript
// Enable debug mode
const DEBUG = true;

if (DEBUG) {
  console.log('🔥 Firestore Debug Mode Enabled');
  console.log('📊 Collections:', ['stories', 'categories', 'site', 'homepage']);
}
```

### Error Handling
```javascript
try {
  await db.collection('stories').add(newStory);
  console.log('✅ Story created successfully');
} catch (error) {
  console.error('❌ Error creating story:', error);
  
  // Handle specific error types
  switch (error.code) {
    case 'permission-denied':
      showToast('Permission Denied', 'You do not have write access', 'error');
      break;
    case 'unavailable':
      showToast('Service Unavailable', 'Please try again later', 'warning');
      break;
    default:
      showToast('Error', 'Failed to create story', 'error');
  }
}
```

---

## 🎯 Production Checklist

### ✅ Pre-deployment
- [ ] Firebase project created and configured
- [ ] Firestore security rules deployed
- [ ] All indexes created
- [ ] Admin user created with proper email
- [ ] Test data populated
- [ ] Real-time listeners tested
- [ ] Error handling verified
- [ ] Performance optimization applied

### ✅ Post-deployment
- [ ] Real-time updates working
- [ ] Admin authentication functional
- [ ] All CRUD operations tested
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility checked
- [ ] Cache busting implemented
- [ ] Monitoring and logging active

---

**🔥 This schema ensures production-grade performance, security, and scalability for DesiStory CMS!**
