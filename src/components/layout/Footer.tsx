'use client';

import { MessageCircle, ShieldCheck, Truck, Sparkles, Phone, Mail, MapPin, PackageSearch } from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useSiteSettings } from '@/components/shop/SiteSettingsContext';

export function Footer() {
  const locale = useLocale();
  const settings = useSiteSettings();

  const brand = locale === 'ar' ? settings.brandNameAr : settings.brandName;
  const desc = locale === 'ar' ? settings.footerDescAr : locale === 'en' ? settings.footerDescEn : settings.footerDescFr;
  const f1 = locale === 'ar' ? settings.feature1TitleAr : locale === 'en' ? settings.feature1TitleEn : settings.feature1TitleFr;
  const f2 = locale === 'ar' ? settings.feature2TitleAr : locale === 'en' ? settings.feature2TitleEn : settings.feature2TitleFr;
  const f3 = locale === 'ar' ? settings.feature3TitleAr : locale === 'en' ? settings.feature3TitleEn : settings.feature3TitleFr;
  const address = locale === 'ar' ? settings.addressAr : settings.addressFr;

  return (
    <footer className="border-t border-black/10 bg-white/70 mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 border-b border-black/10 grid sm:grid-cols-3 gap-6 text-xs text-center sm:text-start">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <Truck size={20} style={{ color: settings.accentColor }} />
          <div>
            <p className="font-semibold">{f1}</p>
            <p className="text-[11px] opacity-60">E-com Delivery • 58 Wilayas</p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <ShieldCheck size={20} style={{ color: settings.accentColor }} />
          <div>
            <p className="font-semibold">{f2}</p>
            <p className="text-[11px] opacity-60">
              {locale === 'ar' ? 'الدفع بعد معاينة الطلبية' : 'Vérification du colis avant paiement'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <Sparkles size={20} style={{ color: settings.accentColor }} />
          <div>
            <p className="font-semibold">{f3}</p>
            <p className="text-[11px] opacity-60">
              {locale === 'ar' ? 'جودة عالية وتفصيل متقن' : 'Finitions soignées & qualité garantie'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="text-center lg:text-start space-y-2">
          <p className="font-serif text-2xl tracking-[0.2em] font-semibold">{brand}</p>
          <p className="text-xs opacity-65">{desc}</p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs opacity-75 pt-1">
            {settings.contactPhone && (
              <span className="inline-flex items-center gap-1"><Phone size={12} /> {settings.contactPhone}</span>
            )}
            {settings.contactEmail && (
              <span className="inline-flex items-center gap-1"><Mail size={12} /> {settings.contactEmail}</span>
            )}
            {address && (
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {address}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs pt-1">
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Instagram</a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Facebook</a>
            )}
            {settings.tiktokUrl && (
              <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">TikTok</a>
            )}
            {settings.showOrderTracking && (
              <Link href={`/${locale}/track`} className="inline-flex items-center gap-1 underline hover:opacity-70">
                <PackageSearch size={12} />
                {locale === 'ar' ? 'تتبع طلبي' : 'Suivre ma commande'}
              </Link>
            )}
          </div>
        </div>

        <a
          href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: settings.primaryColor }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
        >
          <MessageCircle size={15} />
          <span>{locale === 'ar' ? 'تواصلي معنا عبر واتساب' : 'Contacter sur WhatsApp'}</span>
        </a>
      </div>
    </footer>
  );
}