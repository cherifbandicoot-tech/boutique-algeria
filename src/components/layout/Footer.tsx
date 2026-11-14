'use client';

import { MessageCircle, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-[#141414]/10 bg-white/60 mt-24">
      {/* 3 Pillars of Trust */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 border-b border-[#141414]/10 grid sm:grid-cols-3 gap-6 text-xs text-[#141414]/80 text-center sm:text-start">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <Truck size={20} className="text-[#C5A059]" />
          <div>
            <p className="font-semibold text-[#141414]">Livraison 58 Wilayas</p>
            <p className="text-[11px] text-[#141414]/60">Partenaire officiel E-com Delivery</p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <ShieldCheck size={20} className="text-[#C5A059]" />
          <div>
            <p className="font-semibold text-[#141414]">Paiement à la Livraison</p>
            <p className="text-[11px] text-[#141414]/60">Vérifiez votre colis avant d'encaisser</p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <Sparkles size={20} className="text-[#C5A059]" />
          <div>
            <p className="font-semibold text-[#141414]">Haute Couture Algérienne</p>
            <p className="text-[11px] text-[#141414]/60">Finitions soignées & broderies d'exception</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-start">
          <p className="font-serif text-2xl tracking-[0.2em] font-semibold text-[#141414]">{t('brand')}</p>
          <p className="text-xs text-[#141414]/60 mt-1">
            Atelier de Couture & Prêt-à-Porter Féminin — Alger • 58 Wilayas
          </p>
        </div>

        <a
          href="https://wa.me/213550000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#141414] transition-colors shadow-sm"
        >
          <MessageCircle size={15} />
          <span>Contacter l'Atelier sur WhatsApp</span>
        </a>
      </div>
    </footer>
  );
}