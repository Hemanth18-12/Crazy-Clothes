import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

export function useWishlist() {
  const { currentUser } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setWishlistIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist');

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        const ids = [];
        snapshot.forEach((doc) => {
          ids.push(doc.id);
        });
        setWishlistIds(ids);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to wishlist:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const isWishlisted = (productId) => {
    return wishlistIds.includes(productId);
  };

  const addToWishlist = async (productId) => {
    if (!currentUser) {
      sessionStorage.setItem('cc_redirect_after_login', window.location.pathname + window.location.search);
      navigate('/login');
      return;
    }
    const wishDocRef = doc(db, 'users', currentUser.uid, 'wishlist', productId);
    try {
      await setDoc(wishDocRef, { addedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      throw err;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!currentUser) return;
    const wishDocRef = doc(db, 'users', currentUser.uid, 'wishlist', productId);
    try {
      await deleteDoc(wishDocRef);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      throw err;
    }
  };

  const toggleWishlist = async (productId) => {
    if (!currentUser) {
      sessionStorage.setItem('cc_redirect_after_login', window.location.pathname + window.location.search);
      navigate('/login');
      return;
    }
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return {
    wishlistIds,
    loading,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist
  };
}
