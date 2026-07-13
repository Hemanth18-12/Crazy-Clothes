import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBVU97S9ekSr579KdqmqLe5Gbf_MHCkNi8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crazy-cloths.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crazy-cloths',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crazy-cloths.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '140556387701',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:140556387701:web:9153735cc8ff01a875ff3c',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;

