import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { useEmail } from '../hooks/useEmail';
import { useUploader } from '../hooks/useUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import CartDrawer from '../components/CartDrawer';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { generateOrderId, sendOrderNotification } = useWhatsApp();
  const { sendConfirmation } = useEmail();
  const {
    cloudinaryUrl,
    localPreviewUrl,
    isUploading,
    uploadProgress,
    error: uploadError,
    handleFile,
    resetUploader
  } = useUploader();

  // Page state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('');
  
  // Reviews state (for catalog products)
  const [reviews, setReviews] = useState([]);
  const [reviewsLimit, setReviewsLimit] = useState(10);
  const [avgRating, setAvgRating] = useState('0.0');

  // Modal state
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1,
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Uploader ref
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Prefill details from currentUser
  useEffect(() => {
    if (currentUser) {
      const savedPhone = sessionStorage.getItem('cc_user_phone') || '';
      setFormData((prev) => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: savedPhone
      }));
    }
  }, [currentUser]);

  // Fetch product from Firestore on mount/id change
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          setSelectedColor(data.color || 'white');
          if (data.category === 'catalog') {
            setSelectedSize('Standard');
          } else {
            setSelectedSize('M'); // default size for custom
          }
        } else {
          // Check if it matches static IDs
          if (id === '__static_white') {
            setProduct({ id: '__static_white', color: 'white', name: 'White Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: '/assets/images/white-t-shirt.png' });
            setSelectedColor('white');
            setSelectedSize('M');
          } else if (id === '__static_black') {
            setProduct({ id: '__static_black', color: 'black', name: 'Black Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: '/assets/images/black-t-shirt.png' });
            setSelectedColor('black');
            setSelectedSize('M');
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Real-time reviews fetching for catalog product
  useEffect(() => {
    if (!product || product.category !== 'catalog') return;

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', product.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revList = [];
      let totalRating = 0;
      snapshot.forEach((doc) => {
        const rev = doc.data();
        totalRating += rev.rating;
        revList.push({ id: doc.id, ...rev });
      });

      setReviews(revList);
      if (revList.length > 0) {
        setAvgRating((totalRating / revList.length).toFixed(1));
      } else {
        setAvgRating('0.0');
      }
    });

    return unsubscribe;
  }, [product]);

  // Require auth: redirect to login if user clicks to customize/order but not logged in
  useEffect(() => {
    if (!loading && !currentUser) {
      sessionStorage.setItem('cc_redirect_after_login', window.location.pathname + window.location.search);
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (!product) {
    return (
      <div style={{ padding: '12rem 2rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '1rem' }}>404 — PRODUCT NOT FOUND</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
          The product you are looking for does not exist or has been removed.
        </p>
        <Link to="/" className="btn btn-accent" style={{ padding: '0.8rem 2rem' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('catalog-', '').replace('-input', '');
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required.';
    if (!formData.phone.trim()) errors.phone = 'WhatsApp Number is required.';
    if (!formData.address.trim()) errors.address = 'Delivery Address is required.';
    if (formData.quantity <= 0) errors.quantity = 'Quantity must be at least 1.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (product.category === 'customizable' && isUploading) {
      alert('Please wait for the custom design to finish uploading.');
      return;
    }

    setOrderLoading(true);

    try {
      const orderId = generateOrderId();
      const finalPrice = product.price * formData.quantity;
      const totalFormatted = `₹${finalPrice}`;

      const orderData = {
        orderId,
        productId: product.id,
        productName: product.name,
        color: selectedColor,
        size: selectedSize || 'Standard',
        quantity: parseInt(formData.quantity) || 1,
        price: finalPrice,
        cloudinaryUrl: product.category === 'customizable' ? (cloudinaryUrl || null) : null,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        specialInstructions: formData.notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // 1. Save to Firestore
      await addDoc(collection(db, 'orders'), orderData);

      // 2. Save last order for receipt render on Success page
      localStorage.setItem(
        'crazy_cloths_last_order',
        JSON.stringify({
          orderId,
          total: totalFormatted,
          productName: product.name,
          color: selectedColor,
          size: selectedSize,
          quantity: formData.quantity
        })
      );

      // 3. Trigger WhatsApp notifications
      sendOrderNotification(
        {
          productName: product.name,
          color: selectedColor,
          size: selectedSize,
          quantity: formData.quantity,
          cloudinaryUrl: orderData.cloudinaryUrl,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          specialInstructions: formData.notes
        },
        orderId,
        totalFormatted
      );

      // 4. Send Confirmation Email
      await sendConfirmation(
        {
          customerName: formData.name,
          customerEmail: formData.email,
          color: selectedColor,
          size: selectedSize,
          quantity: formData.quantity,
          cloudinaryUrl: orderData.cloudinaryUrl,
          specialInstructions: formData.notes,
          productName: product.name
        },
        orderId,
        totalFormatted
      );

      // Save phone number for future sessions
      sessionStorage.setItem('cc_user_phone', formData.phone);

      setOrderLoading(false);
      navigate('/success', { state: orderData });
    } catch (err) {
      console.error('Order submission failed:', err);
      alert('Something went wrong. Please try again.');
      setOrderLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Helper to draw stars based on rating
  const renderStars = (ratingVal) => {
    const rounded = Math.round(parseFloat(ratingVal));
    let starsStr = '';
    for (let i = 1; i <= 5; i++) {
      starsStr += i <= rounded ? '★' : '☆';
    }
    return starsStr;
  };

  return (
    <>
      <CartDrawer />

      {/* ──────────────────────────────────────────────────────────
           CATALOG PRODUCT LAYOUT
         ────────────────────────────────────────────────────────── */}
      {product.category === 'catalog' && (
        <section id="catalog-detail-section" className="page-section" style={{ display: 'block' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }} className="catalog-grid-mobile">
              
              {/* Left Column: Product Image */}
              <div>
                <div className="designer-mockup-container" style={{ maxWidth: '420px', overflow: 'hidden', borderRadius: '8px' }}>
                  <img
                    src={product.imageUrl || '/assets/images/white-t-shirt.png'}
                    alt={product.name}
                    className="mockup-base"
                    style={{ width: '100%', borderRadius: '8px', transition: 'transform 0.4s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                </div>
              </div>

              {/* Right Column: Product Info & Order Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1rem' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                    {product.type || 'T-Shirt'} · {selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', margin: 0 }}>
                      {product.name}
                    </h1>
                    <button
                      className={`wishlist-heart-btn ${isWishlisted(product.id) ? 'wishlisted' : ''}`}
                      style={{ position: 'static', flexShrink: 0 }}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Toggle Wishlist"
                    >
                      <svg viewBox="0 0 24 24" className="heart-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-accent)', fontWeight: 800 }}>
                    ₹{Math.round(product.price)}
                  </div>

                  {/* Rating display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#F59E0B', fontSize: '1.1rem', letterSpacing: '2px' }}>{renderStars(avgRating)}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{avgRating}</span>
                    <a href="#reviews-section" style={{ textDecoration: 'underline' }}>({reviews.length} reviews)</a>
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  Premium 100% organic cotton. Heavyweight 240 GSM combed weave. DTF print that holds through 50+ washes.<br />
                  Fit: Relaxed Oversized Fit (Size Guide: <span onClick={() => setSizeGuideOpen(true)} style={{ color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}>View Guide</span>)
                </p>

                {/* Form */}
                <div className="designer-card" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Place Order</h3>

                  <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <input
                        type="text"
                        id="catalog-name"
                        className={`form-input ${formErrors.name ? 'input-invalid' : ''}`}
                        placeholder=" "
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">Full Name *</label>
                      {formErrors.name && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.name}</div>}
                    </div>

                    <div className="form-group">
                      <input
                        type="email"
                        id="catalog-email"
                        className="form-input"
                        placeholder=" "
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">Email Address</label>
                    </div>

                    <div className="form-group">
                      <input
                        type="tel"
                        id="catalog-phone"
                        className={`form-input ${formErrors.phone ? 'input-invalid' : ''}`}
                        placeholder=" "
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">WhatsApp Number *</label>
                      {formErrors.phone && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.phone}</div>}
                    </div>

                    <div className="form-group">
                      <textarea
                        id="catalog-address"
                        className={`form-input ${formErrors.address ? 'input-invalid' : ''}`}
                        rows="2"
                        style={{ resize: 'vertical' }}
                        placeholder=" "
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">Delivery Address *</label>
                      {formErrors.address && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.address}</div>}
                    </div>

                    <div className="form-group">
                      <input
                        type="number"
                        id="catalog-qty"
                        className="form-input"
                        min="1"
                        placeholder=" "
                        style={{ fontFamily: 'var(--font-mono)' }}
                        value={formData.quantity}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">Quantity *</label>
                    </div>

                    <div className="form-group">
                      <textarea
                        id="catalog-notes"
                        className="form-input"
                        rows="2"
                        style={{ resize: 'vertical' }}
                        placeholder=" "
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                      <label className="form-label">Special Instructions (Optional)</label>
                    </div>

                    <button
                      type="submit"
                      disabled={orderLoading}
                      className={`btn btn-accent btn-premium ${orderLoading ? 'loading-active' : ''}`}
                      style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      {orderLoading ? '' : 'Place Order via WhatsApp'}
                    </button>
                    
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      Clicking Place Order opens WhatsApp to send your order details.
                    </p>
                  </form>
                </div>

                <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                  ← Back to Collection
                </Link>
              </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews-section" style={{ marginTop: '4rem', borderTop: '1px solid var(--color-border)', paddingTop: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                Customer Reviews
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reviews.length === 0 ? (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    No reviews yet. Be the first to review after purchase!
                  </p>
                ) : (
                  reviews.slice(0, reviewsLimit).map((r) => (
                    <div
                      key={r.id}
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{r.customerName}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div style={{ color: '#F59E0B', fontSize: '0.95rem', letterSpacing: '1px' }}>{renderStars(r.rating)}</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                        {r.comment || <span style={{ fontStyle: 'italic' }}>No comment left.</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {reviews.length > reviewsLimit && (
                <button
                  className="btn btn-outline"
                  style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
                  onClick={() => setReviewsLimit((prev) => prev + 10)}
                >
                  Show More Reviews
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────
           CUSTOMIZABLE PRODUCT LAYOUT
         ────────────────────────────────────────────────────────── */}
      {product.category === 'customizable' && (
        <section id="customize-section" className="page-section">
          <div className="container">
            <div className="designer-grid">
              
              {/* Left Column: Mockup Preview */}
              <div className="designer-left">
                <h2 style={{ fontSize: '2.5rem', alignSelf: 'flex-start', textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  Design Canvas
                </h2>
                
                <div className="designer-mockup-container">
                  <img
                    id="base-mockup"
                    src={selectedColor === 'black' ? '/assets/images/black-t-shirt.png' : '/assets/images/white-t-shirt.png'}
                    alt="Base Mockup T-Shirt"
                    className="mockup-base"
                  />
                  {(localPreviewUrl || cloudinaryUrl) && (
                    <img
                      id="design-overlay"
                      src={localPreviewUrl || cloudinaryUrl}
                      alt="Custom Design Preview"
                      className="mockup-design-overlay"
                    />
                  )}
                </div>
                
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
                  Mockup preview shows approximate print placement (~32% chest width).
                </p>
              </div>

              {/* Right Column: Order Customization Options */}
              <div className="designer-right" id="order-form-section">
                
                {/* 1. Color Selector */}
                <div className="designer-card">
                  <div className="selector-group">
                    <span className="selector-label">01. Select T-Shirt Color</span>
                    <div className="color-cards-container">
                      
                      {/* White Tee Button */}
                      <button
                        type="button"
                        className={`color-card-btn ${selectedColor === 'white' ? 'active' : ''}`}
                        onClick={() => setSelectedColor('white')}
                      >
                        {selectedColor === 'white' && (
                          <div className="checkmark-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <div className="color-card-img-wrap">
                          <img src="/assets/images/white-t-shirt.png" alt="White T-Shirt" loading="lazy" />
                        </div>
                        <div className="color-card-info">
                          <span className="color-indicator white-dot"></span>
                          <span className="color-name">White</span>
                        </div>
                      </button>

                      {/* Black Tee Button */}
                      <button
                        type="button"
                        className={`color-card-btn ${selectedColor === 'black' ? 'active' : ''}`}
                        onClick={() => setSelectedColor('black')}
                      >
                        {selectedColor === 'black' && (
                          <div className="checkmark-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                        <div className="color-card-img-wrap">
                          <img src="/assets/images/black-t-shirt.png" alt="Black T-Shirt" loading="lazy" />
                        </div>
                        <div className="color-card-info">
                          <span className="color-indicator black-dot"></span>
                          <span className="color-name">Black</span>
                        </div>
                      </button>

                    </div>
                  </div>
                </div>

                {/* 2. Size Selector */}
                <div className="designer-card">
                  <div className="selector-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="selector-label" style={{ margin: 0 }}>02. Select Size</span>
                      <span onClick={() => setSizeGuideOpen(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}>Size Guide</span>
                    </div>
                    <div className="size-grid">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`size-box-btn ${selectedSize === sz ? 'active' : ''}`}
                          onClick={() => setSelectedSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Custom Design Upload Zone */}
                <div className="designer-card">
                  <div className="selector-group">
                    <span className="selector-label" style={{ fontSize: '0.9rem', position: 'relative', width: '100%' }}>
                      03. Add Your Custom Design <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '0.15rem 0.45rem', color: 'var(--color-text-secondary)' }}>OPTIONAL</span>
                    </span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                      Skip this section to order a plain t-shirt. Upload a graphic to print on the front.
                    </p>

                    <div
                      id="upload-zone"
                      className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      onClick={handleBrowseFiles}
                    >
                      <div className="upload-optional-badge">Optional</div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleFileInputChange}
                      />

                      {!(localPreviewUrl || cloudinaryUrl) && !isUploading && (
                        <>
                          <svg id="upload-icon" className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span id="upload-text" className="upload-text">Drag &amp; drop your artwork here, or <strong>browse</strong></span>
                          <span id="upload-subtext" className="upload-subtext">PNG, JPG, SVG · max 10MB</span>
                        </>
                      )}

                      {isUploading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <span className="upload-text">Uploading Design to Cloudinary...</span>
                          <div id="upload-progress-bar" className="upload-progress-bar" style={{ display: 'block', marginTop: '1rem' }}>
                            <div id="upload-progress-fill" className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <span className="upload-subtext" style={{ marginTop: '0.5rem' }}>{uploadProgress}%</span>
                        </div>
                      )}

                      {(localPreviewUrl || cloudinaryUrl) && !isUploading && (
                        <div id="upload-preview-container" className="upload-preview-container active" onClick={(e) => e.stopPropagation()}>
                          <img
                            id="preview-thumbnail"
                            src={localPreviewUrl || cloudinaryUrl}
                            alt="Thumbnail"
                            className="preview-thumbnail"
                          />
                          <button
                            type="button"
                            id="remove-upload-btn"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                            onClick={() => resetUploader()}
                          >
                            Remove File
                          </button>
                        </div>
                      )}
                    </div>
                    {uploadError && <div id="upload-error" className="upload-error" style={{ display: 'block', color: 'var(--color-accent)' }}>{uploadError}</div>}
                  </div>
                </div>

                {/* 4. Customer Details Form */}
                <div className="designer-card">
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                    04. Customer Details
                  </h3>
                  <form onSubmit={handleOrderSubmit} id="order-form" style={{ border: '1px solid var(--color-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    
                    <div className="form-group">
                      <input
                        type="text"
                        id="name-input"
                        className={`form-input ${formErrors.name ? 'input-invalid' : ''}`}
                        placeholder=" "
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="name-input" className="form-label">Full Name *</label>
                      {formErrors.name && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.name}</div>}
                    </div>

                    <div className="form-group">
                      <input
                        type="email"
                        id="email-input"
                        className="form-input"
                        placeholder=" "
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="email-input" className="form-label">Email Address</label>
                      <span className="form-input-note">Used to send your order confirmation email.</span>
                    </div>

                    <div className="form-group">
                      <input
                        type="tel"
                        id="phone-input"
                        className={`form-input ${formErrors.phone ? 'input-invalid' : ''}`}
                        placeholder=" "
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="phone-input" className="form-label">WhatsApp Number *</label>
                      <span className="form-input-note">Country code + number (e.g. 919876543210).</span>
                      {formErrors.phone && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.phone}</div>}
                    </div>

                    <div className="form-group">
                      <textarea
                        id="address-input"
                        className={`form-input ${formErrors.address ? 'input-invalid' : ''}`}
                        rows="3"
                        style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                        placeholder=" "
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="address-input" className="form-label">Delivery Address *</label>
                      {formErrors.address && <div className="form-input-error" style={{ display: 'block' }}>{formErrors.address}</div>}
                    </div>

                    <div className="form-group">
                      <input
                        type="number"
                        id="qty-input"
                        className="form-input"
                        min="1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                        placeholder=" "
                        value={formData.quantity}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="qty-input" className="form-label">Quantity *</label>
                    </div>

                    <div className="form-group">
                      <textarea
                        id="notes-input"
                        className="form-input"
                        rows="2"
                        style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                        placeholder=" "
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="notes-input" className="form-label">Special Instructions (Optional)</label>
                    </div>

                  </form>
                </div>

                {/* 5. Order Summary Sidebar */}
                <div className="designer-card summary-card-premium">
                  <h3 className="designer-card-title">ORDER SUMMARY</h3>

                  <div className="summary-row">
                    <span className="summary-row-label">Product</span>
                    <span className="summary-row-val">{product.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row-label">Color</span>
                    <span className="summary-row-val" style={{ textTransform: 'uppercase' }}>{selectedColor}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row-label">Size</span>
                    <span className="summary-row-val">{selectedSize || 'None Selected'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row-label">Quantity</span>
                    <span className="summary-row-val">{formData.quantity}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row-label">Custom Design</span>
                    <span className="summary-row-val">
                      {localPreviewUrl || cloudinaryUrl ? 'Custom Image Attached' : 'No Design (Optional)'}
                    </span>
                  </div>
                  <div className="summary-row total">
                    <span className="summary-row-label" style={{ color: 'var(--color-text-primary)' }}>TOTAL</span>
                    <span>₹{product.price * formData.quantity}</span>
                  </div>

                  <button
                    type="submit"
                    form="order-form"
                    disabled={orderLoading}
                    className={`btn btn-accent btn-premium ${orderLoading ? 'loading-active' : ''}`}
                    style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {orderLoading ? '' : 'Place Order'}
                  </button>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>
                    Clicking Place Order opens WhatsApp to send your order details to us.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────
           SIZE GUIDE MODAL
         ────────────────────────────────────────────────────────── */}
      {sizeGuideOpen && (
        <div className="size-guide-modal-backdrop active" onClick={() => setSizeGuideOpen(false)}>
          <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="size-guide-close-btn" onClick={() => setSizeGuideOpen(false)}>&times;</button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              Size Guide
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }} className="modal-grid-mobile">
              {/* Left Column: T-Shirt illustration */}
              <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--color-bg-2)', borderRadius: '6px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-primary)' }}>
                  <path d="M 30,10 L 40,10 C 43,15 57,15 60,10 L 70,10 L 85,25 L 75,35 L 70,30 L 70,90 L 30,90 L 30,30 L 25,35 L 15,25 Z" strokeLinejoin="round"/>
                  <line x1="30" y1="45" x2="70" y2="45" stroke="var(--color-accent)" strokeDasharray="1 1"/>
                  <circle cx="30" cy="45" r="1.5" fill="var(--color-accent)"/>
                  <circle cx="70" cy="45" r="1.5" fill="var(--color-accent)"/>
                  <text x="50" y="40" fill="var(--color-accent)" fontSize="5" textAnchor="middle" fontFamily="sans-serif">A. Chest Width</text>
                  <line x1="50" y1="12" x2="50" y2="90" stroke="var(--color-accent)" strokeDasharray="1 1"/>
                  <circle cx="50" cy="12" r="1.5" fill="var(--color-accent)"/>
                  <circle cx="50" cy="90" r="1.5" fill="var(--color-accent)"/>
                  <text x="53" y="55" fill="var(--color-accent)" fontSize="5" fontFamily="sans-serif">B. Length</text>
                </svg>
              </div>

              {/* Right Column: Measurements Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'left', color: 'var(--color-text-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '0.4rem 0.2rem' }}>Size</th>
                      <th style={{ padding: '0.4rem 0.2rem' }}>A (Chest)</th>
                      <th style={{ padding: '0.4rem 0.2rem' }}>B (Length)</th>
                      <th style={{ padding: '0.4rem 0.2rem' }}>Shoulder</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>XS</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>36"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>26"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>16.5"</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>S</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>38"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>27"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>17.5"</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>M</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>40"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>28"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>18.5"</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>L</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>42"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>29"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>19.5"</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>XL</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>44"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>30"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>20.5"</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.4rem 0.2rem', fontWeight: 700 }}>XXL</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>46"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>31"</td>
                      <td style={{ padding: '0.4rem 0.2rem' }}>21.5"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
