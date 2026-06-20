import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/products';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { slug, name, price, fit, fabricWeightGsm, madeIn, colors, image } = product;

  return (
    <Link
      href={`/products/${slug}`}
      className="group flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      aria-label={`View ${name} — ${formatPrice(price)}`}
    >
      {/* Product image */}
      <div className="relative w-full overflow-hidden bg-stone-light aspect-[3/4]">
        <Image
          src={image}
          alt={`${name} — ${fit} fit, ${fabricWeightGsm} GSM, made in ${madeIn}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          priority={false}
        />
        {/* Colour dots overlay — bottom left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5" aria-hidden="true">
          {colors.slice(0, 4).map((color) => (
            <span
              key={color.hex}
              className="w-3 h-3 rounded-full border border-white/60 shadow-sm"
              style={{ backgroundColor: color.hex }}
            />
          ))}
          {colors.length > 4 && (
            <span className="font-mono text-[10px] text-paper/80 leading-none">
              +{colors.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-1 px-0.5">
        {/* Meta line */}
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-stone-dark leading-none">
          {fit} · {fabricWeightGsm} GSM · {madeIn}
        </p>

        {/* Name + price row */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-normal tracking-tight text-ink leading-snug group-hover:text-accent transition-colors duration-200 truncate">
            {name}
          </h3>
          <span className="font-mono text-sm text-ink shrink-0">{formatPrice(price)}</span>
        </div>
      </div>
    </Link>
  );
}
