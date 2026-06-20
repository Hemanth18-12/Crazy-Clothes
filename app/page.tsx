'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/product-card';
import ColorSelector from '@/components/color-selector';
import SizeSelector from '@/components/size-selector';
import type { Product, ProductSize } from '@/lib/products';

// Sample product for interactive selectors demo
const DEMO_PRODUCT: Product = {
  slug: 'classic-crewneck-tee',
  name: 'Classic Crewneck Tee',
  price: 3800,
  description: 'The foundation every wardrobe quietly depends on.',
  fabricComposition: '100% Combed Organic Cotton',
  fabricWeightGsm: 180,
  fit: 'Regular',
  madeIn: 'Portugal',
  colors: [
    { name: 'Paper White', hex: '#FAF9F6' },
    { name: 'Ink Black', hex: '#121212' },
    { name: 'Slate Blue', hex: '#7B8FA1' },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  image: '/images/classic-crewneck-tee.png',
};

const ALL_DEMO_PRODUCTS: Product[] = [
  DEMO_PRODUCT,
  {
    slug: 'boxy-heavyweight-tee',
    name: 'Boxy Heavyweight Tee',
    price: 4500,
    description: 'Washed to a matte finish before it ships so it arrives pre-broken-in.',
    fabricComposition: '100% Ringspun Cotton (Enzyme Washed)',
    fabricWeightGsm: 240,
    fit: 'Boxy',
    madeIn: 'Portugal',
    colors: [
      { name: 'Washed Black', hex: '#2A2A2A' },
      { name: 'Clay', hex: '#A66E5E' },
      { name: 'Washed Ecru', hex: '#EDE8DF' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: '/images/boxy-heavyweight-tee.png',
  },
  {
    slug: 'textured-slub-tee',
    name: 'Textured Slub Tee',
    price: 4200,
    description: 'Each shirt is slightly unique. That is not a flaw.',
    fabricComposition: '100% Japanese Slub Cotton',
    fabricWeightGsm: 160,
    fit: 'Regular',
    madeIn: 'Japan',
    colors: [
      { name: 'Natural Stone', hex: '#C8BEA9' },
      { name: 'Dusk', hex: '#8D8B7C' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/images/textured-slub-tee.png',
  },
  {
    slug: 'relaxed-pocket-tee',
    name: 'Relaxed Pocket Tee',
    price: 4000,
    description: 'The single left-chest pocket is functional — not decorative.',
    fabricComposition: '100% Supima Cotton',
    fabricWeightGsm: 200,
    fit: 'Relaxed',
    madeIn: 'USA',
    colors: [
      { name: 'Olive', hex: '#6B6B4E' },
      { name: 'Bone', hex: '#E8E3D9' },
      { name: 'Ink Black', hex: '#121212' },
      { name: 'Warm Grey', hex: '#9E9890' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    image: '/images/relaxed-pocket-tee.png',
  },
];

export default function ComponentShowcase() {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);

  function handleAddToCart() {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setShowSizeError(false);
    alert(`Added to cart — Size: ${selectedSize}, Colour: ${selectedColor ?? 'none'}`);
  }

  return (
    <>
      <Header cartCount={2} />

      <main className="min-h-screen">
        {/* ── Product grid ── */}
        <section className="py-12 md:py-20 lg:py-28 border-b border-stone">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <span className="label-eyebrow">Component QA — Product Cards</span>
            <h2 className="mt-2 mb-8 font-display">The Collection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {ALL_DEMO_PRODUCTS.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Selectors ── */}
        <section className="py-12 md:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <span className="label-eyebrow">Component QA — Selectors</span>
            <h2 className="mt-2 mb-10 font-display">{DEMO_PRODUCT.name}</h2>

            <div className="max-w-md flex flex-col gap-8">
              <ColorSelector
                colors={DEMO_PRODUCT.colors}
                selected={selectedColor}
                onChange={setSelectedColor}
              />
              <SizeSelector
                sizes={DEMO_PRODUCT.sizes}
                selected={selectedSize}
                onChange={(s) => {
                  setSelectedSize(s);
                  setShowSizeError(false);
                }}
                showError={showSizeError}
              />
              <button className="btn-primary w-full" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="btn-secondary w-full">Save for Later</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
