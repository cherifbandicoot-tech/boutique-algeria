import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'ID de commande manquant' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

    const apiId = process.env.ECOM_API_ID;
    const apiToken = process.env.ECOM_API_TOKEN;

    if (!apiId || !apiToken) {
      return NextResponse.json(
        { error: 'Clés E-com Delivery (ECOM_API_ID / ECOM_API_TOKEN) non configurées' },
        { status: 500 }
      );
    }

    const itemsSummary = order.items
      .map((i) => `${i.product.titleFr} (${i.variantId || 'Standard'}) x${i.quantity}`)
      .join(', ');

    // Standard E-com Delivery Payload
    const payload = {
      tracking: order.orderNumber,
      client: order.customerName,
      phone: order.customerPhone,
      phone_2: '',
      adresse: order.address || `${order.commune}, Wilaya ${order.wilayaCode}`,
      wilaya: order.wilayaName,
      commune: order.commune,
      montant: order.totalDzd, // Amount to collect in DZD
      remarque: itemsSummary,
      produit: itemsSummary,
      stopdesk: order.deliveryType === 'DESK' ? 1 : 0,
      type: 1, // Standard Delivery
    };

    // Send to E-com Delivery endpoint with authentication headers
    const ecomRes = await fetch('https://api.ecomdelivery.dz/v1/parcels', {
      method: 'POST',
      headers: {
        'api-key': apiId,
        'api-token': apiToken,
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const ecomData = await ecomRes.json().catch(() => ({}));

    // Check if created or return tracking
    const trackingCode =
      ecomData.tracking ||
      ecomData.tracking_code ||
      ecomData.barcode ||
      order.orderNumber;

    const labelUrl = ecomData.label_url || ecomData.pdf_url || null;

    // Update the order in PostgreSQL
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingCode,
        status: 'SHIPPED',
      },
    });

    return NextResponse.json({
      success: true,
      trackingCode,
      labelUrl,
      order: updated,
    });
  } catch (error) {
    console.error('Ecom Delivery Error:', error);
    return NextResponse.json(
      { error: 'Erreur de connexion avec le serveur E-com Delivery' },
      { status: 500 }
    );
  }
}