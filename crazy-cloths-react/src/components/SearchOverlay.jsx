import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import "../css/search.css";

const SearchIcon = () => (
  <svg className="cc-search-icon" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(false);
  const inputRef = useRef(null);
  const { catalogProducts, customizableProducts } = useProducts();
  const navigate = useNavigate();

  /* Animate open/close */
  useEffect(() => {
    if (isOpen) {
      setActive(false);
      const t = requestAnimationFrame(() => setActive(true));
      setTimeout(() => inputRef.current?.focus(), 180);
      return () => cancelAnimationFrame(t);
    } else {
      setActive(false);
      const t = setTimeout(() => {
        setQuery("");
        setResults([]);
      }, 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* Debounced search */
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    const timer = setTimeout(() => {
      const all = [
        ...(catalogProducts || []),
        ...(customizableProducts || []),
      ];
      const seen = new Set();
      const filtered = all.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        const name = (p.name || p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const type = (p.type || p.category || "").toLowerCase();
        return name.includes(q) || desc.includes(q) || type.includes(q);
      });
      setResults(filtered.slice(0, 8));
    }, 220);
    return () => clearTimeout(timer);
  }, [query, catalogProducts, customizableProducts]);

  /* Keyboard: Escape closes */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSelect = useCallback((product) => {
    navigate(`/product/${product.id}`);
    onClose();
  }, [navigate, onClose]);

  if (!isOpen && !active) return null;

  return (
    <div className={`cc-search-overlay ${active ? "open" : ""}`} aria-modal="true" role="dialog">
      <div className="cc-search-backdrop" onClick={onClose} />
      <div className="cc-search-panel">
        {/* Search bar */}
        <div className="cc-search-bar">
          <SearchIcon />
          <input
            ref={inputRef}
            className="cc-search-input"
            type="search"
            placeholder="Search clothes, styles, collections…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button className="cc-search-close-btn" onClick={onClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        {/* Results */}
        {query.trim() ? (
          <div className="cc-search-results">
            {results.length === 0 ? (
              <div className="cc-search-empty">
                <span className="cc-search-empty-icon">🔍</span>
                <p>No results for <strong>"{query}"</strong></p>
                <p className="cc-search-empty-hint">Try searching by name or style</p>
              </div>
            ) : (
              results.map((product) => (
                <button
                  key={product.id}
                  className="cc-search-result-item"
                  onClick={() => handleSelect(product)}
                >
                  {(product.imageUrl || product.images?.[0]) && (
                    <img
                      src={product.imageUrl || product.images?.[0]}
                      alt={product.name || product.title}
                      className="cc-search-thumb"
                    />
                  )}
                  <div className="cc-search-result-info">
                    {product.brand && (
                      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '1px' }}>
                        {product.brand}
                      </span>
                    )}
                    <span className="cc-search-result-name">{product.name || product.title}</span>
                    {product.price && (
                      <span className="cc-search-result-price">
                        ₹{typeof product.price === "number" ? product.price.toLocaleString("en-IN") : product.price}
                      </span>
                    )}
                  </div>
                  <svg className="cc-search-arrow" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="cc-search-hint">
            <p>Start typing to search the collection…</p>
            <div className="cc-search-tags">
              {["T-Shirts", "Oversized", "Custom", "Drop"].map(tag => (
                <button key={tag} className="cc-search-tag" onClick={() => setQuery(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
