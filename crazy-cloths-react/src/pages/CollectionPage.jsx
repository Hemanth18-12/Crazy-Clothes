import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import CartDrawer from "../components/CartDrawer";

export default function CollectionPage() {
  const { catalogProducts, loading: productsLoading } = useProducts();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { currentUser } = useAuth();

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <>
      <CartDrawer />
      <section id="collection" className="page-section" style={{ minHeight: "80vh", paddingTop: "8rem" }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', display: 'inline-block', left: '50%', transform: 'translateX(-50%)' }}>
            <h2 style={{ fontSize: '4.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>THE COLLECTION</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Pre-designed styles, ready to order
            </p>
            <div style={{ width: '80px', height: '2px', backgroundColor: 'var(--color-accent)', margin: '1rem auto 0' }}></div>
          </div>

          {!currentUser ? (
            /* Auth Gate Card */
            <div id="collection-auth-gate" style={{ display: 'block', textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.08) 0%, rgba(255, 59, 48, 0.03) 100%)',
                border: '1px solid rgba(255, 59, 48, 0.25)',
                borderRadius: '16px',
                padding: '2.5rem 3rem',
                maxWidth: '480px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Members Only</h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
                  Login to view our full collection and place orders.
                </p>
                <Link to="/login" className="btn btn-accent shimmer-btn" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700, display: 'inline-block' }}>
                  Login to View Collection
                </Link>
              </div>
            </div>
          ) : productsLoading ? (
            <LoadingSpinner />
          ) : catalogProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>No products in the collection yet.</p>
            </div>
          ) : (
            <div className="grid-4" id="product-grid" style={{ margin: '0 auto' }}>
              {catalogProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={isWishlisted(product.id)}
                  onWishlistToggle={toggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
