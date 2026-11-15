import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ecomFetch, getCachedEcomStopdesks, mapEcomSituationToOrderStatus } from '@/lib/ecom';

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const action = sp.get('action') || 'status';

  try {
    if (action === 'test') {
      const r = await ecomFetch('/test');
      return NextResponse.json({ ok: r.ok, status: r.status, account: r.data, limits: r.limits });
    }
    if (action === 'resume') {
      const r = await ecomFetch('/colis/resume');
      return NextResponse.json({ ok: r.ok, resume: r.data, limits: r.limits });
    }
    if (action === 'paiements') {
      const r = await ecomFetch('/paiements?page=1&limit=25');
      return NextResponse.json({ ok: r.ok, paiements: r.data });
    }
    if (action === 'tarifs') {
      const r = await ecomFetch('/tarifs');
      return NextResponse.json({ ok: r.ok, tarifs: r.data });
    }
    if (action === 'detail') {
      const tracking = sp.get('tracking');
      if (!tracking) return NextResponse.json({ error: 'tracking requis' }, { status: 400 });
      const r = await ecomFetch(`/colis/${encodeURIComponent(tracking)}`);
      return NextResponse.json({ ok: r.ok, detail: r.data });
    }
    if (action === 'reclamations-motifs') {
      const r = await ecomFetch('/reclamations/motifs');
      return NextResponse.json({ ok: r.ok, motifs: r.data });
    }
    if (action === 'reclamations') {
      const r = await ecomFetch('/reclamations?en_cours=true&limit=50');
      return NextResponse.json({ ok: r.ok, reclamations: r.data });
    }
    if (action === 'webhook') {
      const [sub, logs] = await Promise.all([
        ecomFetch('/webhook'),
        ecomFetch('/webhook/logs?limit=20'),
      ]);
      return NextResponse.json({ ok: sub.ok, subscription: sub.data, logs: logs.data });
    }

    const r = await ecomFetch('/test');
    return NextResponse.json({ configured: true, ok: r.ok, account: r.data, limits: r.limits });
  } catch (err) {
    return NextResponse.json(
      { configured: false, error: err instanceof Error ? err.message : 'Erreur E-com Delivery' },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'dispatch');

  try {
    if (action === 'dispatch') {
      const { orderId, confirmee = 0 } = body;
      if (!orderId) return NextResponse.json({ error: 'ID de commande manquant' }, { status: 400 });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true, variant: true } } },
      });
      if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

      const itemsSummary = order.items
        .map((i) => `${i.product.titleFr} (${i.variant?.size || 'Std'}${i.variant?.colorName && i.variant.colorName !== 'Standard' ? ` - ${i.variant.colorName}` : ''}) x${i.quantity}`)
        .join(', ')
        .slice(0, 250);

      const totalQty = order.items.reduce((s, i) => s + i.quantity, 0) || 1;
      const isDesk = order.deliveryType === 'DESK';

      let stopdeskCode = order.stopdeskCode;
      if (isDesk && !stopdeskCode) {
        const desks = await getCachedEcomStopdesks(order.wilayaCode);
        stopdeskCode = desks[0]?.code_stopdesk || null;
      }

      if (isDesk && !stopdeskCode) {
        return NextResponse.json(
          { error: `Aucun code stopdesk trouvé pour la wilaya ${order.wilayaCode}.` },
          { status: 400 }
        );
      }

      const parcelPayload: Record<string, unknown> = {
        nom_complet: order.customerName.slice(0, 60),
        mobile_1: order.customerPhone,
        id_wilaya: order.wilayaCode,
        article: itemsSummary || 'Prêt-à-porter Maison Nerava',
        quantite: totalQty,
        total: Math.min(150000, order.totalDzd),
        stopdesk: isDesk ? 1 : 0,
        adresse: (order.address || order.commune).slice(0, 100),
        note_fournisseur: (order.adminNotes || `Cmd ${order.orderNumber}`).slice(0, 255),
        id_externe: order.orderNumber.slice(0, 20),
        confirmee: confirmee ? 1 : 0,
      };

      if (isDesk) parcelPayload.code_stopdesk = stopdeskCode;
      else parcelPayload.commune = order.commune.slice(0, 50);

      const res = await ecomFetch<{
        error?: { code?: string; message?: string; details?: unknown };
        resultats?: Array<{
          ok: boolean;
          tracking: string | null;
          id_colis: number | null;
          tarif_si_livrer: number | null;
          code_stopdesk: string | null;
          nom_stopdesk: string | null;
          erreur: string | null;
          code?: string;
        }>;
      }>('/colis', { method: 'POST', body: [parcelPayload] });

      if (!res.ok) {
        return NextResponse.json(
          { error: res.data?.error?.message || `Erreur E-com (${res.status})`, raw: res.data },
          { status: 400 }
        );
      }

      const row = res.data?.resultats?.[0];
      if (!row || !row.ok || !row.tracking) {
        return NextResponse.json(
          { error: row?.erreur || 'Création refusée par E-com Delivery', code: row?.code, raw: res.data },
          { status: 400 }
        );
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingCode: row.tracking,
          ecomParcelId: row.id_colis ? String(row.id_colis) : null,
          ecomStatus: confirmee ? 'En Traitement' : 'En Préparation',
          ecomLogistic: confirmee ? 'En Traitement' : 'En Préparation',
          stopdeskCode: row.code_stopdesk || order.stopdeskCode,
          stopdeskName: row.nom_stopdesk || order.stopdeskName,
          ecomResponse: JSON.stringify(row),
          ecomSyncedAt: new Date(),
          status: confirmee ? 'SHIPPED' : 'CONFIRMED',
        },
      });

      return NextResponse.json({
        success: true,
        trackingCode: row.tracking,
        tarifSiLivrer: row.tarif_si_livrer,
        order: updated,
        limits: res.limits,
      });
    }

    if (action === 'update-parcel') {
      const { tracking, nom_complet, mobile_1, id_wilaya, commune, code_stopdesk, stopdesk, adresse, total, note_fournisseur, article } = body;
      if (!tracking) return NextResponse.json({ error: 'Tracking requis' }, { status: 400 });

      const payload: Record<string, unknown> = {
        nom_complet: String(nom_complet).slice(0, 60),
        mobile_1: String(mobile_1),
        id_wilaya: Number(id_wilaya),
        article: String(article || 'Prêt-à-porter').slice(0, 255),
        total: Math.min(150000, Number(total || 0)),
        stopdesk: Number(stopdesk) === 1 ? 1 : 0,
        adresse: String(adresse || '').slice(0, 100),
        note_fournisseur: String(note_fournisseur || '').slice(0, 255),
      };
      if (Number(stopdesk) === 1) payload.code_stopdesk = code_stopdesk;
      else payload.commune = commune;

      const res = await ecomFetch<{ ok?: boolean; erreur?: string; error?: { message?: string } }>(
        `/colis/${encodeURIComponent(tracking)}`,
        { method: 'PUT', body: payload }
      );
      if (!res.ok || res.data?.ok === false) {
        return NextResponse.json(
          { error: res.data?.erreur || res.data?.error?.message || 'Modification refusée' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === 'confirm') {
      const trackings: string[] = Array.isArray(body.trackings)
        ? body.trackings
        : body.tracking
        ? [body.tracking]
        : [];
      if (trackings.length === 0) return NextResponse.json({ error: 'Trackings requis' }, { status: 400 });

      const res = await ecomFetch<{
        confirmes?: number;
        echecs?: number;
        resultats?: Array<{ tracking: string; ok: boolean; erreur: string | null }>;
      }>('/colis/confirmer', { method: 'POST', body: { trackings } });

      if (res.ok && res.data?.resultats) {
        for (const r of res.data.resultats) {
          if (r.ok) {
            await prisma.order.updateMany({
              where: { trackingCode: r.tracking },
              data: { status: 'SHIPPED', ecomStatus: 'En Traitement', ecomSyncedAt: new Date() },
            });
          }
        }
      }
      return NextResponse.json({ ok: res.ok, data: res.data });
    }

    if (action === 'sync-statuses') {
      const trackedOrders = await prisma.order.findMany({
        where: { trackingCode: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const trackings = trackedOrders.map((o) => o.trackingCode!).filter(Boolean);
      if (trackings.length === 0) {
        return NextResponse.json({ success: true, synced: 0, message: 'Aucun colis avec tracking' });
      }

      const res = await ecomFetch<{
        trackings?: Array<{
          tracking: string;
          trouve: boolean;
          situation?: string;
          id_situation?: number;
          etat_logistique?: string;
          encaisser?: boolean;
          recouvert?: boolean;
        }>;
      }>('/colis/statuts', { method: 'POST', body: { trackings } });

      if (!res.ok) return NextResponse.json({ error: 'Erreur lors de la synchronisation' }, { status: 502 });

      let synced = 0;
      for (const t of res.data?.trackings || []) {
        if (!t.trouve) continue;
        const mapped = mapEcomSituationToOrderStatus(t.id_situation, t.situation);
        await prisma.order.updateMany({
          where: { trackingCode: t.tracking },
          data: {
            ecomStatus: t.situation || null,
            ecomLogistic: t.etat_logistique || null,
            ecomPaid: Boolean(t.encaisser),
            ecomRecovered: Boolean(t.recouvert),
            ecomSyncedAt: new Date(),
            ...(mapped ? { status: mapped } : {}),
          },
        });
        synced++;
      }

      return NextResponse.json({ success: true, synced, limits: res.limits });
    }

    if (action === 'pickup') {
      const res = await ecomFetch('/ramassage', {
        method: 'POST',
        body: {
          nb_colis: Number(body.nb_colis || 1),
          type_vehicule: Number(body.type_vehicule || 2),
          commune: String(body.commune || 'Cheraga'),
          heure: String(body.heure || '14h00'),
          mobile: body.mobile || undefined,
          note: body.note || undefined,
          google_map: body.google_map || undefined,
        },
      });
      return NextResponse.json({ ok: res.ok, status: res.status, data: res.data }, { status: res.ok ? 200 : 400 });
    }

    if (action === 'delete-parcel') {
      const tracking = String(body.tracking || '');
      if (!tracking) return NextResponse.json({ error: 'Tracking requis' }, { status: 400 });
      const res = await ecomFetch(`/colis/${encodeURIComponent(tracking)}`, { method: 'DELETE' });
      if (res.ok) {
        await prisma.order.updateMany({
          where: { trackingCode: tracking },
          data: { ecomStatus: 'Supprimée', status: 'CANCELLED', ecomSyncedAt: new Date() },
        });
      }
      return NextResponse.json({ ok: res.ok, status: res.status, data: res.data }, { status: res.ok ? 200 : 400 });
    }

    if (action === 'reclamation-create') {
      const res = await ecomFetch('/reclamations', {
        method: 'POST',
        body: {
          tracking: String(body.tracking),
          id_motif: Number(body.id_motif),
          ...(body.valeur !== undefined ? { valeur: body.valeur } : {}),
          ...(body.remarque ? { remarque: String(body.remarque) } : {}),
        },
      });
      return NextResponse.json({ ok: res.ok, data: res.data }, { status: res.ok ? 201 : 400 });
    }

    if (action === 'reclamation-cancel') {
      const res = await ecomFetch(`/reclamations/${Number(body.id)}/annuler`, { method: 'POST' });
      return NextResponse.json({ ok: res.ok, data: res.data }, { status: res.ok ? 200 : 400 });
    }

    if (action === 'webhook-setup') {
      const url = String(body.url || 'https://boutique-algeria.vercel.app/api/webhooks/ecom');
      const secret = process.env.ECOM_WEBHOOK_SECRET || undefined;
      const res = await ecomFetch('/webhook', {
        method: 'PUT',
        body: {
          url,
          ...(secret ? { secret } : {}),
          events: ['*'],
          active: true,
        },
      });
      return NextResponse.json({ ok: res.ok, data: res.data }, { status: res.ok ? 200 : 400 });
    }

    if (action === 'webhook-test') {
      const res = await ecomFetch('/webhook/test', {
        method: 'POST',
        body: { event: 'Livrée' },
      });
      return NextResponse.json({ ok: res.ok, data: res.data }, { status: res.ok ? 200 : 400 });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (err) {
    console.error('Ecom v2 Admin Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur E-com Delivery' },
      { status: 500 }
    );
  }
}