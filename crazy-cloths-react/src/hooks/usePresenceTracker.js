import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

// Maps route paths to human-readable page labels shown in admin Live Now panel
function getPageLabel(pathname) {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/product/')) return 'Product';
  if (pathname === '/collection') return 'Collection';
  if (pathname === '/customize') return 'Customize';
  if (pathname === '/wishlist') return 'Wishlist';
  if (pathname === '/orders') return 'My Orders';
  if (pathname === '/profile') return 'Profile';
  if (pathname === '/cart') return 'Cart';
  if (pathname === '/success') return 'Order Success';
  return 'Browsing';
}

export function usePresenceTracker() {
  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only track non-admin, authenticated users
    if (!currentUser) return;
    const isAdmin = currentUser.email?.includes('admin') ||
      currentUser.email === 'hemanth.t18122005@gmail.com';
    if (isAdmin) return;
    // Don't track admin pages
    if (location.pathname.startsWith('/admin')) return;

    const uid = currentUser.uid;
    const presenceRef = doc(db, 'presence', uid);
    const pageLabel = getPageLabel(location.pathname);

    const writePresence = async () => {
      try {
        await setDoc(presenceRef, {
          uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer',
          email: currentUser.email || '',
          page: pageLabel,
          path: location.pathname,
          lastActive: serverTimestamp(),
          online: true
        });
      } catch (err) {
        // Silently ignore permission errors (e.g. when Firestore rules are not yet deployed)
        console.warn('Presence write failed:', err);
      }
    };

    // Write immediately
    writePresence();

    // Heartbeat every 30 seconds
    const interval = setInterval(writePresence, 30000);

    // Cleanup: mark offline and remove on unmount or tab close
    const removePresence = async () => {
      try {
        await deleteDoc(presenceRef);
      } catch (_) {
        // ignore
      }
    };

    const handleBeforeUnload = () => {
      // Synchronous — best-effort
      navigator.sendBeacon && navigator.sendBeacon('/favicon.ico');
      removePresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence();
    };
  }, [currentUser, location.pathname]);
}
