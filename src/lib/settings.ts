import { prisma } from './prisma';

export interface SiteSettingsData {
  id: string;
  brandName: string;
  brandNameAr: string;
  logoUrl: string | null;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  addressFr: string;
  addressAr: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  primaryColor: string;
  showAnnouncement: boolean;
  announcementFr: string;
  announcementAr: string;
  announcementEn: string;
  showHero: boolean;
  heroBadgeFr: string;
  heroBadgeAr: string;
  heroBadgeEn: string;
  heroTitleFr: string;
  heroTitleAr: string;
  heroTitleEn: string;
  heroSubtitleFr: string;
  heroSubtitleAr: string;
  heroSubtitleEn: string;
  heroCtaFr: string;
  heroCtaAr: string;
  heroCtaEn: string;
  heroImageUrl: string;
  showFeatures: boolean;
  feature1TitleFr: string;
  feature1TitleAr: string;
  feature1TitleEn: string;
  feature2TitleFr: string;
  feature2TitleAr: string;
  feature2TitleEn: string;
  feature3TitleFr: string;
  feature3TitleAr: string;
  feature3TitleEn: string;
  showSearch: boolean;
  showCategoryFilter: boolean;
  showDeliverySection: boolean;
  showWhatsAppButton: boolean;
  showOrderTracking: boolean;
  freeShippingThresholdDzd: number;
  defaultDeliveryDelay: string;
  footerDescFr: string;
  footerDescAr: string;
  footerDescEn: string;
  sizeGuideFr: string;
  sizeGuideAr: string;
  sizeGuideEn: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: 'default',
  brandName: 'MAISON NERAVA',
  brandNameAr: 'دار نيرافا',
  logoUrl: null,
  whatsappNumber: '213770312656',
  contactPhone: '+213 770 31 26 56',
  contactEmail: 'contact@maisonnerava.dz',
  addressFr: 'Alger - Chéraga • Livraison 58 Wilayas',
  addressAr: 'الجزائر العاصمة - الشراقة • توصيل 58 ولاية',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  bgColor: '#FAF8F5',
  textColor: '#141414',
  accentColor: '#C5A059',
  primaryColor: '#13382C',
  showAnnouncement: true,
  announcementFr: 'Livraison Express 58 Wilayas avec E-com Delivery • Paiement à la Livraison',
  announcementAr: 'توصيل سريع إلى 58 ولاية مع E-com Delivery • الدفع نقداً عند الاستلام',
  announcementEn: 'Express 58 Wilayas Delivery with E-com Delivery • Cash on Delivery',
  showHero: true,
  heroBadgeFr: 'Collection Couture 2026',
  heroBadgeAr: 'تشكيلة كوتور 2026',
  heroBadgeEn: '2026 Couture Collection',
  heroTitleFr: "L'Élégance Algérienne Réinventée",
  heroTitleAr: 'الأناقة الجزائرية بلمسة راقية',
  heroTitleEn: 'Algerian Elegance Reimagined',
  heroSubtitleFr: 'Karakou brodés au fil d’or, caftans fluides et créations modernes livrés avec soin chez vous.',
  heroSubtitleAr: 'كاراكو مطرز بالفتلة الذهبية، قفاطين فاخرة وتصاميم عصرية تصل إلى باب بيتك.',
  heroSubtitleEn: 'Hand-embroidered Karakou, luxury caftans, and modern modest wear delivered across Algeria.',
  heroCtaFr: 'Découvrir la Collection',
  heroCtaAr: 'اكتشفي المجموعة',
  heroCtaEn: 'Explore Collection',
  heroImageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85',
  showFeatures: true,
  feature1TitleFr: 'Livraison 58 Wilayas',
  feature1TitleAr: 'توصيل 58 ولاية',
  feature1TitleEn: '58 Wilayas Delivery',
  feature2TitleFr: 'Paiement à la livraison',
  feature2TitleAr: 'الدفع عند الاستلام',
  feature2TitleEn: 'Cash on Delivery',
  feature3TitleFr: 'Savoir-faire Artisanal',
  feature3TitleAr: 'تطريز يدوي أصيل',
  feature3TitleEn: 'Artisanal Heritage',
  showSearch: true,
  showCategoryFilter: true,
  showDeliverySection: false,
  showWhatsAppButton: true,
  showOrderTracking: true,
  freeShippingThresholdDzd: 0,
  defaultDeliveryDelay: '24h - 72h',
  footerDescFr: 'Atelier de Couture & Prêt-à-Porter Féminin — Alger - Chéraga • 58 Wilayas',
  footerDescAr: 'دار الأزياء الراقية والخياطة التقليدية — الجزائر - الشراقة • 58 ولاية',
  footerDescEn: 'Haute Couture & Ready-to-Wear Atelier — Algiers - Cheraga • 58 Wilayas',
  sizeGuideFr: 'S (36-38) • M (38-40) • L (42-44) • XL (44-46) • XXL (48+). Abayas : 52 (1m55-1m60), 54 (1m61-1m66), 56 (1m67-1m72), 58 (1m73+).',
  sizeGuideAr: 'S (36-38) • M (38-40) • L (42-44) • XL (44-46). العبايات: 52، 54، 56، 58 حسب الطول.',
  sizeGuideEn: 'S (36-38) • M (38-40) • L (42-44) • XL (44-46) • XXL (48+). Abayas: 52, 54, 56, 58 by height.',
};

let cachedSettings: { data: SiteSettingsData; expiresAt: number } | null = null;

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const now = Date.now();
  if (cachedSettings && now < cachedSettings.expiresAt) {
    return cachedSettings.data;
  }
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const data = row ? { ...DEFAULT_SITE_SETTINGS, ...row } : DEFAULT_SITE_SETTINGS;
    cachedSettings = { data, expiresAt: now + 60_000 };
    return data;
  } catch {
    return cachedSettings?.data || DEFAULT_SITE_SETTINGS;
  }
}