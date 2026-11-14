import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WILAYAS = [
  { code: 1, nameFr: "Adrar", nameAr: "أدرار", homeDeliveryDzd: 1400, stopDeskDzd: 900, delay: "3 - 5 jours" },
  { code: 2, nameFr: "Chlef", nameAr: "الشلف", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 3, nameFr: "Laghouat", nameAr: "الأغواط", homeDeliveryDzd: 950, stopDeskDzd: 600, delay: "48h - 72h" },
  { code: 4, nameFr: "Oum El Bouaghi", nameAr: "أم البواقي", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "48h" },
  { code: 5, nameFr: "Batna", nameAr: "باتنة", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 6, nameFr: "Béjaïa", nameAr: "بجاية", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 7, nameFr: "Biskra", nameAr: "بسكرة", homeDeliveryDzd: 900, stopDeskDzd: 550, delay: "48h" },
  { code: 8, nameFr: "Béchar", nameAr: "بشار", homeDeliveryDzd: 1100, stopDeskDzd: 700, delay: "48h - 72h" },
  { code: 9, nameFr: "Blida", nameAr: "البليدة", homeDeliveryDzd: 500, stopDeskDzd: 350, delay: "24h (Express)" },
  { code: 10, nameFr: "Bouira", nameAr: "البويرة", homeDeliveryDzd: 650, stopDeskDzd: 400, delay: "24h - 48h" },
  { code: 11, nameFr: "Tamanrasset", nameAr: "تمنراست", homeDeliveryDzd: 1600, stopDeskDzd: 1000, delay: "4 - 6 jours" },
  { code: 12, nameFr: "Tébessa", nameAr: "تبسة", homeDeliveryDzd: 900, stopDeskDzd: 550, delay: "48h - 72h" },
  { code: 13, nameFr: "Tlemcen", nameAr: "تلمسان", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 14, nameFr: "Tiaret", nameAr: "تيارت", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "48h" },
  { code: 15, nameFr: "Tizi Ouzou", nameAr: "تيزي وزو", homeDeliveryDzd: 650, stopDeskDzd: 400, delay: "24h - 48h" },
  { code: 16, nameFr: "Alger", nameAr: "الجزائر", homeDeliveryDzd: 400, stopDeskDzd: 300, delay: "24h (Express)" },
  { code: 17, nameFr: "Djelfa", nameAr: "الجلفة", homeDeliveryDzd: 900, stopDeskDzd: 550, delay: "48h" },
  { code: 18, nameFr: "Jijel", nameAr: "جيجل", homeDeliveryDzd: 750, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 19, nameFr: "Sétif", nameAr: "سطيف", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 20, nameFr: "Saïda", nameAr: "سعيدة", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 21, nameFr: "Skikda", nameAr: "سكيكدة", homeDeliveryDzd: 750, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 22, nameFr: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 23, nameFr: "Annaba", nameAr: "عنابة", homeDeliveryDzd: 750, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 24, nameFr: "Guelma", nameAr: "قالمة", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "48h" },
  { code: 25, nameFr: "Constantine", nameAr: "قسنطينة", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 26, nameFr: "Médéa", nameAr: "المدية", homeDeliveryDzd: 650, stopDeskDzd: 400, delay: "24h - 48h" },
  { code: 27, nameFr: "Mostaganem", nameAr: "مستغانم", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 28, nameFr: "M'Sila", nameAr: "المسيلة", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 29, nameFr: "Mascara", nameAr: "معسكر", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "48h" },
  { code: 30, nameFr: "Ouargla", nameAr: "ورقلة", homeDeliveryDzd: 1000, stopDeskDzd: 650, delay: "48h - 72h" },
  { code: 31, nameFr: "Oran", nameAr: "وهران", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 32, nameFr: "El Bayadh", nameAr: "البيض", homeDeliveryDzd: 1050, stopDeskDzd: 650, delay: "48h - 72h" },
  { code: 33, nameFr: "Illizi", nameAr: "إليزي", homeDeliveryDzd: 1700, stopDeskDzd: 1100, delay: "4 - 6 jours" },
  { code: 34, nameFr: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 35, nameFr: "Boumerdès", nameAr: "بومرداس", homeDeliveryDzd: 550, stopDeskDzd: 350, delay: "24h (Express)" },
  { code: 36, nameFr: "El Tarf", nameAr: "الطارف", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 37, nameFr: "Tindouf", nameAr: "تندوف", homeDeliveryDzd: 1600, stopDeskDzd: 1000, delay: "4 - 6 jours" },
  { code: 38, nameFr: "Tissemsilt", nameAr: "تيسمسيلت", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 39, nameFr: "El Oued", nameAr: "الوادي", homeDeliveryDzd: 950, stopDeskDzd: 600, delay: "48h - 72h" },
  { code: 40, nameFr: "Khenchela", nameAr: "خنشلة", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 41, nameFr: "Souk Ahras", nameAr: "سوق أهراس", homeDeliveryDzd: 850, stopDeskDzd: 500, delay: "48h" },
  { code: 42, nameFr: "Tipaza", nameAr: "تيبازة", homeDeliveryDzd: 550, stopDeskDzd: 350, delay: "24h (Express)" },
  { code: 43, nameFr: "Mila", nameAr: "ميلة", homeDeliveryDzd: 750, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 44, nameFr: "Aïn Defla", nameAr: "عين الدفلى", homeDeliveryDzd: 700, stopDeskDzd: 450, delay: "24h - 48h" },
  { code: 45, nameFr: "Naâma", nameAr: "النعامة", homeDeliveryDzd: 1050, stopDeskDzd: 650, delay: "48h - 72h" },
  { code: 46, nameFr: "Aïn Témouchent", nameAr: "عين تموشنت", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 47, nameFr: "Ghardaïa", nameAr: "غرداية", homeDeliveryDzd: 950, stopDeskDzd: 600, delay: "48h - 72h" },
  { code: 48, nameFr: "Relizane", nameAr: "غليزان", homeDeliveryDzd: 800, stopDeskDzd: 500, delay: "24h - 48h" },
  { code: 49, nameFr: "Timimoun", nameAr: "تيميمون", homeDeliveryDzd: 1400, stopDeskDzd: 900, delay: "3 - 5 jours" },
  { code: 50, nameFr: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", homeDeliveryDzd: 1700, stopDeskDzd: 1100, delay: "4 - 6 jours" },
  { code: 51, nameFr: "Ouled Djellal", nameAr: "أولاد جلال", homeDeliveryDzd: 950, stopDeskDzd: 600, delay: "48h - 72h" },
  { code: 52, nameFr: "Béni Abbès", nameAr: "بني عباس", homeDeliveryDzd: 1300, stopDeskDzd: 850, delay: "3 - 5 jours" },
  { code: 53, nameFr: "In Salah", nameAr: "عين صالح", homeDeliveryDzd: 1500, stopDeskDzd: 950, delay: "3 - 5 jours" },
  { code: 54, nameFr: "In Guezzam", nameAr: "عين قزام", homeDeliveryDzd: 1700, stopDeskDzd: 1100, delay: "4 - 6 jours" },
  { code: 55, nameFr: "Touggourt", nameAr: "تقرت", homeDeliveryDzd: 1000, stopDeskDzd: 650, delay: "48h - 72h" },
  { code: 56, nameFr: "Djanet", nameAr: "جانت", homeDeliveryDzd: 1700, stopDeskDzd: 1100, delay: "4 - 6 jours" },
  { code: 57, nameFr: "El M'Ghair", nameAr: "المغير", homeDeliveryDzd: 950, stopDeskDzd: 600, delay: "48h - 72h" },
  { code: 58, nameFr: "El Meniaa", nameAr: "المنيعة", homeDeliveryDzd: 1100, stopDeskDzd: 700, delay: "3 - 4 jours" }
];

async function main() {
  const adminEmail = 'admin@maisonyasmine.dz';
  const passwordHash = await bcrypt.hash('YasmineCouture2026!', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Maison Nerava',
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  for (const w of WILAYAS) {
    await prisma.wilayaShipping.upsert({
      where: { code: w.code },
      update: {},
      create: {
        code: w.code,
        nameFr: w.nameFr,
        nameAr: w.nameAr,
        homeDeliveryDzd: w.homeDeliveryDzd,
        stopDeskDzd: w.stopDeskDzd,
        delay: w.delay,
        isActive: true,
      },
    });
  }

  await prisma.promoCode.upsert({
    where: { code: 'BIENVENUE10' },
    update: {},
    create: {
      code: 'BIENVENUE10',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderDzd: 5000,
      isActive: true,
    },
  });

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

  console.log('Seed completed! 58 wilayas, SiteSettings, PromoCode, and products ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());