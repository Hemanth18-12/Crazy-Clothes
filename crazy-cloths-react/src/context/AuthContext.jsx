import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { CONFIG } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if current user is an admin
  const isAdmin = currentUser ? CONFIG.adminEmails.includes(currentUser.email) : false;

  // Track auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Standard email/password customer login
  const loginCustomer = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Admin login - checks email whitelist before Firebase login
  const loginAdmin = async (email, password) => {
    if (!CONFIG.adminEmails.includes(email)) {
      throw new Error('Access denied. You are not authorized as an administrator.');
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google Sign-in
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Customer registration
  const registerCustomer = async (name, email, password, phone) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Save user profile metadata to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phone,
      createdAt: new Date().toISOString()
    });

    return userCredential;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    loginCustomer,
    loginAdmin,
    loginWithGoogle,
    registerCustomer,
    logout
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg, #080808)' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-border, #1a1a1a)',
          borderTop: '3px solid var(--color-accent, #ff4e50)',
          borderRadius: '50%',
          animation: 'button-spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
