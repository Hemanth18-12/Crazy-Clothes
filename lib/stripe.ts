/**
 * Stripe SDK singleton — SERVER ONLY.
 * Never import this file from a client component ('use client').
 * The secret key must never be exposed to the browser.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;

if (!key && process.env.NODE_ENV === 'development') {
  throw new Error(
    '[Staple] STRIPE_SECRET_KEY is not set.\n' +
      'Add it to .env.local:\n\n' +
      '  STRIPE_SECRET_KEY=sk_test_...\n'
  );
}

const stripe = new Stripe(key as string, {
  apiVersion: '2026-05-27.dahlia',
});

export default stripe;
