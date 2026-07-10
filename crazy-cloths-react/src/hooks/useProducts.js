import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATIC_CUSTOMIZABLES = [
  { id: '__static_white', color: 'white', name: 'White Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: '/assets/images/white-t-shirt.png' },
  { id: '__static_black', color: 'black', name: 'Black Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: '/assets/images/black-t-shirt.png' }
];

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [customizableProducts, setCustomizableProducts] = useState(STATIC_CUSTOMIZABLES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('stockStatus', '==', 'inStock')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allProducts = [];
        snapshot.forEach((doc) => {
          allProducts.push({ id: doc.id, ...doc.data() });
        });

        // Split catalog products and apply client-side sorting
        // Sort client-side: sortOrder ascending, fallback to createdAt descending
        const catalog = allProducts
          .filter((p) => p.category === 'catalog')
          .sort((a, b) => {
            const sA = typeof a.sortOrder === 'number' ? a.sortOrder : 999999;
            const sB = typeof b.sortOrder === 'number' ? b.sortOrder : 999999;
            if (sA !== sB) return sA - sB;
            
            const dA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const dB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
            return dB - dA;
          });

        // Split customizable products
        const customizable = allProducts.filter((p) => p.category === 'customizable');

        setProducts(allProducts);
        setCatalogProducts(catalog);
        setCustomizableProducts(customizable.length > 0 ? customizable : STATIC_CUSTOMIZABLES);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching products in useProducts:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { products, catalogProducts, customizableProducts, loading, error };
}
