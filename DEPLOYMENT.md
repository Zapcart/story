# Firebase Deployment Guide

## Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase project: `firebase init` (if not already done)

## Setup Firestore
1. Go to Firebase Console → Firestore Database
2. Create a new database in test mode
3. Deploy security rules: `firebase deploy --only firestore:rules`
4. Deploy indexes: `firebase deploy --only firestore:indexes`

## Deploy Website
1. Build/deploy to Firebase Hosting: `firebase deploy --only hosting`

## Admin Panel Usage
1. Access admin panel at: `https://your-domain.com/admin/`
2. Login with Firebase Authentication credentials
3. Add stories using the form
4. Stories will appear on the main site within seconds

## Important Notes
- Stories must have `status: "published"` to appear on frontend
- Featured stories are shown in the hero section
- Stories are sorted by `publish_date` (newest first)
- Real-time updates work automatically when deployed
