import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/shop/HeroSection';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true, category: true },
    }),
    prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  const formatted = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleFr: p.titleFr,
    titleAr: p.titleAr,
    titleEn: p.titleEn,
    priceDzd: p.priceDzd,
    compareAtPriceDzd: p.compareAtPriceDzd,
    categoryId: p.categoryId,
    categoryNameFr: p.category?.nameFr,
    categoryNameAr: p.category?.nameAr,
    categoryNameEn: p.category?.nameEn,
    isFeatured: p.isFeatured,
    sizes: Array.from(new Set(p.variants.map((v) => v.size))),
    totalStock: p.variants.reduce((s, v) => s + v.stockQuantity, 0),
    img: p.images[0]?.url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
  }));

  return <HeroSection products={formatted} categories={categories} />;
}