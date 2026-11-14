import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapEcomSituationToOrderStatus } from '@/lib/ecom';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.ECOM_WEBHOOK_SECRET;

  if (secret) {
    const signature = req.headers.get('x-webhook-signature') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody || '{}') as {
    tracking?: string;
    situation?: string;
    id_situation?: number | null;
    etat_logistique?: string | null;
    colis?: { id_externe?: string | null } | null;
  };

  if (!event.tracking) {
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { trackingCode: event.tracking },
        ...(event.colis?.id_externe ? [{ orderNumber: event.colis.id_externe }] : []),
      ],
    },
  });

  if (order) {
    const mappedStatus = mapEcomSituationToOrderStatus(event.id_situation, event.situation);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingCode: event.tracking,
        ecomStatus: event.situation || order.ecomStatus,
        ecomLogistic: event.etat_logistique || order.ecomLogistic,
        ecomPaid: event.id_situation === 14 || event.id_situation === 15 ? true : order.ecomPaid,
        ecomRecovered: event.id_situation === 15 ? true : order.ecomRecovered,
        ecomSyncedAt: new Date(),
        ...(mappedStatus ? { status: mappedStatus } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true });
}