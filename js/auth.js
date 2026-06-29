/**
 * Crazy Cloths — Firebase Auth Controller
 *
 * Handles: login, registration, admin guard, session storage
 * Admin emails live ONLY here — not in any HTML or config.
 */

// ── Admin email allowlist ─────────────────────────────────
const ADMIN_EMAILS = [
  "hemanth.t18122005@gmail.com",
  "admin2@crazycloths.com",
  "admin3@crazycloths.com",
  "admin4@crazycloths.com",
  "admin5@crazycloths.com"
];

// ── Helpers ──────────────────────────────────────────────

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
}

function setSession(user) {
  sessionStorage.setItem('cc_user_email', user.email || '');
  sessionStorage.setItem('cc_user_name', user.displayName || user.email.split('@')[0]);
  sessionStorage.setItem('cc_user_uid', user.uid || '');
}

function clearSession() {
  sessionStorage.removeItem('cc_user_email');
  sessionStorage.removeItem('cc_user_name');
  sessionStorage.removeItem('cc_user_uid');
}

// ── Auth state listener (runs on every page) ──────────────
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setSession(user);
    }
  });
}

// ── Public API ────────────────────────────────────────────
const AuthService = {

  /**
   * Customer login via Firebase email/password
   */
  async loginCustomer(email, password) {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase is not configured. Please fill in js/firebase-config.js');
    }
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    setSession(cred.user);
    return cred.user;
  },

  /**
   * Login or Register via Google Sign-In
   */
  async loginWithGoogle() {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase is not configured. Please fill in js/firebase-config.js');
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await firebase.auth().signInWithPopup(provider);
    
    // Save profile to Firestore users collection if they don't exist yet
    try {
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(cred.user.uid).get();
      if (!userDoc.exists) {
        await db.collection('users').doc(cred.user.uid).set({
          name: cred.user.displayName || cred.user.email.split('@')[0],
          email: cred.user.email,
          phone: cred.user.phoneNumber || 'N/A',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('Firestore profile check/save failed:', e);
    }

    setSession(cred.user);
    return cred.user;
  },

  /**
   * Admin login — checks allowlist BEFORE hitting Firebase
   */
  async loginAdmin(email, password) {
    if (!isAdminEmail(email)) {
      throw new Error('Access denied. This email is not registered as an admin.');
    }
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase is not configured. Please fill in js/firebase-config.js');
    }
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    setSession(cred.user);
    return cred.user;
  },

  /**
   * Customer registration — creates Firebase Auth user + Firestore profile
   */
  async registerCustomer(name, email, phone, password) {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase is not configured. Please fill in js/firebase-config.js');
    }
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });

    // Save profile to Firestore users collection
    try {
      await firebase.firestore().collection('users').doc(cred.user.uid).set({
        name, email, phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore profile save failed:', e);
    }

    setSession({ ...cred.user, displayName: name });
    return cred.user;
  },

  /**
   * Sign out
   */
  async logout() {
    if (typeof firebase !== 'undefined') {
      await firebase.auth().signOut();
    }
    clearSession();
    window.location.href = 'index.html'; // ✅ Fixed: removed leading /
  },

  /**
   * Require any authenticated user. Redirects to login.html if not logged in.
   * Call this on product.html order submit, success.html, etc.
   */
  requireAuth() {
    if (typeof firebase === 'undefined') return;
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
          // Save intended destination
          sessionStorage.setItem('cc_redirect_after_login', window.location.href);
          window.location.href = 'login.html'; // ✅ Fixed: removed leading /
        } else {
          resolve(user);
        }
      });
    });
  },

  /**
   * Require admin. Redirects to index.html if not admin.
   * Call at the top of every admin page.
   */
  requireAdmin() {
    if (typeof firebase === 'undefined') return;
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (!user || !isAdminEmail(user.email)) {
          window.location.href = 'index.html'; // ✅ Fixed: removed leading /
        } else {
          resolve(user);
        }
      });
    });
  },

  /**
   * Get the current user's display name from sessionStorage (no Firestore read)
   */
  getDisplayName() {
    return sessionStorage.getItem('cc_user_name') || 'Guest';
  },

  getEmail() {
    return sessionStorage.getItem('cc_user_email') || '';
  },

  isAdmin() {
    return isAdminEmail(this.getEmail());
  }
};

window.AuthService = AuthService;
window.ADMIN_EMAILS = ADMIN_EMAILS;