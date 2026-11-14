import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: true, variants: true, category: true },
    }),
    prisma.category.findMany(),
  ]);
  return NextResponse.json({ products, categories });
}

const createProductSchema = z.object({
  titleFr: z.string().min(2),
  titleAr: z.string().min(2),
  titleEn: z.string().min(2),
  priceDzd: z.number().int().min(500),
  categoryId: z.string().min(1),
  imageUrl: z.string().url(),
  sizes: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = createProductSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });

  const slug =
    parsed.data.titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.floor(100 + Math.random() * 900);

  const product = await prisma.product.create({
    data: {
      slug,
      titleFr: parsed.data.titleFr,
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      descriptionFr: parsed.data.titleFr,
      descriptionAr: parsed.data.titleAr,
      descriptionEn: parsed.data.titleEn,
      priceDzd: parsed.data.priceDzd,
      isFeatured: true,
      categoryId: parsed.data.categoryId,
      images: { create: [{ url: parsed.data.imageUrl, altText: parsed.data.titleFr, displayOrder: 0 }] },
      variants: {
        create: parsed.data.sizes.map((size) => ({
          size,
          colorName: 'Standard',
          colorHex: '#141414',
          stockQuantity: 15,
        })),
      },
    },
    include: { images: true, variants: true },
  });

  return NextResponse.json({ product }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}