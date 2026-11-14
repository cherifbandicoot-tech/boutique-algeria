import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = String(body?.code || '').trim().toUpperCase();
  const subtotalDzd = Number(body?.subtotalDzd || 0);

  if (!code) return NextResponse.json({ error: 'Veuillez saisir un code promo' }, { status: 400 });

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: 'Code promo invalide ou expiré' }, { status: 404 });
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Ce code promo a expiré' }, { status: 400 });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: 'Ce code promo a atteint sa limite d’utilisation' }, { status: 400 });
  }
  if (subtotalDzd < promo.minOrderDzd) {
    return NextResponse.json(
      { error: `Commande minimum requise : ${promo.minOrderDzd.toLocaleString()} DZD` },
      { status: 400 }
    );
  }

  const discountDzd =
    promo.discountType === 'PERCENT'
      ? Math.round((subtotalDzd * promo.discountValue) / 100)
      : Math.min(subtotalDzd, promo.discountValue);

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountDzd,
  });
}