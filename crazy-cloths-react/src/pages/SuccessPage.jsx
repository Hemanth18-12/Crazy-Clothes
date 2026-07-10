import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function SuccessPage() {
  const location = useLocation();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    document.title = 'Crazy Cloths — Order Confirmed';
  }, []);

  useEffect(() => {
    // 1. Try to read from React Router navigation state
    if (location.state) {
      setOrder(location.state);
      // Save it to localStorage as backup
      localStorage.setItem('crazy_cloths_last_order', JSON.stringify(location.state));
    } else {
      // 2. Try to fallback to localStorage
      try {
        const savedOrder = localStorage.getItem('crazy_cloths_last_order');
        if (savedOrder) {
          setOrder(JSON.parse(savedOrder));
        }
      } catch (e) {
        console.error('Failed to parse last order from localStorage', e);
      }
    }
  }, [location]);

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <section className="success-container" style={{ width: '100%', maxWidth: '600px' }}>
        <div className="success-card">
          
          {/* Confetti Burst Container */}
          <div className="confetti-container">
            <div className="confetti-particle" style={{ '--delay': '0.1s', '--x': '-80px', '--y': '-120px', '--bg': 'var(--color-accent)' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.25s', '--x': '100px', '--y': '-150px', '--bg': '#3b82f6' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.15s', '--x': '-140px', '--y': '-60px', '--bg': '#10b981' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.35s', '--x': '120px', '--y': '-50px', '--bg': '#f59e0b' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.2s', '--x': '-50px', '--y': '-180px', '--bg': 'var(--color-accent)' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.4s', '--x': '60px', '--y': '-200px', '--bg': '#3b82f6' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.45s', '--x': '-110px', '--y': '-160px', '--bg': '#10b981' }}></div>
            <div className="confetti-particle" style={{ '--delay': '0.3s', '--x': '140px', '--y': '-110px', '--bg': '#f59e0b' }}></div>
          </div>

          {/* Self-drawing SVG checkmark */}
          <div className="success-icon-wrapper" style={{ border: 'none', background: 'transparent' }}>
            <svg viewBox="0 0 52 52" className="checkmark-svg">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>

          <h1 className="success-title slam-left">ORDER PLACED!</h1>
          
          <p style={{ maxWidth: '480px', fontSize: '1.05rem', margin: '0 auto 2rem auto', textAlign: 'center' }}>
            Your order has been sent to us via WhatsApp! We will check your design, confirm payment details, and reach out to you within 24 hours.
          </p>

          {/* Dynamic Order Summary Receipt */}
          {order && (
            <div className="success-details" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <div className="success-details-row">
                <span className="success-details-label">Order Reference</span>
                <span className="success-details-val">#CC-{order.orderId || order.id?.slice(0, 8) || 'XXXXXXXXXX'}</span>
              </div>

              <div className="success-details-row">
                <span className="success-details-label">
                  {order.category === 'catalog' ? 'Product' : 'Custom Garment'}
                </span>
                <span className="success-details-val">
                  {order.category === 'catalog'
                    ? order.productName
                    : `${(order.color || '').toUpperCase()} / ${order.size || 'M'}`}
                </span>
              </div>

              <div className="success-details-row">
                <span className="success-details-label">Quantity</span>
                <span className="success-details-val">{order.quantity || 1}</span>
              </div>

              <div className="success-details-row" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-sm)', marginTop: '4px' }}>
                <span className="success-details-label" style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>Amount Total</span>
                <span className="success-details-val" style={{ color: 'var(--color-accent)', fontWeight: '700' }}>
                  ₹{order.price || 499}
                </span>
              </div>
            </div>
          )}

          <div style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>
            <Link to="/" className="btn btn-primary btn-pulse-loop btn-full" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Order Another
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
