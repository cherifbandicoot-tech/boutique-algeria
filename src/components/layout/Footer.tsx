'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-[#141414]/10 bg-white/50 mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-start">
          <p className="font-serif text-xl tracking-[0.18em] font-semibold">{t('brand')}</p>
          <p className="text-xs text-[#141414]/60 mt-1">
            © {new Date().getFullYear()} — Alger • Oran • Constantine • 58 Wilayas
          </p>
        </div>

        <a
          href="https://wa.me/213550000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest hover:bg-[#141414] transition-colors"
        >
          <MessageCircle size={15} />
          <span>WhatsApp Atelier</span>
        </a>
      </div>
    </footer>
  );
}