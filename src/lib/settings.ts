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
  brandNameAr: 'Ø¯Ø§Ø± Ù†ÙŠØ±Ø§ÙØ§',
  logoUrl: null,
  whatsappNumber: '213770312656',
  contactPhone: '+213 770 31 26 56',
  contactEmail: 'contact@maisonnerava.dz',
  addressFr: 'Alger - ChÃ©raga â€¢ Livraison 58 Wilayas',
  addressAr: 'Ø§Ù„Ø¬Ø²Ø§Ø¦Ø± Ø§Ù„Ø¹Ø§ØµÙ…Ø© - Ø§Ù„Ø´Ø±Ø§Ù‚Ø© â€¢ ØªÙˆØµÙŠÙ„ 58 ÙˆÙ„Ø§ÙŠØ©',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  bgColor: '#FAF8F5',
  textColor: '#141414',
  accentColor: '#C5A059',
  primaryColor: '#13382C',
  showAnnouncement: true,
  announcementFr: 'Livraison Express 58 Wilayas avec E-com Delivery â€¢ Paiement Ã  la Livraison',
  announcementAr: 'ØªÙˆØµÙŠÙ„ Ø³Ø±ÙŠØ¹ Ø¥Ù„Ù‰ 58 ÙˆÙ„Ø§ÙŠØ© Ù…Ø¹ E-com Delivery â€¢ Ø§Ù„Ø¯ÙØ¹ Ù†Ù‚Ø¯Ø§Ù‹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…',
  announcementEn: 'Express 58 Wilayas Delivery with E-com Delivery â€¢ Cash on Delivery',
  showHero: true,
  heroBadgeFr: 'Collection Couture 2026',
  heroBadgeAr: 'ØªØ´ÙƒÙŠÙ„Ø© ÙƒÙˆØªÙˆØ± 2026',
  heroBadgeEn: '2026 Couture Collection',
  heroTitleFr: "L'Ã‰lÃ©gance AlgÃ©rienne RÃ©inventÃ©e",
  heroTitleAr: 'Ø§Ù„Ø£Ù†Ø§Ù‚Ø© Ø§Ù„Ø¬Ø²Ø§Ø¦Ø±ÙŠØ© Ø¨Ù„Ù…Ø³Ø© Ø±Ø§Ù‚ÙŠØ©',
  heroTitleEn: 'Algerian Elegance Reimagined',
  heroSubtitleFr: 'Karakou brodÃ©s au fil dâ€™or, caftans fluides et crÃ©ations modernes livrÃ©s avec soin chez vous.',
  heroSubtitleAr: 'ÙƒØ§Ø±Ø§ÙƒÙˆ Ù…Ø·Ø±Ø² Ø¨Ø§Ù„ÙØªÙ„Ø© Ø§Ù„Ø°Ù‡Ø¨ÙŠØ©ØŒ Ù‚ÙØ§Ø·ÙŠÙ† ÙØ§Ø®Ø±Ø© ÙˆØªØµØ§Ù…ÙŠÙ… Ø¹ØµØ±ÙŠØ© ØªØµÙ„ Ø¥Ù„Ù‰ Ø¨Ø§Ø¨ Ø¨ÙŠØªÙƒ.',
  heroSubtitleEn: 'Hand-embroidered Karakou, luxury caftans, and modern modest wear delivered across Algeria.',
  heroCtaFr: 'DÃ©couvrir la Collection',
  heroCtaAr: 'Ø§ÙƒØªØ´ÙÙŠ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©',
  heroCtaEn: 'Explore Collection',
  heroImageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85',
  showFeatures: true,
  feature1TitleFr: 'Livraison 58 Wilayas',
  feature1TitleAr: 'ØªÙˆØµÙŠÙ„ 58 ÙˆÙ„Ø§ÙŠØ©',
  feature1TitleEn: '58 Wilayas Delivery',
  feature2TitleFr: 'Paiement Ã  la livraison',
  feature2TitleAr: 'Ø§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…',
  feature2TitleEn: 'Cash on Delivery',
  feature3TitleFr: 'Savoir-faire Artisanal',
  feature3TitleAr: 'ØªØ·Ø±ÙŠØ² ÙŠØ¯ÙˆÙŠ Ø£ØµÙŠÙ„',
  feature3TitleEn: 'Artisanal Heritage',
  showSearch: true,
  showCategoryFilter: true,
  showDeliverySection: true,
  showWhatsAppButton: true,
  showOrderTracking: true,
  freeShippingThresholdDzd: 0,
  defaultDeliveryDelay: '24h - 72h',
  footerDescFr: 'Atelier de Couture & PrÃªt-Ã -Porter FÃ©minin â€” Alger - ChÃ©raga â€¢ 58 Wilayas',
  footerDescAr: 'Ø¯Ø§Ø± Ø§Ù„Ø£Ø²ÙŠØ§Ø¡ Ø§Ù„Ø±Ø§Ù‚ÙŠØ© ÙˆØ§Ù„Ø®ÙŠØ§Ø·Ø© Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠØ© â€” Ø§Ù„Ø¬Ø²Ø§Ø¦Ø± - Ø§Ù„Ø´Ø±Ø§Ù‚Ø© â€¢ 58 ÙˆÙ„Ø§ÙŠØ©',
  footerDescEn: 'Haute Couture & Ready-to-Wear Atelier â€” Algiers - Cheraga â€¢ 58 Wilayas',
  sizeGuideFr: 'S (36-38) â€¢ M (38-40) â€¢ L (42-44) â€¢ XL (44-46) â€¢ XXL (48+). Abayas : 52 (1m55-1m60), 54 (1m61-1m66), 56 (1m67-1m72), 58 (1m73+).',
  sizeGuideAr: 'S (36-38) â€¢ M (38-40) â€¢ L (42-44) â€¢ XL (44-46). Ø§Ù„Ø¹Ø¨Ø§ÙŠØ§Øª: 52ØŒ 54ØŒ 56ØŒ 58 Ø­Ø³Ø¨ Ø§Ù„Ø·ÙˆÙ„.',
  sizeGuideEn: 'S (36-38) â€¢ M (38-40) â€¢ L (42-44) â€¢ XL (44-46) â€¢ XXL (48+). Abayas: 52, 54, 56, 58 by height.',
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
} });
    if (!row) return DEFAULT_SITE_SETTINGS;
    return { ...DEFAULT_SITE_SETTINGS, ...row };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}