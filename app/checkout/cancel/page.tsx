import Link from 'next/link';

// Static server component — cart is NOT cleared here.
// The user cancelled; their bag should remain fully intact.

export const metadata = {
  title: 'Order Cancelled — Staple',
  description: 'Your order was not completed. No charge was made.',
};

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* X icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-stone-light border border-stone flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-dark"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <span className="label-eyebrow">Payment Cancelled</span>
          <h1 className="font-display text-3xl text-ink">No charge was made.</h1>
          <p className="font-sans text-sm text-stone-dark leading-relaxed">
            You cancelled before completing payment. Your bag is still intact — nothing has been
            removed. Take your time; we&apos;ll be here.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/cart" className="btn-primary">
            Return to Bag
          </Link>
          <Link href="/" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
