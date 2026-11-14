import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

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
});

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.adminNotes !== undefined) data.adminNotes = parsed.data.adminNotes;
  if (parsed.data.trackingCode !== undefined) data.trackingCode = parsed.data.trackingCode || null;

  const updated = await prisma.order.update({
    where: { id: parsed.data.orderId },
    data,
  });
  return NextResponse.json({ order: updated });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}