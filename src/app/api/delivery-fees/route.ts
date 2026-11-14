import { NextRequest, NextResponse } from 'next/server';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';

// In-memory cache for live E-com Delivery rates (cache for 1 hour to ensure ultra-fast UX)
let cachedFees: Record<number, { homeDeliveryDzd: number; stopDeskDzd: number }> | null = null;
let cacheExpiresAt = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wilayaCode = parseInt(searchParams.get('wilaya') || '16', 10);

  const apiId = process.env.ECOM_API_ID;
  const apiToken = process.env.ECOM_API_TOKEN;

  // 1. Try to fetch live rates from E-com Delivery if cache expired
  const now = Date.now();
  if (!cachedFees || now > cacheExpiresAt) {
    if (apiId && apiToken) {
      try {
        const res = await fetch('https://api.ecomdelivery.dz/v1/tarifs', {
          headers: {
            'api-key': apiId,
            'api-token': apiToken,
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json',
          },
          // 3-second timeout so customers never experience slow dropdowns
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const data = await res.json();
          // Map E-com Delivery real tariff table into memory
          if (Array.isArray(data) || typeof data === 'object') {
            cachedFees = {};
            const list = Array.isArray(data) ? data : Object.values(data);
            for (const item of list as any[]) {
              const code = parseInt(item.wilaya_id || item.code || item.wilaya_code, 10);
              if (code >= 1 && code <= 58) {
                cachedFees[code] = {
                  homeDeliveryDzd: Number(item.tarif_domicile || item.home || item.price || 0),
                  stopDeskDzd: Number(item.tarif_stopdesk || item.stopdesk || item.desk_price || 0),
                };
              }
            }
            cacheExpiresAt = now + 1000 * 60 * 60; // 1-hour cache
          }
        }
      } catch (err) {
        console.warn('E-com live fee lookup timeout, using fallback rates', err);
      }
    }
  }

  // 2. Return live rate for requested Wilaya (or fallback to contract tariff table)
  const defaultWilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode) || ALGERIA_WILAYAS[15];
  const liveRate = cachedFees?.[wilayaCode];

  const homeDeliveryDzd = liveRate?.homeDeliveryDzd && liveRate.homeDeliveryDzd > 0 
    ? liveRate.homeDeliveryDzd 
    : defaultWilaya.homeDeliveryDzd;

  const stopDeskDzd = liveRate?.stopDeskDzd && liveRate.stopDeskDzd > 0 
    ? liveRate.stopDeskDzd 
    : defaultWilaya.stopDeskDzd;

  return NextResponse.json({
    wilayaCode,
    wilayaName: defaultWilaya.nameFr,
    homeDeliveryDzd,
    stopDeskDzd,
    delay: defaultWilaya.delay,
    isLive: Boolean(liveRate),
  });
}