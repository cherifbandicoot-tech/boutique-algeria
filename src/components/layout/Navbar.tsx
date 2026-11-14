'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Globe, Menu, X, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartContext';

export function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/') || `/${newLocale}`);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 transition-all duration-300">
      {/* Top Delivery Announcement Ribbon */}
      <div className="bg-[#13382C] text-[#FAF8F5] py-2 px-4 text-[11px] uppercase tracking-[0.2em] font-medium text-center flex items-center justify-center gap-2">
        <Sparkles size={12} className="text-[#C5A059]" />
        <span>{t('topBanner')}</span>
      </div>

      <nav
        className={`transition-all duration-500 ${
          scrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#141414]/10 py-3 shadow-xs'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#141414]"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium">
            <Link href={`/${locale}`} className="hover:text-[#C5A059] transition-colors">
              {t('nav.home')}
            </Link>
            <Link href={`/${locale}#collections`} className="hover:text-[#C5A059] transition-colors">
              {t('nav.collections')}
            </Link>
          </div>

          {/* Maison Nerava Brand Logo */}
          <Link
            href={`/${locale}`}
            className="text-xl md:text-2xl font-serif tracking-[0.22em] font-semibold text-[#141414] hover:opacity-90 transition-opacity"
          >
            {t('brand')}
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 text-xs font-medium border border-[#141414]/15 rounded-full px-2 py-0.5 bg-white/70">
              <Globe size={13} className="text-[#C5A059]" />
              {(['fr', 'ar', 'en'] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLocale(lng)}
                  className={`px-1.5 py-0.5 rounded-full uppercase transition-colors text-[11px] ${
                    locale === lng ? 'bg-[#141414] text-white' : 'text-[#141414]/60 hover:text-[#141414]'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>

            {/* Shopping Bag Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-[#141414]/5 transition-colors"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C5A059] text-white text-[10px] flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-b border-[#141414]/10 px-6 py-4 flex flex-col gap-4 text-xs uppercase tracking-widest">
            <Link href={`/${locale}`} onClick={() => setMobileOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link href={`/${locale}#collections`} onClick={() => setMobileOpen(false)}>
              {t('nav.collections')}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}