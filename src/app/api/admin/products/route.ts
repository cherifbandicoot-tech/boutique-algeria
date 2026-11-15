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
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);
  return NextResponse.json({ products, categories });
}

const variantInput = z.object({
  id: z.string().optional(),
  size: z.string().min(1),
  colorName: z.string().default('Standard'),
  colorHex: z.string().default('#141414'),
  stockQuantity: z.number().int().min(0).default(10),
});

const productSchema = z.object({
  id: z.string().optional(),
  titleFr: z.string().min(2),
  titleAr: z.string().min(2),
  titleEn: z.string().min(1).optional(),
  descriptionFr: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  priceDzd: z.number().int().min(100),
  compareAtPriceDzd: z.number().int().nullable().optional(),
  categoryId: z.string().min(1),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imageUrls: z.array(z.string().min(1).refine((v) => v.startsWith('http') || v.startsWith('/'))).min(1).optional(),
  imageUrl: z.string().min(1).refine((v) => v.startsWith('http') || v.startsWith('/')).optional(),
  sizes: z.array(z.string().min(1)).optional(),
  variants: z.array(variantInput).optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 });
  }

  const d = parsed.data;
  const images = d.imageUrls?.length ? d.imageUrls : d.imageUrl ? [d.imageUrl] : [];
  if (images.length === 0) return NextResponse.json({ error: 'Image requise' }, { status: 400 });

  const baseTitle = d.titleEn || d.titleFr;
  const slug =
    baseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.floor(100 + Math.random() * 900);

  const variantsData = d.variants?.length
    ? d.variants
    : (d.sizes?.length ? d.sizes : ['Standard']).map((size) => ({
        size,
        colorName: 'Standard',
        colorHex: '#141414',
        stockQuantity: 15,
      }));

  const product = await prisma.product.create({
    data: {
      slug,
      titleFr: d.titleFr,
      titleAr: d.titleAr,
      titleEn: d.titleEn || d.titleFr,
      descriptionFr: d.descriptionFr || d.titleFr,
      descriptionAr: d.descriptionAr || d.titleAr,
      descriptionEn: d.descriptionEn || d.titleEn || d.titleFr,
      priceDzd: d.priceDzd,
      compareAtPriceDzd: d.compareAtPriceDzd || null,
      isFeatured: d.isFeatured ?? true,
      isActive: d.isActive ?? true,
      categoryId: d.categoryId,
      images: {
        create: images.map((url, idx) => ({ url, altText: d.titleFr, displayOrder: idx })),
      },
      variants: {
        create: variantsData.map((v) => ({
          size: v.size,
          colorName: v.colorName || 'Standard',
          colorHex: v.colorHex || '#141414',
          stockQuantity: v.stockQuantity ?? 10,
        })),
      },
    },
    include: { images: true, variants: true, category: true },
  });

  return NextResponse.json({ product }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json({ error: 'Données ou ID manquant' }, { status: 400 });
  }

  const d = parsed.data;
  const images = d.imageUrls?.length ? d.imageUrls : d.imageUrl ? [d.imageUrl] : null;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: d.id! },
      data: {
        titleFr: d.titleFr,
        titleAr: d.titleAr,
        titleEn: d.titleEn || d.titleFr,
        descriptionFr: d.descriptionFr ?? d.titleFr,
        descriptionAr: d.descriptionAr ?? d.titleAr,
        descriptionEn: d.descriptionEn ?? d.titleEn ?? d.titleFr,
        priceDzd: d.priceDzd,
        compareAtPriceDzd: d.compareAtPriceDzd ?? null,
        isFeatured: d.isFeatured ?? true,
        isActive: d.isActive ?? true,
        categoryId: d.categoryId,
      },
    });

    if (images) {
      await tx.productImage.deleteMany({ where: { productId: d.id! } });
      await tx.productImage.createMany({
        data: images.map((url, idx) => ({
          productId: d.id!,
          url,
          altText: d.titleFr,
          displayOrder: idx,
        })),
      });
    }

    if (d.variants && d.variants.length > 0) {
      const existing = await tx.productVariant.findMany({ where: { productId: d.id! } });
      const keepIds = new Set(d.variants.filter((v) => v.id).map((v) => v.id!));
      for (const ex of existing) {
        if (!keepIds.has(ex.id)) {
          const usedCount = await tx.orderItem.count({ where: { variantId: ex.id } });
          if (usedCount === 0) await tx.productVariant.delete({ where: { id: ex.id } });
        }
      }
      for (const v of d.variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { size: v.size, colorName: v.colorName, colorHex: v.colorHex, stockQuantity: v.stockQuantity },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: d.id!,
              size: v.size,
              colorName: v.colorName,
              colorHex: v.colorHex,
              stockQuantity: v.stockQuantity,
            },
          });
        }
      }
    }
  });

  const updated = await prisma.product.findUnique({
    where: { id: d.id },
    include: { images: { orderBy: { displayOrder: 'asc' } }, variants: true, category: true },
  });
  return NextResponse.json({ product: updated });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  const hard = req.nextUrl.searchParams.get('hard') === 'true';
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

  if (hard) {
    const used = await prisma.orderItem.count({ where: { productId: id } });
    if (used === 0) {
      await prisma.product.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
  }

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}