import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { getSiteSettings, invalidateSiteSettingsCache } from '@/lib/settings';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const allowedFields = [
    'brandName', 'brandNameAr', 'logoUrl', 'whatsappNumber', 'contactPhone', 'contactEmail',
    'addressFr', 'addressAr', 'instagramUrl', 'facebookUrl', 'tiktokUrl',
    'bgColor', 'textColor', 'accentColor', 'primaryColor',
    'showAnnouncement', 'announcementFr', 'announcementAr', 'announcementEn',
    'showHero', 'heroBadgeFr', 'heroBadgeAr', 'heroBadgeEn',
    'heroTitleFr', 'heroTitleAr', 'heroTitleEn',
    'heroSubtitleFr', 'heroSubtitleAr', 'heroSubtitleEn',
    'heroCtaFr', 'heroCtaAr', 'heroCtaEn', 'heroImageUrl',
    'showFeatures', 'feature1TitleFr', 'feature1TitleAr', 'feature1TitleEn',
    'feature2TitleFr', 'feature2TitleAr', 'feature2TitleEn',
    'feature3TitleFr', 'feature3TitleAr', 'feature3TitleEn',
    'showSearch', 'showCategoryFilter', 'showDeliverySection', 'showWhatsAppButton', 'showOrderTracking',
    'freeShippingThresholdDzd', 'defaultDeliveryDelay',
    'footerDescFr', 'footerDescAr', 'footerDescEn',
    'sizeGuideFr', 'sizeGuideAr', 'sizeGuideEn',
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }
  if ('freeShippingThresholdDzd' in data) {
    data.freeShippingThresholdDzd = Math.max(0, Number(data.freeShippingThresholdDzd) || 0);
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });

  invalidateSiteSettingsCache();
  return NextResponse.json({ settings });
}