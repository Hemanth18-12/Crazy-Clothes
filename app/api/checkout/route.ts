import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { getProductBySlug } from '@/lib/products';

// Shape of each item sent from the client cart
type ClientCartItem = {
  slug: string;
  color: string;
  size: string;
  quantity: number;
  // NOTE: price is intentionally NOT accepted from the client.
  // We always look it up server-side via getProductBySlug().
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: ClientCartItem[] = body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;

    // Build Stripe line_items with SERVER-VERIFIED prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      // Security: look up the real price — never trust the client
      const product = await getProductBySlug(item.slug);

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.slug}` }, { status: 400 });
      }

      // Build absolute image URL for Stripe (requires https in production)
      const imageUrl = product.image.startsWith('http')
        ? product.image
        : `${BASE_URL}${product.image}`;

      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          // unit_amount is our server-verified price in cents
          unit_amount: product.price,
          product_data: {
            name: `${product.name} — ${item.color} / Size ${item.size}`,
            images: [imageUrl],
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'IN', 'AU', 'CA'],
      },
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log internally but never leak SDK error details to the client
    console.error('[Staple] Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Unable to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
