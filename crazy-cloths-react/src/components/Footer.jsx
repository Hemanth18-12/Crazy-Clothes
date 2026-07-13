import React from 'react';
import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import LogoMark from './LogoMark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <LogoMark />
            </div>
            <p style={{ maxWidth: '320px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Streetwear-focused premium t-shirts customized with your uploaded graphics. No templates, no limits.
            </p>
          </div>
          <div className="footer-col">
            <h4>Navigate</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/collection">Collection</Link></li>
              <li><Link to="/customize">Customize</Link></li>
              <li><a href="/#how-it-works">How It Works</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Garment Care</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', maxWidth: '280px' }}>
              Cold wash inside out. Dry in shade. Low iron inside out. Do not bleach.
            </p>
          </div>
          <div className="footer-col">
            <h4>Contact Info</h4>
            <ul>
              <li>Email: <a href="mailto:support@crazycloths.com">support@crazycloths.com</a></li>
              <li>WhatsApp Support: <a href={`https://wa.me/${(CONFIG.whatsappNumber || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">Message Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} {CONFIG.storeName}. All rights reserved.</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>Designed for the bold</p>
        </div>
      </div>
    </footer>
  );
}
