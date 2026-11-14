import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ecomFetch, getCachedEcomStopdesks, getEcomCredentials } from '@/lib/ecom';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true, variant: true } } },
  });
  return NextResponse.json({ orders });
}

const patchSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']).optional(),
  adminNotes: z.string().max(500).optional(),
  trackingCode: z.string().max(100).optional(),
  syncEcom: z.boolean().optional(),
});

function normalizeDzPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('213') && digits.length >= 12) return '0' + digits.slice(3, 12);
  if (!digits.startsWith('0') && digits.length === 9) return '0' + digits;
  return digits.slice(0, 10);
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const existing = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.adminNotes !== undefined) data.adminNotes = parsed.data.adminNotes;
  if (parsed.data.trackingCode !== undefined) data.trackingCode = parsed.data.trackingCode || null;

  let ecomMessage: string | null = null;
  let ecomWarning: string | null = null;

  const targetStatus = parsed.data.status;
  const shouldSyncEcom = parsed.data.syncEcom !== false && getEcomCredentials().configured;

  // Automatic E-com Delivery sync when order is set to CONFIRMED or SHIPPED
  if (shouldSyncEcom && (targetStatus === 'CONFIRMED' || targetStatus === 'SHIPPED')) {
    try {
      if (!existing.trackingCode) {
        const isDesk = existing.deliveryType === 'DESK';
        let stopdeskCode = existing.stopdeskCode;
        if (isDesk && !stopdeskCode) {
          const desks = await getCachedEcomStopdesks(existing.wilayaCode);
          stopdeskCode = desks[0]?.code_stopdesk || null;
        }

        const itemsSummary = existing.items
          .map((i) => `${i.product.titleFr} (${i.variant?.size || 'Std'}) x${i.quantity}`)
          .join(', ')
          .slice(0, 250);
        const totalQty = existing.items.reduce((s, i) => s + i.quantity, 0) || 1;

        const payload: Record<string, unknown> = {
          nom_complet: existing.customerName.slice(0, 60),
          mobile_1: normalizeDzPhone(existing.customerPhone),
          id_wilaya: existing.wilayaCode,
          article: itemsSummary || 'Prêt-à-porter Maison Nerava',
          quantite: totalQty,
          total: Math.min(150000, existing.totalDzd),
          stopdesk: isDesk ? 1 : 0,
          adresse: (existing.address || existing.commune).slice(0, 100),
          note_fournisseur: (existing.adminNotes || `Cmd ${existing.orderNumber}`).slice(0, 255),
          id_externe: existing.orderNumber.slice(0, 20),
          confirmee: targetStatus === 'SHIPPED' ? 1 : 0,
        };
        if (isDesk && stopdeskCode) payload.code_stopdesk = stopdeskCode;
        else payload.commune = existing.commune.slice(0, 50);

        const res = await ecomFetch<{
          error?: { message?: string };
          resultats?: Array<{
            ok: boolean;
            tracking: string | null;
            id_colis: number | null;
            code_stopdesk: string | null;
            nom_stopdesk: string | null;
            erreur: string | null;
          }>;
        }>('/colis', { method: 'POST', body: [payload] });

        const row = res.data?.resultats?.[0];
        if (res.ok && row?.ok && row.tracking) {
          data.trackingCode = row.tracking;
          data.ecomParcelId = row.id_colis ? String(row.id_colis) : null;
          data.ecomStatus = targetStatus === 'SHIPPED' ? 'En Traitement' : 'En Préparation';
          data.ecomLogistic = targetStatus === 'SHIPPED' ? 'En Traitement' : 'En Préparation';
          data.stopdeskCode = row.code_stopdesk || stopdeskCode || existing.stopdeskCode;
          data.stopdeskName = row.nom_stopdesk || existing.stopdeskName;
          data.ecomSyncedAt = new Date();
          ecomMessage = `Colis créé sur E-com Delivery : ${row.tracking}`;
        } else {
          ecomWarning = row?.erreur || res.data?.error?.message || 'E-com Delivery n’a pas pu créer le colis automatiquement';
        }
      } else if (targetStatus === 'SHIPPED') {
        const res = await ecomFetch<{
          resultats?: Array<{ ok: boolean; erreur: string | null }>;
        }>('/colis/confirmer', { method: 'POST', body: { trackings: [existing.trackingCode] } });
        const row = res.data?.resultats?.[0];
        if (res.ok && row?.ok) {
          data.ecomStatus = 'En Traitement';
          data.ecomLogistic = 'En Traitement';
          data.ecomSyncedAt = new Date();
          ecomMessage = `Colis ${existing.trackingCode} confirmé sur E-com Delivery`;
        }
      }
    } catch (err) {
      ecomWarning = err instanceof Error ? err.message : 'Erreur sync E-com';
    }
  }

  const updated = await prisma.order.update({
    where: { id: parsed.data.orderId },
    data,
  });

  return NextResponse.json({ order: updated, ecomMessage, ecomWarning });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}