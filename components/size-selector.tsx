'use client';

import type { ProductSize } from '@/lib/products';

type SizeSelectorProps = {
  sizes: ProductSize[];
  /** Currently selected size, or null if none selected. */
  selected: ProductSize | null;
  /** Called with the chosen size value. */
  onChange: (size: ProductSize) => void;
  /** When true, shows a "Please select a size" error message. */
  showError?: boolean;
};

export default function SizeSelector({
  sizes,
  selected,
  onChange,
  showError = false,
}: SizeSelectorProps) {
  return (
    <div role="group" aria-label="Select a size">
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs uppercase tracking-eyebrow text-stone-dark">Size</p>
        <a
          href="/size-guide"
          className="font-mono text-xs text-stone-dark underline underline-offset-2 hover:text-ink transition-colors duration-200"
        >
          Size guide
        </a>
      </div>

      {/* Size buttons */}
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selected === size;

          return (
            <button
              key={size}
              type="button"
              aria-label={`Size ${size}${isSelected ? ' (selected)' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onChange(size)}
              className={[
                // Base styles
                'min-w-[3rem] h-10 px-3 font-mono text-xs uppercase tracking-wide',
                'border transition-colors duration-150 cursor-pointer',
                // Selected state
                isSelected
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-ink border-stone hover:border-ink hover:bg-stone-light',
              ].join(' ')}
            >
              {size}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {showError && (
        <p role="alert" aria-live="polite" className="mt-2.5 font-mono text-xs text-accent">
          Please select a size before adding to cart.
        </p>
      )}
    </div>
  );
}
