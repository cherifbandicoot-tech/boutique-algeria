import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ promos });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const code = String(body?.code || '').trim().toUpperCase();
  if (!code || !body?.discountValue) {
    return NextResponse.json({ error: 'Code et valeur requis' }, { status: 400 });
  }
  const promo = await prisma.promoCode.create({
    data: {
      code,
      discountType: body.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
      discountValue: Number(body.discountValue),
      minOrderDzd: Number(body.minOrderDzd || 0),
      maxUses: body.maxUses ? Number(body.maxUses) : null,
      isActive: true,
    },
  });
  return NextResponse.json({ promo }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  const promo = await prisma.promoCode.update({
    where: { id: body.id },
    data: { isActive: Boolean(body.isActive) },
  });
  return NextResponse.json({ promo });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}