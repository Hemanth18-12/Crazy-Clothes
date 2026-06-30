// Crazy Cloths — Firebase Configuration
// Using Firebase Compat SDK (works without build tools)

// Initialize Firebase app
const firebaseConfig = {
  apiKey: "AIzaSyBVU97S9ekSr579KdqmqLe5Gbf_MHCkNi8",
  authDomain: "crazy-cloths.firebaseapp.com",
  projectId: "crazy-cloths",
  storageBucket: "crazy-cloths.firebasestorage.app",
  messagingSenderId: "140556387701",
  appId: "1:140556387701:web:9153735cc8ff01a875ff3c",
  measurementId: "G-VX7WF33L4C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make db available globally
window.db = firebase.firestore();
window.auth = firebase.auth();