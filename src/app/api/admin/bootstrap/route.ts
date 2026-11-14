import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { getSiteSettings } from '@/lib/settings';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';
import { getCachedEcomTarifs } from '@/lib/ecom';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [orders, products, categories, dbWilayas, settings, promos, liveTarifs] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true, variant: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true, category: true },
    }),
    prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.wilayaShipping.findMany({ orderBy: { code: 'asc' } }),
    getSiteSettings(),
    prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } }),
    getCachedEcomTarifs(),
  ]);

  const dbMap = new Map(dbWilayas.map((w) => [w.code, w]));
  const wilayas = ALGERIA_WILAYAS.map((w) => {
    const db = dbMap.get(w.code);
    const live = liveTarifs?.byWilaya[w.code];
    const useCustom = Boolean(db?.customOverride);
    return {
      code: w.code,
      nameFr: db?.nameFr || w.nameFr,
      nameAr: db?.nameAr || w.nameAr,
      homeDeliveryDzd: useCustom ? db!.homeDeliveryDzd : (live && live.domicile > 0 ? live.domicile : db?.homeDeliveryDzd ?? w.homeDeliveryDzd),
      stopDeskDzd: useCustom ? db!.stopDeskDzd : (live && live.stopdesk > 0 ? live.stopdesk : db?.stopDeskDzd ?? w.stopDeskDzd),
      delay: db?.delay || w.delay,
      isActive: db?.isActive ?? true,
    };
  });

  return NextResponse.json({ orders, products, categories, wilayas, settings, promos });
}