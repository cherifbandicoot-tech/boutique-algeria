import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Sister's Admin Account (Change password right after logging in or edit below!)
  const adminEmail = 'admin@maisonyasmine.dz';
  const passwordHash = await bcrypt.hash('YasmineCouture2026!', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Yasmine (Admin)',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create Categories
  const tradCat = await prisma.category.upsert({
    where: { slug: 'traditionnel' },
    update: {},
    create: { slug: 'traditionnel', nameFr: 'Traditionnel', nameAr: 'تقليدي', nameEn: 'Traditional' },
  });

  const modernCat = await prisma.category.upsert({
    where: { slug: 'moderne' },
    update: {},
    create: { slug: 'moderne', nameFr: 'Moderne & Modest', nameAr: 'عصري ومحتشم', nameEn: 'Modern & Modest' },
  });

  // 3. Seed Initial Products with Variants & Images
  const seedProducts = [
    {
      slug: 'karakou-royal',
      titleFr: 'Karakou Royal Velours',
      titleAr: 'كاراكو ملكي مخملي',
      titleEn: 'Royal Velvet Karakou',
      descriptionFr: 'Karakou algérois brodé main au fil d’or (fetla) sur velours de soie.',
      descriptionAr: 'كاراكو عاصمي مطرز يدوياً بالفتلة الذهبية على قماش القطيفة الفاخر.',
      descriptionEn: 'Hand-embroidered Algiers Karakou with gold fetla thread on silk velvet.',
      priceDzd: 28500,
      isFeatured: true,
      categoryId: tradCat.id,
      img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      slug: 'caftan-perle',
      titleFr: 'Caftan Perle Dorée',
      titleAr: 'قفطان اللؤلؤ الذهبي',
      titleEn: 'Golden Pearl Caftan',
      descriptionFr: 'Caftan fluide orné de perles délicates pour vos grandes occasions.',
      descriptionAr: 'قفطان انسيابي مرصع باللؤلؤ لمناسباتكم السعيدة.',
      descriptionEn: 'Flowing luxury caftan embellished with delicate pearls.',
      priceDzd: 24000,
      isFeatured: true,
      categoryId: tradCat.id,
      img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      slug: 'abaya-soie',
      titleFr: 'Abaya Soie de Médine',
      titleAr: 'عباية حرير المدينة',
      titleEn: 'Medina Silk Abaya',
      descriptionFr: 'Abaya élégante en soie de Médine respirante et infroissable.',
      descriptionAr: 'عباية أنيقة من حرير المدينة الأصلي خفيفة ومريحة.',
      descriptionEn: 'Elegant breathable Medina silk abaya with effortless drape.',
      priceDzd: 12800,
      isFeatured: true,
      categoryId: modernCat.id,
      img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80',
      sizes: ['52', '54', '56', '58'],
    },
  ];

  for (const p of seedProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          slug: p.slug,
          titleFr: p.titleFr,
          titleAr: p.titleAr,
          titleEn: p.titleEn,
          descriptionFr: p.descriptionFr,
          descriptionAr: p.descriptionAr,
          descriptionEn: p.descriptionEn,
          priceDzd: p.priceDzd,
          isFeatured: p.isFeatured,
          categoryId: p.categoryId,
          images: { create: [{ url: p.img, altText: p.titleFr, displayOrder: 0 }] },
          variants: {
            create: p.sizes.map((size) => ({
              size,
              colorName: 'Standard',
              colorHex: '#141414',
              stockQuantity: 10,
            })),
          },
        },
      });
    }
  }

  console.log('Seed completed! Admin email:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());