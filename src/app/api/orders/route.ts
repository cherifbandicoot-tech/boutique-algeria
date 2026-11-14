import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';
import { getSiteSettings } from '@/lib/settings';
import { ecomFetch, getEcomCredentials } from '@/lib/ecom';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber')?.trim().toUpperCase();
  const phone = searchParams.get('phone')?.trim();

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: 'Numéro de commande et téléphone requis' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: { select: { titleFr: true, titleAr: true, titleEn: true, slug: true, images: { take: 1 } } },
          variant: { select: { size: true, colorName: true } },
        },
      },
    },
  });

  if (!order || order.customerPhone.slice(-4) !== phone.slice(-4)) {
    return NextResponse.json({ error: 'Aucune commande trouvée avec ces informations' }, { status: 404 });
  }

  let ecomHistory: Array<{ date: string; ville: number; situation: string; commentaire: string | null }> = [];
  if (order.trackingCode && getEcomCredentials().configured) {
    try {
      const detail = await ecomFetch<{
        situation?: string;
        etat_logistique?: string;
        historique?: Array<{ date: string; ville: number; situation: string; commentaire: string | null }>;
      }>(`/colis/${encodeURIComponent(order.trackingCode)}`, { timeoutMs: 4000 });
      if (detail.ok && detail.data) {
        ecomHistory = detail.data.historique || [];
      }
    } catch {}
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      wilayaCode: order.wilayaCode,
      wilayaName: order.wilayaName,
      commune: order.commune,
      stopdeskCode: order.stopdeskCode,
      stopdeskName: order.stopdeskName,
      deliveryType: order.deliveryType,
      subtotalDzd: order.subtotalDzd,
      discountDzd: order.discountDzd,
      shippingDzd: order.shippingDzd,
      totalDzd: order.totalDzd,
      status: order.status,
      trackingCode: order.trackingCode,
      ecomStatus: order.ecomStatus,
      ecomLogistic: order.ecomLogistic,
      ecomSyncedAt: order.ecomSyncedAt,
      ecomHistory,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        titleFr: i.product.titleFr,
        titleAr: i.product.titleAr,
        titleEn: i.product.titleEn,
        image: i.product.images[0]?.url || null,
        size: i.variant.size,
        colorName: i.variant.colorName,
        quantity: i.quantity,
        unitPriceDzd: i.unitPriceDzd,
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rate = checkRateLimit(ip, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter.' }, { status: 429 });
    }

    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerPhone,
      wilayaCode,
      commune,
      stopdeskCode,
      stopdeskName,
      address,
      deliveryType,
      promoCode,
      items,
    } = parsed.data;

    const [dbWilaya, settings] = await Promise.all([
      prisma.wilayaShipping.findUnique({ where: { code: wilayaCode } }).catch(() => null),
      getSiteSettings(),
    ]);

    const fallbackWilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode);
    const wilaya = dbWilaya || fallbackWilaya;
    if (!wilaya) return NextResponse.json({ error: 'Wilaya invalide' }, { status: 400 });
    if (dbWilaya && !dbWilaya.isActive) {
      return NextResponse.json({ error: 'Livraison suspendue pour cette wilaya' }, { status: 400 });
    }

    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: items.map((i) => i.productId) } },
          { slug: { in: items.map((i) => i.productId) } },
        ],
        isActive: true,
      },
      include: { variants: true },
    });

    let subtotalDzd = 0;
    const orderItemsData: {
      productId: string;
      variantId: string;
      quantity: number;
      unitPriceDzd: number;
      titleFr: string;
      size: string;
    }[] = [];

    for (const item of items) {
      const product = dbProducts.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) return NextResponse.json({ error: `Article indisponible: ${item.title}` }, { status: 400 });

      const variant =
        product.variants.find(
          (v) => v.size === item.size && (!item.colorName || v.colorName === item.colorName)
        ) ||
        product.variants.find((v) => v.size === item.size) ||
        product.variants[0];

      if (!variant) return NextResponse.json({ error: 'Variante indisponible' }, { status: 400 });

      subtotalDzd += product.priceDzd * item.quantity;
      orderItemsData.push({
        productId: product.id,
        variantId: variant.id,
        quantity: item.quantity,
        unitPriceDzd: product.priceDzd,
        titleFr: product.titleFr,
        size: variant.size,
      });
    }

    let discountDzd = 0;
    let appliedPromo: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.trim().toUpperCase() },
      });
      if (
        promo &&
        promo.isActive &&
        (!promo.expiresAt || promo.expiresAt > new Date()) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses) &&
        subtotalDzd >= promo.minOrderDzd
      ) {
        discountDzd =
          promo.discountType === 'PERCENT'
            ? Math.round((subtotalDzd * promo.discountValue) / 100)
            : Math.min(subtotalDzd, promo.discountValue);
        appliedPromo = promo.code;
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const netSubtotal = Math.max(0, subtotalDzd - discountDzd);
    const baseShipping = deliveryType === 'HOME' ? wilaya.homeDeliveryDzd : wilaya.stopDeskDzd;
    const freeShipping =
      settings.freeShippingThresholdDzd > 0 && netSubtotal >= settings.freeShippingThresholdDzd;
    const shippingDzd = freeShipping ? 0 : baseShipping;
    const totalDzd = netSubtotal + shippingDzd;
    const orderNumber = `DZ-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        wilayaCode,
        wilayaName: wilaya.nameFr,
        commune,
        stopdeskCode: deliveryType === 'DESK' ? stopdeskCode || null : null,
        stopdeskName: deliveryType === 'DESK' ? stopdeskName || null : null,
        address,
        deliveryType,
        paymentMethod: 'COD',
        shippingDzd,
        discountDzd,
        promoCode: appliedPromo,
        subtotalDzd,
        totalDzd,
        items: {
          create: orderItemsData.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPriceDzd: i.unitPriceDzd,
          })),
        },
      },
    });

    for (const i of orderItemsData) {
      const v = await prisma.productVariant.findUnique({ where: { id: i.variantId } });
      if (v && v.stockQuantity > 0) {
        await prisma.productVariant.update({
          where: { id: i.variantId },
          data: { stockQuantity: Math.max(0, v.stockQuantity - i.quantity) },
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      subtotalDzd,
      discountDzd,
      shippingDzd,
      totalDzd,
      wilayaName: wilaya.nameFr,
      commune,
      stopdeskName: deliveryType === 'DESK' ? stopdeskName : null,
      deliveryType,
      delay: 'delay' in wilaya ? wilaya.delay : settings.defaultDeliveryDelay,
      items: orderItemsData.map((i) => ({
        title: i.titleFr,
        size: i.size,
        quantity: i.quantity,
        unitPriceDzd: i.unitPriceDzd,
      })),
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}