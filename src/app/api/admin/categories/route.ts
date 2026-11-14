import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.nameFr || !body?.nameAr) {
    return NextResponse.json({ error: 'Nom FR et AR requis' }, { status: 400 });
  }
  const slug =
    String(body.nameEn || body.nameFr)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.floor(10 + Math.random() * 90);

  const category = await prisma.category.create({
    data: {
      slug,
      nameFr: body.nameFr,
      nameAr: body.nameAr,
      nameEn: body.nameEn || body.nameFr,
      imageUrl: body.imageUrl || null,
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json({ error: 'Impossible : des produits utilisent cette catégorie' }, { status: 400 });
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}