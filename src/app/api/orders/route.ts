import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rate = checkRateLimit(ip, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes. Veuillez patienter.' }, { status: 429 });
    }

    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 });
    }

    const { customerName, customerPhone, wilayaCode, commune, address, deliveryType, items } = parsed.data;
    const wilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode);
    if (!wilaya) return NextResponse.json({ error: 'Wilaya invalide' }, { status: 400 });

    // Fetch authoritative prices directly from PostgreSQL
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
    const orderItemsData: { productId: string; variantId: string; quantity: number; unitPriceDzd: number }[] = [];

    for (const item of items) {
      const product = dbProducts.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) return NextResponse.json({ error: 'Article indisponible' }, { status: 400 });
      const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
      if (!variant) return NextResponse.json({ error: 'Taille indisponible' }, { status: 400 });

      subtotalDzd += product.priceDzd * item.quantity;
      orderItemsData.push({
        productId: product.id,
        variantId: variant.id,
        quantity: item.quantity,
        unitPriceDzd: product.priceDzd,
      });
    }

    // Dynamic Delivery Rate lookup
    const shippingDzd = deliveryType === 'HOME' ? wilaya.homeDeliveryDzd : wilaya.stopDeskDzd;
    const totalDzd = subtotalDzd + shippingDzd;
    const orderNumber = `DZ-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        wilayaCode,
        wilayaName: wilaya.nameFr,
        commune,
        address,
        deliveryType,
        paymentMethod: 'COD',
        shippingDzd,
        subtotalDzd,
        totalDzd,
        items: { create: orderItemsData },
      },
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, totalDzd, shippingDzd });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
  }
}