'use client';

import { useState } from 'react';
import { useCart } from '@/context/cart-context';

type CheckoutButtonProps = {
  className?: string;
  label?: string;
};

export default function CheckoutButton({
  className = 'btn-primary w-full',
  label = 'Checkout',
}: CheckoutButtonProps) {
  const { items } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (items.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Only send slug, color, size, quantity — NEVER price
          items: items.map(({ slug, color, size, quantity }) => ({
            slug,
            color,
            size,
            quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      if (data.url) {
        // Hard redirect to Stripe-hosted checkout page
        window.location.href = data.url;
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading || items.length === 0}
        className={`${className} disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        aria-busy={loading}
        aria-label={loading ? 'Redirecting to checkout…' : label}
      >
        {loading ? (
          <>
            {/* Minimal spinner */}
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Redirecting…
          </>
        ) : (
          label
        )}
      </button>

      {/* Inline error — cart stays intact, no redirect on failure */}
      {error && (
        <p role="alert" className="font-mono text-[11px] text-accent leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}
