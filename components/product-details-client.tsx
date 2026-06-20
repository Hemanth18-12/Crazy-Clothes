'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import type { Product, ProductSize } from '@/lib/products';
import { formatPrice } from '@/lib/products';
import ColorSelector from '@/components/color-selector';
import SizeSelector from '@/components/size-selector';

type ProductDetailsClientProps = {
  product: Product;
};

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addItem } = useCart();
  const [selectedColorHex, setSelectedColorHex] = useState<string>(product.colors[0].hex);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [showSizeError, setShowSizeError] = useState(false);

  // Find the selected color object to get its display name
  const selectedColor = product.colors.find((c) => c.hex === selectedColorHex) || product.colors[0];

  const handleAddToBag = () => {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }

    // Call addItem from global cart context
    addItem({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      color: selectedColor.name,
      size: selectedSize,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
      {/* ── LEFT COLUMN: Product image ── */}
      <div className="md:col-span-7 bg-stone-light border border-stone/30 aspect-[3/4] relative w-full overflow-hidden">
        <Image
          src={product.image}
          alt={`${product.name} — ${product.fit} fit, ${product.fabricWeightGsm} GSM`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover object-center"
        />
      </div>

      {/* ── RIGHT COLUMN: Meta details & selectors ── */}
      <div className="md:col-span-5 space-y-8">
        <div>
          <span className="label-eyebrow">The Catalog</span>
          <h1 className="font-display text-3xl md:text-4xl text-ink mt-2 leading-tight">
            {product.name}
          </h1>
          <span className="font-mono text-lg text-ink font-semibold mt-2 block">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="font-sans text-sm text-stone-dark leading-relaxed">{product.description}</p>

        {/* Interactive selectors */}
        <div className="space-y-6 pt-4 border-t border-stone/50">
          <ColorSelector
            colors={product.colors}
            selected={selectedColorHex}
            onChange={setSelectedColorHex}
          />

          <SizeSelector
            sizes={product.sizes}
            selected={selectedSize}
            onChange={(size) => {
              setSelectedSize(size);
              setShowSizeError(false);
            }}
            showError={showSizeError}
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleAddToBag}
            className="btn-primary w-full"
            aria-label={`Add ${product.name} to bag`}
          >
            Add to Bag
          </button>
        </div>

        {/* Spec tag (signature brand tag card) */}
        <div className="spec-tag shadow-sm mt-6">
          <h3 className="spec-tag-title">GARMENT MATRIX</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-stone/30 pb-1.5">
              <span className="text-stone-dark uppercase text-[10px]">Composition</span>
              <span className="text-ink font-medium">{product.fabricComposition}</span>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-1.5">
              <span className="text-stone-dark uppercase text-[10px]">Fabric Weight</span>
              <span className="text-ink font-medium">{product.fabricWeightGsm} GSM</span>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-1.5">
              <span className="text-stone-dark uppercase text-[10px]">Fit Type</span>
              <span className="text-ink font-medium">{product.fit} Cut</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-stone-dark uppercase text-[10px]">Origin</span>
              <span className="text-ink font-medium">Made in {product.madeIn}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
