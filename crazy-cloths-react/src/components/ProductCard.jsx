import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({
  product,
  onWishlistToggle,
  isWishlisted = false
}) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!product) return null;

  const isBlack = (product.color || '').toLowerCase() === 'black';
  const colorLabel = product.color
    ? product.color.charAt(0).toUpperCase() + product.color.slice(1)
    : '';

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  const isCustomizable = product.category === 'customizable';
  const formattedPrice = Math.round(product.price || 499);

  // Dynamic fallback using high-quality Unsplash model images
  const getProductImage = () => {
    if (product.imageUrl && !product.imageUrl.includes('placeholder')) {
      return product.imageUrl;
    }
    const color = (product.color || '').toLowerCase();
    const type = (product.type || '').toLowerCase();

    if (type.includes('polo')) {
      return 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=900&q=80';
    }
    if (type.includes('oversized')) {
      return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=80';
    }
    if (color === 'black') {
      return 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=900&q=80';
    }
    return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80';
  };

  return (
    <div
      className={`product-card card-hover-lift reveal-on-scroll observed revealed ${
        isBlack ? 'product-card--black' : ''
      }`}
      onClick={handleCardClick}
      data-product-id={product.id}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-image-wrapper" style={{ overflow: 'hidden' }}>
        <img
          src={getProductImage()}
          alt={product.name || 'T-Shirt Model'}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }}
        />
        <div className="product-badges">
          {product.stockStatus === 'outOfStock' ? (
            <span className="stock-badge out-stock">Out of Stock</span>
          ) : (
            <span className="stock-badge in-stock">In Stock</span>
          )}
          {isCustomizable && (
            <span className="custom-badge">✏️ Customizable</span>
          )}
        </div>
        {onWishlistToggle && (
          <button
            className={`wishlist-heart-btn ${isWishlisted ? 'wishlisted' : ''}`}
            aria-label="Toggle Wishlist"
            onClick={handleWishlistClick}
          >
            <svg viewBox="0 0 24 24" className="heart-icon">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        )}
      </div>
      <div className="product-info">
        <div className="product-meta-row">
          <span className="product-meta">
            {isCustomizable ? 'Blank Tee' : product.type || 'T-Shirt'} · {colorLabel}
          </span>
          <span className="product-price">₹{formattedPrice}</span>
        </div>
        {product.brand && (
          <div
            className="product-brand"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px'
            }}
          >
            {product.brand}
          </div>
        )}
        <h3 className="product-title" style={{ marginTop: product.brand ? '1px' : '2px' }}>{product.name}</h3>
        <button
          className="btn btn-accent btn-press-feedback"
          style={{ marginTop: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          {isCustomizable ? 'Customize & Order' : 'Order Now'}
        </button>
      </div>
    </div>
  );
}
