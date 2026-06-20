'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/products';

export default function CartPage() {
  const { items, isHydrated, updateQuantity, removeItem, subtotal, cartCount } = useCart();

  return (
    <>
      <main className="min-h-screen py-12 md:py-20 lg:py-28">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="border-b border-stone pb-6 mb-8 flex justify-between items-baseline">
            <h1 className="font-display text-3xl text-ink">Your Bag</h1>
            <span className="font-mono text-sm text-stone-dark">
              ({isHydrated ? cartCount : 0} item{cartCount !== 1 ? 's' : ''})
            </span>
          </div>

          {!isHydrated ? (
            // Hydration Skeleton Loader
            <div className="py-20 flex justify-center items-center">
              <span className="font-mono text-xs text-stone-dark animate-pulse">
                Loading bag...
              </span>
            </div>
          ) : items.length === 0 ? (
            // Empty State
            <div className="py-16 md:py-24 text-center max-w-md mx-auto space-y-6">
              <span className="label-eyebrow">Empty bag</span>
              <p className="text-base text-stone-dark">
                You haven&apos;t added any products to your bag yet. Let&apos;s find something basic
                and well-made.
              </p>
              <div className="pt-4">
                <Link href="/" className="btn-primary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            // Cart Layout (Split Grid)
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              {/* Product Rows */}
              <div className="lg:col-span-8 space-y-8">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-6 pb-8 border-b border-stone/50 last:border-b-0 last:pb-0"
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative w-24 h-32 bg-stone-light shrink-0 border border-stone/30"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Details Panel */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-display text-lg text-ink font-normal leading-snug">
                            <Link
                              href={`/products/${item.slug}`}
                              className="hover:text-accent transition-colors"
                            >
                              {item.name}
                            </Link>
                          </h3>
                          <span className="font-mono text-sm text-ink shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-stone-dark">
                          Size: {item.size} · Color: {item.color}
                        </p>
                      </div>

                      {/* Stepper controls & remove row */}
                      <div className="flex justify-between items-center mt-6">
                        <div className="flex items-center border border-stone">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="px-3 py-1.5 text-stone-dark hover:text-ink transition-colors duration-150 font-mono text-xs cursor-pointer"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            —
                          </button>
                          <span
                            className="px-3 font-mono text-xs text-ink min-w-[24px] text-center"
                            aria-label={`Quantity: ${item.quantity}`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="px-3 py-1.5 text-stone-dark hover:text-ink transition-colors duration-150 font-mono text-xs cursor-pointer"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>

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

              {/* Order Summary sidebar */}
              <div className="lg:col-span-4 bg-stone-light p-6 md:p-8 border border-stone/50 space-y-6">
                <h2 className="font-display text-xl text-ink pb-4 border-b border-stone">
                  Summary
                </h2>

                <div className="space-y-3 font-mono text-xs text-stone-dark">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-ink">Complimentary</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span className="text-ink">—</span>
                  </div>
                  <div className="flex justify-between border-t border-stone/40 pt-4 font-sans text-sm font-semibold text-ink">
                    <span>Total</span>
                    <span className="font-mono text-base">{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => {
                      console.log('[Staple] Standalone checkout initiated.');
                      alert('Checkout integration (Stripe) happens in the next phase.');
                    }}
                    className="btn-primary w-full"
                  >
                    Proceed to Checkout
                  </button>
                  <Link href="/" className="btn-secondary w-full text-center block">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
