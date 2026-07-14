import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
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

    // 1. Write to user's wishlist subcollection
    const wishDocRef = doc(db, 'users', currentUser.uid, 'wishlist', productId);
    try {
      await setDoc(wishDocRef, { addedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      throw err;
    }

    // 2. Increment wishlistCount on the product document
    try {
      await updateDoc(doc(db, 'products', productId), {
        wishlistCount: increment(1)
      });
    } catch (err) {
      // Non-fatal — product might not exist or field may not be set
      console.warn('Could not update wishlistCount on product:', err);
    }

    // 3. Write to productWishlists/{productId}/users/{uid} for stock alerts
    try {
      // Fetch user profile to get phone number
      let userName = currentUser.displayName || '';
      let userPhone = '';
      const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userName = userData.name || userName;
        userPhone = userData.phone || '';
      }

      await setDoc(
        doc(db, 'productWishlists', productId, 'users', currentUser.uid),
        {
          uid: currentUser.uid,
          name: userName,
          email: currentUser.email || '',
          phone: userPhone,
          addedAt: serverTimestamp()
        }
      );
    } catch (err) {
      console.warn('Could not write to productWishlists:', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!currentUser) return;

    // 1. Remove from user's wishlist subcollection
    const wishDocRef = doc(db, 'users', currentUser.uid, 'wishlist', productId);
    try {
      await deleteDoc(wishDocRef);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      throw err;
    }

    // 2. Decrement wishlistCount on the product document
    try {
      await updateDoc(doc(db, 'products', productId), {
        wishlistCount: increment(-1)
      });
    } catch (err) {
      console.warn('Could not decrement wishlistCount on product:', err);
    }

    // 3. Remove from productWishlists subcollection
    try {
      await deleteDoc(doc(db, 'productWishlists', productId, 'users', currentUser.uid));
    } catch (err) {
      console.warn('Could not remove from productWishlists:', err);
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
