/**
 * ============================================================
 * PRODUCT DATA — MIGRATION PATH NOTICE
 * ============================================================
 *
 * The `PRODUCTS` array below is a static placeholder used during
 * early development. It is intentionally simple and lives here
 * so the rest of the codebase has a stable, predictable shape
 * to build against.
 *
 * When the team is ready to connect a real data source, this file
 * is the ONLY place that needs to change. Swap the static array
 * for API calls to a CMS (e.g. Sanity, Contentful), a headless
 * commerce platform (e.g. Shopify Storefront API), or a database
 * (e.g. Postgres via Prisma) inside `getProductBySlug` and
 * `getAllProducts`.
 *
 * Calling code (UI components, pages, route handlers) should
 * ALWAYS go through these two functions — never import `PRODUCTS`
 * directly. That contract is what makes the migration seamless.
 *
 * Similarly, `formatPrice` is the single canonical place for
 * price formatting. No component should convert cents to a
 * display string independently.
 * ============================================================
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * Constrained union of allowed garment sizes.
 * Invalid sizes are caught at compile time — never free-form strings.
 */
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

/** A single colour option for a product. */
export type ProductColor = {
  name: string;
  /** CSS-compatible hex value, e.g. "#1a1a1a" */
  hex: string;
};

/** Garment fit style. Extend this union if new cuts are added. */
export type ProductFit = 'Regular' | 'Boxy' | 'Relaxed' | 'Slim';

/**
 * Core product interface.
 *
 * `price` is stored in **integer cents** to eliminate floating-point
 * rounding errors in checkout arithmetic. Use `formatPrice()` to
 * convert to a display string.
 */
export type Product = {
  /** Unique, URL-safe identifier — used in route paths (/products/[slug]). */
  slug: string;
  name: string;
  /** Price in integer cents. Always positive. e.g. 3800 = $38.00 */
  price: number;
  description: string;
  /** e.g. "100% Combed Organic Cotton" */
  fabricComposition: string;
  /** Weight in grams per square metre. */
  fabricWeightGsm: number;
  fit: ProductFit;
  /** Country of manufacture. */
  madeIn: string;
  /** At least one colour is required. */
  colors: [ProductColor, ...ProductColor[]];
  /** At least one size is required. */
  sizes: [ProductSize, ...ProductSize[]];
  /** Path relative to /public, e.g. "/images/classic-crewneck-tee.png" */
  image: string;
};

// ---------------------------------------------------------------------------
// Static catalog (placeholder — see migration note at the top)
// ---------------------------------------------------------------------------

const PRODUCTS: Product[] = [
  {
    slug: 'classic-crewneck-tee',
    name: 'Classic Crewneck Tee',
    price: 3800,
    description:
      'The Staple Classic is the tee you reach for every morning without thinking. Cut from 180 GSM combed organic cotton grown in the Aegean region and knitted tight to hold its shape wash after wash. The ribbed crewneck lies flat without curling; the side seams keep everything in place. This is not a statement piece — it is the foundation every wardrobe quietly depends on.',
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
  },
  {
    slug: 'boxy-heavyweight-tee',
    name: 'Boxy Heavyweight Tee',
    price: 4500,
    description:
      'Built for those who want their basics to make a quiet statement, the Heavyweight Boxy sits wider at the chest and drops lower than a standard cut. At 240 GSM, the fabric has the satisfying weight of a garment that will outlive trends. Worn tucked, half-tucked, or left to fall — it looks deliberate either way. Washed to a matte finish before it ships so it arrives pre-broken-in.',
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
    description:
      'Japanese slub yarn gives this tee its quiet depth — the fabric is uniform in weight but carries a fine natural irregularity that catches light differently at every angle. At 160 GSM it is the lightest piece in the Staple range, designed for warm weather without sacrificing the structure that cheap basics lack. Each shirt is slightly unique. That is not a flaw.',
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
    description:
      'The Pocket Tee takes the silhouette down a notch in tension without losing its clean line. Shoulders drop slightly; the chest sits easy. The single left-chest pocket is functional — not decorative — sized for a card, a folded note, or nothing at all. Cut from a mid-weight American Supima cotton with a soft hand that stays true to colour after years of washing.',
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

// ---------------------------------------------------------------------------
// Data integrity validation (runs in development only)
// ---------------------------------------------------------------------------

function validateCatalog(products: Product[]): void {
  if (process.env.NODE_ENV === 'production') return;

  const slugsSeen = new Set<string>();

  for (const product of products) {
    // Slug uniqueness
    if (slugsSeen.has(product.slug)) {
      throw new Error(
        `[Staple] Duplicate product slug detected: "${product.slug}". Every product must have a unique slug.`
      );
    }
    slugsSeen.add(product.slug);

    // Price must be a positive integer
    if (!Number.isInteger(product.price) || product.price <= 0) {
      throw new Error(
        `[Staple] Product "${product.slug}" has an invalid price: ${product.price}. Price must be a positive integer (cents).`
      );
    }

    // At least one colour
    if (product.colors.length === 0) {
      throw new Error(
        `[Staple] Product "${product.slug}" must have at least one colour option.`
      );
    }

    // At least one size
    if (product.sizes.length === 0) {
      throw new Error(
        `[Staple] Product "${product.slug}" must have at least one size option.`
      );
    }
  }
}

// Run validation immediately when the module is loaded in development
validateCatalog(PRODUCTS);

// ---------------------------------------------------------------------------
// Data access functions
// — These are the seam where a future DB/CMS swap will happen.
// — All calling code must use these functions, not the PRODUCTS array.
// ---------------------------------------------------------------------------

/**
 * Returns a single product by its slug, or `undefined` if not found.
 * Async signature mirrors what a real database call would look like.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Returns the full product catalog.
 * Async signature mirrors what a real database call would look like.
 */
export async function getAllProducts(): Promise<Product[]> {
  return PRODUCTS;
}

// ---------------------------------------------------------------------------
// Price formatting utility
// — The ONLY place that converts cents to a display string.
// — No component or page should format prices independently.
// ---------------------------------------------------------------------------

/**
 * Converts an integer cent value to a localised USD display string.
 *
 * @example formatPrice(3800) // → "$38.00"
 * @example formatPrice(4500) // → "$45.00"
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
