'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSiteSettings } from '@/components/shop/SiteSettingsContext';

export function WhatsAppButton() {
  const locale = useLocale();
  const settings = useSiteSettings();

  if (!settings.showWhatsAppButton || !settings.whatsappNumber) return null;

  const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const brand = locale === 'ar' ? settings.brandNameAr : settings.brandName;
  const defaultText =
    locale === 'ar'
      ? `السلام عليكم ${brand}، أود الاستفسار حول القطع المتوفرة.`
      : `Bonjour ${brand}, je souhaite me renseigner sur vos pièces disponibles.`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(defaultText)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ backgroundColor: settings.primaryColor }}
      className="fixed bottom-6 right-6 z-40 text-white p-4 rounded-full shadow-2xl hover:opacity-90 transition-opacity flex items-center justify-center border-2 border-white/40"
      aria-label="WhatsApp"
    >
      <MessageCircle size={22} />
    </motion.a>
  );
}