import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoMark from "./LogoMark";
import SearchOverlay from "./SearchOverlay";
import "../css/mobile-menu.css";

/* ── Icon helpers ── */
const SunIcon = () => (
  <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
  </svg>
);

const MoonIcon = () => (
  <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
    viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
  </svg>
);

const SearchBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="theme-toggle-btn cc-header-search-btn"
    aria-label="Open Search"
    style={{ position: "relative" }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth="2" stroke="currentColor" style={{ width: "19px", height: "19px" }}>
      <circle cx="11" cy="11" r="8"/>
      <path strokeLinecap="round" d="m21 21-4.35-4.35"/>
    </svg>
  </button>
);

const HeartIcon = ({ size = "14px" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" style={{ width: "14px", height: "14px", opacity: 0.4 }}>
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

const CloseMenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" style={{ width: "16px", height: "16px" }}>
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

export default function Header() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("cc_theme") || "dark");

  /* Scroll */
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Theme */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cc_theme", theme);
  }, [theme]);

  /* Mobile menu animation cycle */
  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true);
    } else {
      const t = setTimeout(() => setMenuVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [menuOpen]);

  /* Close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Lock body scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleTheme = () => setTheme(p => p === "dark" ? "light" : "dark");
  const isActive = (path) => location.pathname === path ? "active" : "";

  const getFirstName = () => {
    if (!currentUser) return "Guest";
    if (currentUser.displayName) return currentUser.displayName.split(" ")[0];
    return currentUser.email.split("@")[0];
  };

  const ThemeButton = ({ id }) => (
    <button onClick={toggleTheme} id={id} className="theme-toggle-btn" aria-label="Toggle Theme">
      <SunIcon />
      <MoonIcon />
    </button>
  );

  return (
    <>
      {/* ── Main Header ── */}
      <header className={isScrolled ? "header-scrolled" : ""}>
        <div className="container header-container">
          {/* LEFT: Logo + Desktop Nav */}
          <div className="header-left">
            <LogoMark onClick={() => setMenuOpen(false)} />
            <nav className="desktop-nav">
              <ul>
                <li><Link to="/" className={`nav-link ${isActive("/")}`}>Home</Link></li>
                <li><Link to="/collection" className={`nav-link ${isActive("/collection")}`}>Collection</Link></li>
                <li><Link to="/customize" className={`nav-link ${isActive("/customize")}`}>Customize</Link></li>
                <li><a href="/#how-it-works" className="nav-link">How It Works</a></li>
              </ul>
            </nav>
          </div>

          {/* RIGHT: Utilities + Account */}
          <div className="header-right">
            {/* Desktop right nav */}
            <nav className="desktop-nav">
              <ul>
                {/* Search */}
                <li><SearchBtn onClick={() => setSearchOpen(true)} /></li>
                {/* Theme */}
                <li><ThemeButton id="theme-toggle" /></li>

                {!currentUser ? (
                  <li>
                    <Link to="/login" className="btn btn-accent shimmer-btn"
                      style={{ padding: "0.5rem 1.2rem", fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                      Login to Shop
                    </Link>
                  </li>
                ) : (
                  <li style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <Link to="/wishlist" className={`nav-link ${isActive("/wishlist")}`}
                      style={{ fontSize: "0.95rem", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase" }}>
                      <HeartIcon size="14px" />Wishlist
                    </Link>
                    <Link to="/orders" className={`nav-link ${isActive("/orders")}`}>My Orders</Link>
                    <Link to="/profile" className={`nav-link ${isActive("/profile")}`}>Profile</Link>
                    <button onClick={logout}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", background: "transparent",
                        border: "1px solid var(--color-border)", cursor: "pointer",
                        color: "var(--color-text-primary)", fontFamily: "var(--font-display)",
                        textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Logout
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            {/* Mobile Controls: search + theme + hamburger (no cart) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <SearchBtn onClick={() => setSearchOpen(true)} />
              <ThemeButton id="theme-toggle-mobile" />
              <button
                onClick={() => setMenuOpen(p => !p)}
                className={`menu-toggle ${menuOpen ? "active" : ""}`}
                aria-label="Toggle Menu"
                aria-expanded={menuOpen}
              >
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Naughty Boyz style Mobile Menu ── */}
      {/* Backdrop */}
      <div
        className={`cc-mobile-menu-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      {(menuOpen || menuVisible) && (
        <nav className={`cc-mobile-menu ${menuOpen ? "open" : ""}`} aria-label="Mobile Navigation">
          {/* Header */}
          <div className="cc-mobile-menu-header">
            <div className="cc-mobile-menu-brand">
              CRAZY <span>CLOTHS</span>
            </div>
            <button className="cc-mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close Menu">
              <CloseMenuIcon />
            </button>
          </div>

          {/* Nav links */}
          <div className="cc-mobile-menu-nav">
            <Link to="/" className={`cc-mobile-menu-link ${isActive("/")}`} onClick={() => setMenuOpen(false)}>
              Home <ChevronRight />
            </Link>
            <Link to="/collection" className={`cc-mobile-menu-link ${isActive("/collection")}`} onClick={() => setMenuOpen(false)}>
              All Collection <ChevronRight />
            </Link>
            <Link to="/customize" className={`cc-mobile-menu-link ${isActive("/customize")}`} onClick={() => setMenuOpen(false)}>
              Customize <ChevronRight />
            </Link>
            <a href="/#how-it-works" className="cc-mobile-menu-link" onClick={() => setMenuOpen(false)}>
              How It Works <ChevronRight />
            </a>
            {currentUser && (
              <>
                <Link to="/profile" className={`cc-mobile-menu-link ${isActive("/profile")}`} onClick={() => setMenuOpen(false)}>
                  Profile <ChevronRight />
                </Link>
                <Link to="/wishlist" className={`cc-mobile-menu-link ${isActive("/wishlist")}`} onClick={() => setMenuOpen(false)}>
                  Wishlist <ChevronRight />
                </Link>
                <Link to="/orders" className={`cc-mobile-menu-link ${isActive("/orders")}`} onClick={() => setMenuOpen(false)}>
                  My Orders <ChevronRight />
                </Link>
              </>
            )}
          </div>

          {/* Footer account area */}
          <div className="cc-mobile-menu-footer">
            <p className="cc-mobile-menu-greeting">
              {currentUser ? `Hi, ${getFirstName()}` : "My Account"}
            </p>
            <div className="cc-mobile-menu-footer-btns">
              {!currentUser ? (
                <Link to="/login" className="cc-mobile-menu-btn cc-mobile-menu-btn--accent"
                  onClick={() => setMenuOpen(false)}>
                  <span className="cc-mobile-menu-btn-label">Sign In</span>
                  <span className="cc-mobile-menu-btn-sub">or register</span>
                </Link>
              ) : (
                <>
                  <button className="cc-mobile-menu-btn" onClick={() => { logout(); setMenuOpen(false); }}>
                    <span className="cc-mobile-menu-btn-label">Logout</span>
                    <span className="cc-mobile-menu-btn-sub">Sign out</span>
                  </button>
                  <button className="cc-mobile-menu-btn" onClick={toggleTheme}>
                    <span className="cc-mobile-menu-btn-label">Theme</span>
                    <span className="cc-mobile-menu-btn-sub">{theme === "dark" ? "Switch Light" : "Switch Dark"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ── Search Overlay ── */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
