'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';

export function WhatsAppButton() {
  const locale = useLocale();

  const phone = '213550000000'; // Replace with your sister's real WhatsApp number!
  const defaultText =
    locale === 'ar'
      ? 'السلام عليكم، أود الاستفسار حول فساتينكم المتوفرة.'
      : 'Bonjour Maison Yasmine, je souhaite me renseigner sur vos pièces disponibles.';

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
      className="fixed bottom-6 right-6 z-40 bg-[#13382C] text-white p-4 rounded-full shadow-2xl hover:bg-[#141414] transition-colors flex items-center justify-center border-2 border-white/40"
      aria-label="WhatsApp"
    >
      <MessageCircle size={22} />
    </motion.a>
  );
}