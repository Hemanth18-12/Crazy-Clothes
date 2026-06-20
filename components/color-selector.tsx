'use client';

import type { ProductColor } from '@/lib/products';

type ColorSelectorProps = {
  colors: ProductColor[];
  /** Currently selected colour hex value. */
  selected: string | null;
  /** Called with the hex of the chosen colour. */
  onChange: (hex: string) => void;
};

export default function ColorSelector({ colors, selected, onChange }: ColorSelectorProps) {
  return (
    <div role="group" aria-label="Select a colour">
      {/* Selected label */}
      <p className="font-mono text-xs text-stone-dark mb-3">
        <span className="uppercase tracking-eyebrow">Colour</span>
        {selected && (
          <span className="ml-2 text-ink">— {colors.find((c) => c.hex === selected)?.name}</span>
        )}
      </p>

      {/* Swatch row */}
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const isSelected = selected === color.hex;
          const isLight = isLightColor(color.hex);

          return (
            <button
              key={color.hex}
              type="button"
              aria-label={`${color.name}${isSelected ? ' (selected)' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onChange(color.hex)}
              className={[
                'w-8 h-8 rounded-full transition-all duration-150 cursor-pointer',
                // Border ring to show selection
                isSelected
                  ? 'ring-2 ring-offset-2 ring-ink ring-offset-paper'
                  : 'ring-1 ring-stone hover:ring-stone-dark hover:ring-offset-1 hover:ring-offset-paper',
                // Thin inner border for light swatches so they're visible on paper bg
                isLight ? 'border border-stone/60' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ backgroundColor: color.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Returns true if a hex colour is perceptually light (luminance > 0.5).
 * Used to add a visible border on swatches that would otherwise vanish
 * against the paper background.
 */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance (simplified)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}
