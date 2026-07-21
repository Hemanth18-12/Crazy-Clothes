import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const { orders, loading: ordersLoading, error } = useOrders();
  const [userReviews, setUserReviews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ orderId: '', productId: '', productName: '' });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    document.title = 'Crazy Cloths — My Orders';
  }, []);

  // Listen to user reviews in real-time
  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setUserReviews([]);
      return;
    }

    const q = query(
      collection(db, 'reviews'),
      where('customerEmail', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const revs = [];
        snapshot.forEach((doc) => {
          revs.push({ id: doc.id, ...doc.data() });
        });
        setUserReviews(revs);
      },
      (err) => {
        console.error('Reviews snapshot listener error:', err);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const openReviewModal = (orderId, productId, productName) => {
    setModalData({ orderId, productId, productName });
    setRating(0);
    setComment('');
    setModalOpen(true);
  };

  const closeReviewModal = () => {
    setModalOpen(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: modalData.productId,
        orderId: modalData.orderId,
        rating: rating,
        comment: comment.trim(),
        customerName: currentUser.displayName || currentUser.email.split('@')[0],
        customerEmail: currentUser.email,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getTimelineDetails = (status) => {
    let fillPct = 0;
    let step1 = 'active', step2 = '', step3 = '', step4 = '';

    if (status === 'Confirmed') {
      fillPct = 33.33;
      step1 = 'done';
      step2 = 'active';
    } else if (status === 'Dispatched') {
      fillPct = 66.66;
      step1 = 'done';
      step2 = 'done';
      step3 = 'active';
    } else if (status === 'Delivered') {
      fillPct = 100;
      step1 = 'done';
      step2 = 'done';
      step3 = 'done';
      step4 = 'active done';
    }

    return { fillPct, step1, step2, step3, step4 };
  };

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '80vh' }}>
      {/* Embedded page styles to preserve original UI since it isn't in main CSS */}
      <style>{`
        .order-tracking-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .order-header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .order-meta-details {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .order-meta-item span {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          text-transform: uppercase;
        }
        .order-meta-item strong {
          font-size: 1rem;
          color: var(--color-text-primary);
        }

        .order-body-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2rem;
          align-items: center;
        }
        @media (max-width: 600px) {
          .order-body-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .order-thumbnail {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 6px;
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
        }

        .timeline-wrapper {
          position: relative;
          padding: 1.5rem 0 0.5rem 0;
          margin-top: 1rem;
        }

        .timeline-line-bg {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 4px;
          background: var(--color-border-light);
          transform: translateY(-50%);
          z-index: 1;
          border-radius: 2px;
        }

        .timeline-line-fill {
          position: absolute;
          top: 50%;
          left: 0;
          height: 4px;
          background: var(--color-accent);
          transform: translateY(-50%);
          z-index: 2;
          border-radius: 2px;
          transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .timeline-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 3;
          width: 100%;
        }

        .timeline-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--color-surface);
          position: relative;
        }

        .timeline-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 3px solid var(--color-border-light);
          transition: border-color 0.4s ease, background-color 0.4s ease, transform 0.4s ease;
        }

        .timeline-node.active .timeline-dot {
          border-color: var(--color-accent);
          background-color: var(--color-bg);
          transform: scale(1.2);
        }

        .timeline-node.done .timeline-dot {
          border-color: var(--color-accent);
          background-color: var(--color-accent);
        }

        .timeline-label {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          text-transform: uppercase;
          color: var(--color-text-secondary);
          transition: color 0.4s ease;
          font-weight: 500;
        }

        .timeline-node.active .timeline-label,
        .timeline-node.done .timeline-label {
          color: var(--color-text-primary);
          font-weight: 700;
        }

        /* Modal Dialog */
        .review-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .review-modal-backdrop.active {
          opacity: 1;
          pointer-events: all;
        }

        .review-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 2.5rem;
          width: 100%;
          max-width: 480px;
          transform: scale(0.9);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .review-modal-backdrop.active .review-modal {
          transform: scale(1);
        }

        .review-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 2rem;
          line-height: 1;
          cursor: pointer;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          transition: color 0.2s;
        }

        .review-modal-close:hover {
          color: var(--color-accent);
        }

        .star-rating-select {
          display: flex;
          gap: 0.5rem;
          margin: 1.5rem 0;
          justify-content: center;
        }

        .star-select-btn {
          font-size: 2.2rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease;
          background: none;
          border: none;
        }

        .star-select-btn:hover {
          transform: scale(1.3);
        }

        .star-select-btn.filled {
          color: #F59E0B;
          animation: starBounce 0.3s ease;
        }

        @keyframes starBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
      `}</style>

      <section className="page-section">
        <div className="container" style={{ maxWidth: '900px' }}>
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
            My Orders
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
                Failed to load orders
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '2rem'
                }}
              >
                {error.message || 'Something went wrong while fetching your orders.'}
              </p>
            </div>
          )}

          {/* Loader State */}
          {!error && ordersLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                className="skeleton-card"
                style={{
                  height: '180px',
                  width: '100%',
                  background: 'var(--color-surface)',
                  opacity: 0.5,
                  borderRadius: '8px'
                }}
              ></div>
            </div>
          )}

          {/* Empty State */}
          {!error && !ordersLoading && orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  color: 'var(--color-text-secondary)'
                }}
              >
                You haven't placed an order yet
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '2rem'
                }}
              >
                Explore our collection or design your own custom fit.
              </p>
              <Link to="/collection" className="btn btn-accent" style={{ padding: '0.8rem 2rem', textDecoration: 'none', display: 'inline-block' }}>
                Go to Shop
              </Link>
            </div>
          )}

          {/* Orders Container */}
          {!error && !ordersLoading && orders.length > 0 && (
            <div>
              {orders.map((order) => {
                const orderIdDisplay = order.orderId || order.id.slice(0, 8);
                const formattedDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'N/A';
                const status = order.status || 'Pending';
                const timeline = getTimelineDetails(status);
                const isReviewed = userReviews.some((r) => r.orderId === order.id);

                return (
                  <div key={order.id} className="order-tracking-card">
                    <div className="order-header-info">
                      <div className="order-meta-details">
                        <div className="order-meta-item">
                          <span>Order Reference</span>
                          <strong>#CC-{orderIdDisplay}</strong>
                        </div>
                        <div className="order-meta-item">
                          <span>Date Placed</span>
                          <strong>{formattedDate}</strong>
                        </div>
                        <div className="order-meta-item">
                          <span>Amount Total</span>
                          <strong style={{ color: 'var(--color-accent)' }}>
                            ₹{order.price || 499}
                          </strong>
                        </div>
                      </div>
                      <span className={`badge ${status.toLowerCase()}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        {status}
                      </span>
                    </div>

                    <div className="order-body-grid">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img
                          src={
                            order.cloudinaryUrl
                              ? order.cloudinaryUrl
                              : order.imageUrl
                              ? order.imageUrl
                              : (order.color === 'black'
                                  ? '/assets/images/black-t-shirt.png'
                                  : '/assets/images/white-t-shirt.png')
                          }
                          alt={order.productName || 'Custom Fit'}
                          className="order-thumbnail"
                        />
                        <div>
                          <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            {order.productName || 'Custom Fit T-Shirt'}
                          </h3>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            Size: {order.size || 'Standard'} &nbsp;·&nbsp; Color: {order.color || 'white'} &nbsp;·&nbsp; Qty: {order.quantity || 1}
                          </p>
                        </div>
                      </div>

                      {/* Status Line Progress */}
                      <div className="timeline-wrapper">
                        <div className="timeline-line-bg"></div>
                        <div className="timeline-line-fill" style={{ width: `${timeline.fillPct}%` }}></div>
                        <div className="timeline-steps">
                          <div className={`timeline-node ${timeline.step1}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-label">Placed</div>
                          </div>
                          <div className={`timeline-node ${timeline.step2}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-label">Confirmed</div>
                          </div>
                          <div className={`timeline-node ${timeline.step3}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-label">Dispatched</div>
                          </div>
                          <div className={`timeline-node ${timeline.step4}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-label">Delivered</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address Card */}
                    {order.address && (order.address.houseNo || order.address.city) && (
                      <div style={{
                        marginTop: '1.25rem',
                        borderTop: '1px dashed var(--color-border)',
                        paddingTop: '1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            Delivery Address
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-text-primary)', lineHeight: '1.55' }}>
                            {[order.address.houseNo, order.address.street, order.address.village].filter(Boolean).join(', ')}<br/>
                            {[order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')}
                            {order.address.landmark && (
                              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.72rem' }}>
                                Near: {order.address.landmark}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback: show plain address string for old orders */}
                    {!order.address && order.customerAddress && (
                      <div style={{
                        marginTop: '1.25rem',
                        borderTop: '1px dashed var(--color-border)',
                        paddingTop: '1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            Delivery Address
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-text-primary)', lineHeight: '1.55' }}>
                            {order.customerAddress}
                          </div>
                        </div>
                      </div>
                    )}

                    {status === 'Delivered' && (
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        {isReviewed ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-success)' }}>
                            ✓ Review submitted. Thank you!
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => openReviewModal(order.id, order.productId, order.productName || 'Product')}
                          >
                            ⭐ Leave a Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Leave Review modal dialog */}
      <div className={`review-modal-backdrop ${modalOpen ? 'active' : ''}`}>
        <div className="review-modal">
          <button className="review-modal-close" onClick={closeReviewModal}>
            ×
          </button>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Leave a Review
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            For "{modalData.productName}"
          </p>

          <form onSubmit={handleReviewSubmit}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Your Rating
              </span>
              <div className="star-rating-select">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-select-btn ${rating >= star ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-input"
                rows="3"
                placeholder=" "
                style={{ resize: 'vertical' }}
              ></textarea>
              <label className="form-label">Review Comment (Optional)</label>
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="btn btn-accent btn-premium"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem' }}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
