import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useWishlist } from '../hooks/useWishlist';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { wishlistIds, loading: wishlistLoading, toggleWishlist, isWishlisted } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    document.title = 'Crazy Cloths — My Wishlist';
  }, []);

  useEffect(() => {
    if (wishlistLoading) {
      return;
    }

    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    const fetchWishlistProducts = async () => {
      setLoadingProducts(true);
      setError(null);
      try {
        const productPromises = wishlistIds.map(async (id) => {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
          }
          return null;
        });

        const fetchedProducts = await Promise.all(productPromises);
        // Filter out any stale/deleted products
        setProducts(fetchedProducts.filter((p) => p !== null));
      } catch (err) {
        console.error('Failed to fetch wishlist products:', err);
        setError(err.message || 'Could not load wishlist products.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds, wishlistLoading]);

  const handleRemove = async (productId, e) => {
    e.stopPropagation();
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });

    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error('Error removing product from wishlist:', err);
      alert('Failed to remove from wishlist. Please try again.');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const showLoader = wishlistLoading || loadingProducts;

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '80vh' }}>
      <section className="page-section">
        <div className="container">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3rem',
              textTransform: 'uppercase',
              marginBottom: '2rem',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '1rem'
            }}
          >
            My Wishlist
          </h1>

          {/* Error State */}
          {error && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  marginBottom: '1rem',
                  color: 'var(--color-accent)'
                }}
              >
                Could Not Load Wishlist
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '2rem'
                }}
              >
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-outline"
                style={{ padding: '0.7rem 1.8rem' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loader State */}
          {!error && showLoader && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div
                className="skeleton-card"
                style={{
                  height: '350px',
                  width: '220px',
                  background: 'var(--color-surface)',
                  opacity: 0.5,
                  borderRadius: '8px'
                }}
              ></div>
              <div
                className="skeleton-card"
                style={{
                  height: '350px',
                  width: '220px',
                  background: 'var(--color-surface)',
                  opacity: 0.5,
                  borderRadius: '8px'
                }}
              ></div>
            </div>
          )}

          {/* Empty State */}
          {!error && !showLoader && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Your Wishlist is Empty
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '2rem'
                }}
              >
                Save your favorite catalog designs to buy them later.
              </p>
              <Link to="/collection" className="btn btn-accent" style={{ padding: '0.8rem 2rem', textDecoration: 'none', display: 'inline-block' }}>
                Browse The Collection
              </Link>
            </div>
          )}

          {/* Wishlist Grid */}
          {!error && !showLoader && products.length > 0 && (
            <div className="grid-4">
              {products.map((product) => (
                <div key={product.id} className="wishlist-card-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                  <ProductCard
                    product={product}
                    onWishlistToggle={toggleWishlist}
                    isWishlisted={isWishlisted(product.id)}
                  />
                  <button
                    className="btn btn-outline"
                    disabled={removingIds.has(product.id)}
                    onClick={(e) => handleRemove(product.id, e)}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.8rem',
                      opacity: 0.75
                    }}
                  >
                    {removingIds.has(product.id) ? 'Removing…' : '✕  Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
