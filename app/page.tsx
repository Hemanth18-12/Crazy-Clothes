import Link from 'next/link';
import ProductCard from '@/components/product-card';
import { getAllProducts } from '@/lib/products';

export const metadata = {
  title: 'Staple — Essential Organic T-Shirts',
  description:
    'Understated, premium organic cotton tees built for comfort, shape retention, and longevity.',
};

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="relative py-20 md:py-28 lg:py-36 border-b border-stone bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Hero text */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <span className="label-eyebrow">The Fundamentals of Sourcing</span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ink leading-tight">
                We build the foundation of your wardrobe.
              </h1>
              <p className="font-sans text-base md:text-lg text-stone-dark max-w-xl leading-relaxed">
                Understated, high-quality t-shirts built for longevity. We believe a garment should
                retain its shape, feel premium against the skin, and speak quietly. No logos, no
                loud prints.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="#collection" className="btn-primary">
                  Explore Collection
                </Link>
                <Link href="/about" className="btn-secondary">
                  Our Philosophy
                </Link>
              </div>
            </div>

            {/* Spec Tag (Signature brand tag widget) */}
            <div
              id="care"
              className="lg:col-span-5 flex justify-center lg:justify-end scroll-mt-24"
            >
              <div className="spec-tag w-full max-w-[340px] shadow-sm">
                <h3 className="spec-tag-title">GARMENT SPECIFICATION</h3>
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-stone-dark block uppercase tracking-wider text-[10px]">
                      Material Sourcing
                    </span>
                    <span className="text-ink font-medium">100% Organic Long-Staple Cotton</span>
                  </div>
                  <div>
                    <span className="text-stone-dark block uppercase tracking-wider text-[10px]">
                      Fabric Weight
                    </span>
                    <span className="text-ink font-medium">
                      180 GSM (Classic) / 240 GSM (Heavy)
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-dark block uppercase tracking-wider text-[10px]">
                      Fit Profile
                    </span>
                    <span className="text-ink font-medium">Pre-shrunk, tailored silhouettes</span>
                  </div>
                  <div>
                    <span className="text-stone-dark block uppercase tracking-wider text-[10px]">
                      Origin Certification
                    </span>
                    <span className="text-ink font-medium">Portugal & Japan (GOTS Certified)</span>
                  </div>
                  <div className="border-t border-stone pt-3 mt-4 text-[10px] text-stone-dark leading-relaxed">
                    This directive ensures that each garment holds its seams, resists pilling, and
                    matures naturally with wear.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <section id="collection" className="py-16 md:py-24 border-b border-stone scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="label-eyebrow">The Catalog</span>
              <h2 className="font-display text-3xl text-ink mt-2">The Basics Collection</h2>
            </div>
            <p className="font-mono text-xs text-stone-dark md:max-w-xs leading-relaxed">
              Consolidated selection of essential cuts. Every knit is custom-made.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY/TRUST SECTION ── */}
      <section id="about" className="py-16 md:py-24 bg-stone-light/40 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="label-eyebrow">Quality Pillars</span>
            <h2 className="font-display text-3xl text-ink mt-2">
              Garments designed for daily wear.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">
                01. Custom Knit Textiles
              </h3>
              <p className="font-sans text-sm text-stone-dark leading-relaxed">
                We do not source off-the-shelf fabrics. Our cotton is custom-knitted in small
                batches to achieve perfect drape, breathability, and weight balance.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">
                02. Iterated Silhouettes
              </h3>
              <p className="font-sans text-sm text-stone-dark leading-relaxed">
                We believe fits shouldn&apos;t be standard. Our patterns are iteratively revised in
                millimeters to refine shoulder lines, neck ribbing, and body length.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">
                03. Manufacturing Seams
              </h3>
              <p className="font-sans text-sm text-stone-dark leading-relaxed">
                Every hem is double-needle stitched. Internal seams are bound or overlocked to
                withstand hundreds of machine cycles without bursting.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
