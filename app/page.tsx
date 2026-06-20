import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen py-12 md:py-20 lg:py-28">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl space-y-16">
        {/* Header */}
        <header className="border-b border-stone pb-8">
          <span className="label-eyebrow">Design System Showcase</span>
          <h1 className="mt-2 font-display">Staple Visual Foundation</h1>
          <p className="mt-4 text-lg max-w-2xl">
            This page demonstrates the core tokens, colors, typography, and reusable primitives that
            define the Staple aesthetic. Understated, quality-focused, and accessible.
          </p>
        </header>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="font-display">1. Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Paper */}
            <div className="border border-stone p-4 bg-paper rounded flex flex-col justify-between h-32">
              <span className="font-sans font-medium text-ink">Paper</span>
              <span className="font-mono text-xs text-stone-dark">#FAF9F6</span>
            </div>
            {/* Ink */}
            <div className="border border-stone p-4 bg-ink rounded flex flex-col justify-between h-32 text-paper">
              <span className="font-sans font-medium text-paper">Ink</span>
              <span className="font-mono text-xs opacity-80">#121212</span>
            </div>
            {/* Accent */}
            <div className="border border-stone p-4 bg-accent rounded flex flex-col justify-between h-32 text-paper">
              <span className="font-sans font-medium">Accent</span>
              <span className="font-mono text-xs opacity-80">#A66E5E</span>
            </div>
            {/* Stone Range */}
            <div className="border border-stone p-4 bg-stone-light rounded flex flex-col justify-between h-32">
              <span className="font-sans font-medium text-ink">Stone Range</span>
              <div className="flex flex-col font-mono text-[10px] text-stone-dark gap-1">
                <span>Light: #F3F2EE</span>
                <span>Default: #E2DFD8</span>
                <span>Dark: #7D796F</span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="font-display">2. Typography</h2>
          <div className="border border-stone/50 bg-stone-light/30 p-6 rounded space-y-8">
            <div className="space-y-2">
              <span className="font-mono text-xs text-stone-dark block mb-1">
                Display Font (Cormorant Garamond)
              </span>
              <h1 className="font-display">Understated Luxury Basics</h1>
              <p className="font-display text-2xl italic">The art of fine details.</p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs text-stone-dark block mb-1">
                Body Font (Inter)
              </span>
              <p className="font-sans text-base">
                Our clean, highly legible body copy. Designed to be easy to read at any scale,
                optimizing comfort and flow for customers reading specifications, guides, and store
                documentation.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs text-stone-dark block mb-1">
                Mono / Utility Font (JetBrains Mono)
              </span>
              <p className="font-mono text-sm tracking-wide">
                Price: $48.00 USD | Stock: 120 | SKU: STPL-TEE-001
              </p>
            </div>
          </div>
        </section>

        {/* Style Primitives */}
        <section className="space-y-6">
          <h2 className="font-display">3. Reusable Style Primitives</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Buttons & Labels */}
            <div className="space-y-6 flex flex-col justify-start">
              <div>
                <span className="font-mono text-xs text-stone-dark block mb-2">Primary Button</span>
                <button className="btn-primary w-full sm:w-auto">Add to Cart</button>
              </div>
              <div>
                <span className="font-mono text-xs text-stone-dark block mb-2">
                  Secondary Button
                </span>
                <button className="btn-secondary w-full sm:w-auto">Select Size</button>
              </div>
              <div>
                <span className="font-mono text-xs text-stone-dark block mb-2">Eyebrow Label</span>
                <span className="label-eyebrow">100% Organic Egyptian Cotton</span>
              </div>
            </div>

            {/* Signature Element */}
            <div>
              <span className="font-mono text-xs text-stone-dark block mb-2">
                Signature Garment Spec Tag
              </span>
              <div className="spec-tag">
                <div className="spec-tag-heading">
                  <span>Garment Spec</span>
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-sans">
                    Staple Core
                  </span>
                </div>
                <div className="spec-tag-row">
                  <span>Material</span>
                  <span className="text-ink">100% Combed Cotton</span>
                </div>
                <div className="spec-tag-row">
                  <span>Weight</span>
                  <span className="text-ink">220 GSM (Heavyweight)</span>
                </div>
                <div className="spec-tag-row">
                  <span>Weave</span>
                  <span className="text-ink">Tight-Knit Jersey</span>
                </div>
                <div className="spec-tag-row">
                  <span>Care</span>
                  <span className="text-ink">Wash Cold, Hang Dry</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
