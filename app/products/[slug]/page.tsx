import { notFound } from 'next/navigation';
import { getProductBySlug, getAllProducts } from '@/lib/products';
import ProductDetailsClient from '@/components/product-details-client';

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  return {
    title: `${product.name} — Staple`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
      <ProductDetailsClient product={product} />
    </div>
  );
}
