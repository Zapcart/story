// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "desistory.firebaseapp.com",
    projectId: "desistory",
    storageBucket: "desistory.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.db = db;
window.auth = auth;
window.storage = storage;
