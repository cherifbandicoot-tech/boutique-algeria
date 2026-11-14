import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/shop/HeroSection';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true },
  });

  const formatted = products.map((p) => ({
    id: p.id,
    titleFr: p.titleFr,
    titleAr: p.titleAr,
    titleEn: p.titleEn,
    priceDzd: p.priceDzd,
    sizes: Array.from(new Set(p.variants.map((v) => v.size))),
    img: p.images[0]?.url || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
  }));

  return <HeroSection products={formatted} />;
}