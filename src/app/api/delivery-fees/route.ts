import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';
import { getSiteSettings } from '@/lib/settings';
import { getCachedEcomTarifs, getCachedEcomWilayas, getEcomCredentials } from '@/lib/ecom';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  const wilayaCode = parseInt(searchParams.get('wilaya') || '16', 10);

  const [dbWilayas, settings, liveTarifs, liveWilayas] = await Promise.all([
    prisma.wilayaShipping.findMany({ orderBy: { code: 'asc' } }).catch(() => []),
    getSiteSettings(),
    getCachedEcomTarifs(),
    getCachedEcomWilayas(),
  ]);

  const dbMap = new Map(dbWilayas.map((w) => [w.code, w]));
  const liveWilayaMap = new Map((liveWilayas || []).map((w) => [w.id, w]));

  const merged = ALGERIA_WILAYAS.map((def) => {
    const db = dbMap.get(def.code);
    const liveRate = liveTarifs?.byWilaya[def.code];
    const liveInfo = liveWilayaMap.get(def.code);
    const useCustom = Boolean(db?.customOverride);

    const homeDeliveryDzd = useCustom
      ? db!.homeDeliveryDzd
      : liveRate && liveRate.domicile > 0
      ? liveRate.domicile
      : db?.homeDeliveryDzd ?? def.homeDeliveryDzd;

    const stopDeskDzd = useCustom
      ? db!.stopDeskDzd
      : liveRate && liveRate.stopdesk > 0
      ? liveRate.stopdesk
      : db?.stopDeskDzd ?? def.stopDeskDzd;

    return {
      code: def.code,
      nameFr: liveInfo?.libelle || db?.nameFr || def.nameFr,
      nameAr: db?.nameAr || def.nameAr,
      homeDeliveryDzd,
      stopDeskDzd,
      ecomHomeDzd: liveRate?.domicile ?? null,
      ecomDeskDzd: liveRate?.stopdesk ?? null,
      homeAvailable: liveInfo ? liveInfo.domicile : true,
      stopdeskAvailable: liveInfo ? liveInfo.stopdesk : true,
      delay: db?.delay || def.delay || settings.defaultDeliveryDelay,
      isActive: db?.isActive ?? true,
      isLive: Boolean(liveRate),
    };
  });

  if (all) {
    return NextResponse.json({
      wilayas: merged,
      freeShippingThresholdDzd: settings.freeShippingThresholdDzd,
      ecomConfigured: getEcomCredentials().configured,
      serviceFee: liveTarifs?.service ?? 0,
      packagingFee: liveTarifs?.emballage ?? 0,
    });
  }

  const found = merged.find((w) => w.code === wilayaCode) || merged[15];
  return NextResponse.json({
    wilayaCode: found.code,
    wilayaName: found.nameFr,
    wilayaNameAr: found.nameAr,
    homeDeliveryDzd: found.homeDeliveryDzd,
    stopDeskDzd: found.stopDeskDzd,
    homeAvailable: found.homeAvailable,
    stopdeskAvailable: found.stopdeskAvailable,
    delay: found.delay,
    isActive: found.isActive,
    isLive: found.isLive,
    freeShippingThresholdDzd: settings.freeShippingThresholdDzd,
  });
}