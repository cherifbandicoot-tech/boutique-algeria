import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';
import { getCachedEcomTarifs } from '@/lib/ecom';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbRows = await prisma.wilayaShipping.findMany({ orderBy: { code: 'asc' } });
  const dbMap = new Map(dbRows.map((w) => [w.code, w]));

  const wilayas = ALGERIA_WILAYAS.map((w) => {
    const db = dbMap.get(w.code);
    return {
      code: w.code,
      nameFr: db?.nameFr || w.nameFr,
      nameAr: db?.nameAr || w.nameAr,
      homeDeliveryDzd: db?.homeDeliveryDzd ?? w.homeDeliveryDzd,
      stopDeskDzd: db?.stopDeskDzd ?? w.stopDeskDzd,
      delay: db?.delay || w.delay,
      isActive: db?.isActive ?? true,
    };
  });
  return NextResponse.json({ wilayas });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.code) return NextResponse.json({ error: 'Code wilaya requis' }, { status: 400 });

  const def = ALGERIA_WILAYAS.find((w) => w.code === Number(body.code));
  if (!def) return NextResponse.json({ error: 'Wilaya invalide' }, { status: 404 });

  const updated = await prisma.wilayaShipping.upsert({
    where: { code: def.code },
    update: {
      homeDeliveryDzd: Number(body.homeDeliveryDzd ?? def.homeDeliveryDzd),
      stopDeskDzd: Number(body.stopDeskDzd ?? def.stopDeskDzd),
      delay: String(body.delay || def.delay),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    },
    create: {
      code: def.code,
      nameFr: def.nameFr,
      nameAr: def.nameAr,
      homeDeliveryDzd: Number(body.homeDeliveryDzd ?? def.homeDeliveryDzd),
      stopDeskDzd: Number(body.stopDeskDzd ?? def.stopDeskDzd),
      delay: String(body.delay || def.delay),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    },
  });

  return NextResponse.json({ wilaya: updated });
}

export async function POST() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tarifs = await getCachedEcomTarifs(true);
  if (!tarifs) {
    return NextResponse.json(
      { error: 'Impossible de récupérer les tarifs E-com Delivery (/tarifs)' },
      { status: 502 }
    );
  }

  let updatedCount = 0;
  for (const w of ALGERIA_WILAYAS) {
    const t = tarifs.byWilaya[w.code];
    if (t) {
      await prisma.wilayaShipping.upsert({
        where: { code: w.code },
        update: {
          homeDeliveryDzd: t.domicile > 0 ? t.domicile : w.homeDeliveryDzd,
          stopDeskDzd: t.stopdesk > 0 ? t.stopdesk : w.stopDeskDzd,
        },
        create: {
          code: w.code,
          nameFr: w.nameFr,
          nameAr: w.nameAr,
          homeDeliveryDzd: t.domicile > 0 ? t.domicile : w.homeDeliveryDzd,
          stopDeskDzd: t.stopdesk > 0 ? t.stopdesk : w.stopDeskDzd,
          delay: w.delay,
          isActive: true,
        },
      });
      updatedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    updatedCount,
    serviceFee: tarifs.service,
    packagingFee: tarifs.emballage,
  });
}