import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductDetailClient } from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true, category: true },
  });

  if (!product) notFound();

  return <ProductDetailClient product={product} locale={locale} />;
}