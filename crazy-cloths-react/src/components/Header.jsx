import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// SVG Icons as separate components to keep JSX clean
const SunIcon = () => (
  <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const HeartIcon = ({ size = '14px' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2rem' }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { count, openCart } = useCart();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cc_theme') || 'dark';
  });

  // Track scroll position to apply scrolled header class
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync theme changes to data-theme and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleMenu = () => {
    setMenuActive((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuActive(false);
  };

  const getFirstName = () => {
    if (!currentUser) return 'Guest';
    if (currentUser.displayName) return currentUser.displayName.split(' ')[0];
    return currentUser.email.split('@')[0];
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const CartButton = ({ style = {} }) => (
    <button
      onClick={openCart}
      className="theme-toggle-btn"
      aria-label="Open Cart"
      style={{ position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
    >
      <CartIcon />
      {count > 0 && (
        <span className="bottom-nav-badge" style={{ top: '-4px', right: '-4px' }}>
          {count}
        </span>
      )}
    </button>
  );

  const ThemeButton = ({ id }) => (
    <button onClick={toggleTheme} id={id} className="theme-toggle-btn" aria-label="Toggle Theme">
      <SunIcon />
      <MoonIcon />
    </button>
  );

  return (
    <>
      <header className={isScrolled ? 'header-scrolled' : ''}>
        <div className="container header-container">

          {/* LEFT ZONE: Brand Logo & Primary Nav */}
          <div className="header-left">
            <Link to="/" className="logo" onClick={closeMenu}>
              CRAZY<span>CLOTHS</span>
            </Link>
            <nav className="desktop-nav">
              <ul>
                <li>
                  <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                </li>
                <li>
                  <a href="/#collection" className="nav-link">Collection</a>
                </li>
                <li>
                  <a href="/#customize" className="nav-link">Customize</a>
                </li>
                <li>
                  <a href="/#how-it-works" className="nav-link">How It Works</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* RIGHT ZONE: Account & Utilities */}
          <div className="header-right">
            {/* Desktop Nav */}
            <nav className="desktop-nav">
              <ul>
                <li><CartButton /></li>
                <li><ThemeButton id="theme-toggle" /></li>
                {!currentUser ? (
                  <li>
                    <Link
                      to="/login"
                      className="btn btn-accent shimmer-btn"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.03em' }}
                    >
                      Login to Shop
                    </Link>
                  </li>
                ) : (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link
                      to="/wishlist"
                      className={`nav-link ${isActive('/wishlist')}`}
                      style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      <HeartIcon size="14px" />
                      Wishlist
                    </Link>
                    <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                      My Orders
                    </Link>
                    <span className="nav-greeting">Hi, {getFirstName()}</span>
                    <button
                      onClick={logout}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      Logout
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            {/* Mobile Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CartButton />
              <ThemeButton id="theme-toggle-mobile" />
              <button
                onClick={toggleMenu}
                className={`menu-toggle ${menuActive ? 'active' : ''}`}
                aria-label="Toggle Menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <nav className={`mobile-drawer ${menuActive ? 'active' : ''}`}>
        <ul>
          <li>
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <a href="/#collection" className="nav-link" onClick={closeMenu}>Collection</a>
          </li>
          <li>
            <a href="/#customize" className="nav-link" onClick={closeMenu}>Customize</a>
          </li>
          <li>
            <a href="/#how-it-works" className="nav-link" onClick={closeMenu}>How It Works</a>
          </li>

          {!currentUser ? (
            <li>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
            </li>
          ) : (
            <li
              className="mobile-user-area"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 1.5rem', alignItems: 'center' }}
            >
              <Link
                to="/wishlist"
                className="nav-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                onClick={closeMenu}
              >
                <HeartIcon size="18px" />
                Wishlist
              </Link>
              <Link to="/orders" className="nav-link" onClick={closeMenu}>
                My Orders
              </Link>
              <span className="nav-greeting" style={{ fontSize: '1rem' }}>
                Hi, {getFirstName()}
              </span>
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="nav-link"
                style={{
                  color: 'var(--color-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  fontSize: '2.2rem',
                }}
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
