'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  // Clear the cart once on mount — the order is complete
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Checkmark icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-stone-light border border-stone flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <span className="label-eyebrow">Order Confirmed</span>
          <h1 className="font-display text-3xl text-ink">Your order is on its way.</h1>
          <p className="font-sans text-sm text-stone-dark leading-relaxed">
            We&apos;ve received your order and sent a confirmation to your email. Your garments will
            be carefully packed and dispatched within 2–3 business days.
          </p>
        </div>

        <div className="spec-tag text-left shadow-sm">
          <h3 className="spec-tag-title">WHAT HAPPENS NEXT</h3>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-stone-dark block uppercase text-[10px]">Step 01</span>
              <span className="text-ink">Order confirmation email sent</span>
            </div>
            <div>
              <span className="text-stone-dark block uppercase text-[10px]">Step 02</span>
              <span className="text-ink">Garments inspected & packed (1–2 days)</span>
            </div>
            <div>
              <span className="text-stone-dark block uppercase text-[10px]">Step 03</span>
              <span className="text-ink">Dispatched with tracking number</span>
            </div>
          </div>
        </div>

        <Link href="/" className="btn-secondary inline-block">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
