import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (body?.name && String(body.name).trim().length >= 2) {
    data.name = String(body.name).trim();
  }
  if (body?.email && String(body.email).includes('@')) {
    data.email = String(body.email).trim().toLowerCase();
  }
  if (body?.newPassword && String(body.newPassword).length >= 8) {
    data.passwordHash = await bcrypt.hash(String(body.newPassword), 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucune modification valide fournie' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: admin.userId },
    data,
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json({ success: true, user });
}