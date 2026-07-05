import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cc_theme') || 'dark';
  });

  // Observe data-theme attribute changes made by the Header component
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('cc_theme', nextTheme);
    setTheme(nextTheme);
  };

  const getFirstName = () => {
    if (!currentUser) return 'Guest';
    if (currentUser.displayName) return currentUser.displayName.split(' ')[0];
    return currentUser.email.split('@')[0];
  };

  const isTabActive = (path) => location.pathname === path ? 'active' : '';

  const closeBottomSheet = () => setSheetOpen(false);

  return (
    <>
      {/* ── Mobile Bottom Navigation Bar ─────────────────── */}
      <nav className="mobile-bottom-nav">

        {/* Home */}
        <Link to="/" className={`bottom-nav-item ${isTabActive('/')}`} onClick={closeBottomSheet}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>

        {/* Collection */}
        <a href="/#collection" className="bottom-nav-item" onClick={closeBottomSheet}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          Collection
        </a>

        {/* Wishlist */}
        <Link to="/wishlist" className={`bottom-nav-item ${isTabActive('/wishlist')}`} onClick={closeBottomSheet}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Wishlist
        </Link>

        {/* Orders */}
        <Link to="/orders" className={`bottom-nav-item ${isTabActive('/orders')}`} onClick={closeBottomSheet}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Orders
        </Link>

        {/* Account */}
        <button
          onClick={() => setSheetOpen(true)}
          className={`bottom-nav-item ${sheetOpen ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account
        </button>
      </nav>

      {/* ── Account Bottom Sheet Backdrop ──────────────────── */}
      <div
        className={`bottom-sheet-backdrop ${sheetOpen ? 'active' : ''}`}
        onClick={closeBottomSheet}
      />

      {/* ── Account Bottom Sheet ───────────────────────────── */}
      <div className={`bottom-sheet ${sheetOpen ? 'active' : ''}`}>
        {/* Drag handle */}
        <div className="bottom-sheet-header" onClick={closeBottomSheet} />
        <div className="bottom-sheet-content">
          <div className="bottom-sheet-greeting">
            Hi, {getFirstName()}
          </div>

          {/* Login / Logout row */}
          <div className="bottom-sheet-row">
            <span className="bottom-sheet-label">Session</span>
            {!currentUser ? (
              <Link
                to="/login"
                className="btn btn-accent"
                style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
                onClick={closeBottomSheet}
              >
                Login
              </Link>
            ) : (
              <button
                onClick={() => { logout(); closeBottomSheet(); }}
                style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}
              >
                Logout
              </button>
            )}
          </div>

          {/* Theme toggle row */}
          <div className="bottom-sheet-row">
            <span className="bottom-sheet-label">Theme</span>
            <button
              onClick={toggleTheme}
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
            >
              {theme === 'dark' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
