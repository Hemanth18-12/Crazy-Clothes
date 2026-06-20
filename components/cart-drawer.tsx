'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/products';

export default function CartDrawer() {
  const { items, isOpen, isHydrated, closeCart, updateQuantity, removeItem, subtotal, cartCount } =
    useCart();

  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 1. Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 2. Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // 3. Focus trapping within the drawer
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    // Get all focusable children
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = drawerRef.current.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on open
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab (Backward)
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab (Forward)
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isOpen, items]); // Re-run when items change to capture any new buttons

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-md h-full bg-paper border-l border-stone shadow-xl flex flex-col transition-transform duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone">
          <h2 id="cart-drawer-title" className="font-display text-xl text-ink">
            Your Bag ({isHydrated ? cartCount : 0})
          </h2>
          <button
            onClick={closeCart}
            className="text-stone-dark hover:text-ink transition-colors duration-200 cursor-pointer"
            aria-label="Close cart"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {!isHydrated || items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <p className="text-stone-dark">Your bag is currently empty.</p>
              <button onClick={closeCart} className="btn-secondary text-xs">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex gap-4 pb-6 border-b border-stone/50 last:border-b-0 last:pb-0"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-stone-light shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-sans text-sm font-medium text-ink truncate">
                          {item.name}
                        </h3>
                        <span className="font-mono text-sm text-ink shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-stone-dark mt-1">
                        Size: {item.size} · Color: {item.color}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      {/* Stepper qty */}
                      <div className="flex items-center border border-stone">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="px-2.5 py-1 text-stone-dark hover:text-ink transition-colors duration-150 font-mono text-xs cursor-pointer"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          —
                        </button>
                        <span
                          className="px-2 font-mono text-xs text-ink min-w-[20px] text-center"
                          aria-label={`Quantity: ${item.quantity}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2.5 py-1 text-stone-dark hover:text-ink transition-colors duration-150 font-mono text-xs cursor-pointer"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.key)}
                        className="font-mono text-[10px] uppercase tracking-wider text-stone-dark hover:text-accent transition-colors duration-150 cursor-pointer"
                        aria-label={`Remove ${item.name} from bag`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info subtotal */}
        {isHydrated && items.length > 0 && (
          <div className="border-t border-stone bg-stone-light/50 px-6 py-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-sm text-stone-dark">Subtotal</span>
              <span className="font-mono text-lg font-semibold text-ink">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="font-mono text-[10px] text-stone-dark">
              Shipping & taxes calculated at checkout.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  console.log('[Staple] Mock checkout process initiated.');
                  alert('Checkout integration (Stripe) happens in the next phase.');
                }}
                className="btn-primary w-full"
              >
                Checkout
              </button>
              <Link href="/cart" onClick={closeCart} className="btn-secondary w-full">
                View Full Bag
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
