import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';

// SVG Icons as specified in the instructions
const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ShirtIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0
      00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2
      2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0
      00-1.34-2.23z"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06
      a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
      1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7
      4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2
      2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

function NavItem({ icon, label, to, onClick, badge }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = to ? location.pathname === to : false;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <button
      className={`bottom-nav-item ${active ? 'active' : ''}`}
      onClick={handleClick}
    >
      {icon}
      {badge > 0 && <span className="bottom-nav-badge"></span>}
      <span>{label}</span>
    </button>
  );
}

export default function MobileBottomNav() {
  const { currentUser, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [shouldRenderSheet, setShouldRenderSheet] = useState(false);
  const [animateSheetOpen, setAnimateSheetOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cc_theme') || 'dark';
  });

  const wishlistCount = wishlistIds ? wishlistIds.length : 0;

  // Handle mounting and transition states for the bottom sheet
  useEffect(() => {
    if (accountSheetOpen) {
      setShouldRenderSheet(true);
    } else {
      setAnimateSheetOpen(false);
      const timer = setTimeout(() => {
        setShouldRenderSheet(false);
      }, 300); // Wait for transition out
      return () => clearTimeout(timer);
    }
  }, [accountSheetOpen]);

  useEffect(() => {
    if (shouldRenderSheet && accountSheetOpen) {
      const rAF = requestAnimationFrame(() => {
        setAnimateSheetOpen(true);
      });
      return () => cancelAnimationFrame(rAF);
    }
  }, [shouldRenderSheet, accountSheetOpen]);

  // Observe data-theme changes (e.g. from Header.jsx toggle)
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

  const toggleAccountSheet = () => {
    setAccountSheetOpen((prev) => !prev);
  };

  const closeBottomSheet = () => {
    setAccountSheetOpen(false);
  };

  const handleCollection = () => {
    closeBottomSheet();
    if (location.pathname === '/') {
      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const handleLogout = async () => {
    closeBottomSheet();
    await logout();
  };

  return (
    <>
      <nav className="mobile-bottom-nav">
        <NavItem icon={<HomeIcon />} label="Home" to="/" onClick={closeBottomSheet} />
        <NavItem icon={<ShirtIcon />} label="Collection" onClick={handleCollection} />
        <NavItem icon={<HeartIcon />} label="Wishlist" to="/wishlist" badge={wishlistCount} onClick={closeBottomSheet} />
        <NavItem icon={<PackageIcon />} label="Orders" to="/orders" onClick={closeBottomSheet} />
        <button
          className={`bottom-nav-item ${accountSheetOpen ? 'active' : ''}`}
          onClick={toggleAccountSheet}
        >
          <UserIcon />
          <span>Account</span>
        </button>
      </nav>

      {shouldRenderSheet && (
        <div className={`bottom-account-sheet ${animateSheetOpen ? 'active' : ''}`}>
          <div className="bottom-sheet-backdrop" onClick={toggleAccountSheet} />
          <div className="bottom-sheet-content">
            <div className="bottom-sheet-header" onClick={closeBottomSheet} />
            <div className="bottom-sheet-greeting">
              Hi, {getFirstName()}
            </div>

            <div className="bottom-sheet-row">
              <span className="bottom-sheet-label">Session</span>
              {!currentUser ? (
                <button
                  onClick={() => {
                    closeBottomSheet();
                    navigate('/login');
                  }}
                  style={{
                    padding: '0.4rem 1.2rem',
                    fontSize: '0.85rem',
                    background: 'var(--color-accent)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    width: 'auto'
                  }}
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.4rem 1.2rem',
                    fontSize: '0.85rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    width: 'auto'
                  }}
                >
                  Logout
                </button>
              )}
            </div>

            <div className="bottom-sheet-row">
              <span className="bottom-sheet-label">Theme</span>
              <button
                onClick={toggleTheme}
                style={{
                  padding: '0.4rem 1.2rem',
                  fontSize: '0.85rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  gap: '0.4rem',
                  alignItems: 'center',
                  width: 'auto'
                }}
              >
                {theme === 'dark' ? (
                  <>
                    <SunIcon />
                    Light Mode
                  </>
                ) : (
                  <>
                    <MoonIcon />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
