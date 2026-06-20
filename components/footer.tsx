import Link from 'next/link';

const CARE_LINKS = [
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Fabric Care', href: '/care' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Returns & Exchanges', href: '/returns' },
];

const CONTACT_LINKS = [
  { label: 'hello@staple.co', href: 'mailto:hello@staple.co' },
  { label: 'Instagram', href: 'https://instagram.com', external: true },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone bg-stone-light mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand blurb */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <Link
              href="/"
              className="font-display text-2xl tracking-tightest text-ink hover:text-accent transition-colors duration-200 w-fit"
              aria-label="Staple — home"
            >
              Staple
            </Link>
            <p className="text-sm text-stone-dark leading-relaxed max-w-xs">
              Quality basics made to last. No logo, no noise — just fabric, fit, and finish done
              right. Made in small batches across Portugal, Japan, and the USA.
            </p>
          </div>

          {/* Care & Info */}
          <div className="flex flex-col gap-4">
            <span className="label-eyebrow">Care & Info</span>
            <ul className="flex flex-col gap-2.5" role="list">
              {CARE_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-stone-dark hover:text-ink transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <span className="label-eyebrow">Contact</span>
            <ul className="flex flex-col gap-2.5" role="list">
              {CONTACT_LINKS.map(({ label, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="font-sans text-sm text-stone-dark hover:text-ink transition-colors duration-200"
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-stone flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="font-mono text-xs text-stone-dark">
            &copy; {year} Staple. All rights reserved.
          </p>
          <p className="font-mono text-xs text-stone-dark">Made slowly. Made well.</p>
        </div>
      </div>
    </footer>
  );
}
