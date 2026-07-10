import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

export function useOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('customerEmail', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList = [];
        snapshot.forEach((doc) => {
          orderList.push({ id: doc.id, ...doc.data() });
        });

        // Client-side sort: createdAt desc
        orderList.sort((a, b) => {
          const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dB - dA;
        });

        setOrders(orderList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to orders:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  return { orders, loading, error };
}
