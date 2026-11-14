'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ShoppingBag, Globe, Menu, X, Sparkles, PackageSearch } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartContext';
import { useSiteSettings } from '@/components/shop/SiteSettingsContext';

export function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const settings = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 24, restDelta: 0.001 });

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

  const brand = locale === 'ar' ? settings.brandNameAr : settings.brandName;
  const announcement =
    locale === 'ar'
      ? settings.announcementAr
      : locale === 'en'
      ? settings.announcementEn
      : settings.announcementFr;

  return (
    <header className="fixed top-0 inset-x-0 z-40 transition-all duration-300">
      {settings.showAnnouncement && (
        <div
          style={{ backgroundColor: settings.primaryColor }}
          className="text-[#FAF8F5] py-2 px-4 text-[11px] uppercase tracking-[0.16em] font-medium text-center flex items-center justify-center gap-2"
        >
          <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Sparkles size={12} style={{ color: settings.accentColor }} className="shrink-0" />
          </motion.span>
          <span className="truncate">{announcement}</span>
        </div>
      )}

      <nav
        style={scrolled ? { backgroundColor: `${settings.bgColor}EE` } : undefined}
        className={`relative transition-all duration-500 ${
          scrolled ? 'backdrop-blur-md border-b border-black/10 py-3 shadow-xs' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex items-center justify-between gap-4">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden md:flex items-center gap-7 text-xs uppercase tracking-[0.18em] font-medium">
            <Link href={`/${locale}`} className="hover:opacity-70 transition-opacity">
              {t('nav.home')}
            </Link>
            <Link href={`/${locale}#collections`} className="hover:opacity-70 transition-opacity">
              {t('nav.collections')}
            </Link>
            {settings.showOrderTracking && (
              <Link href={`/${locale}/track`} className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <PackageSearch size={14} style={{ color: settings.accentColor }} />
                <span>{locale === 'ar' ? 'تتبع طلبي' : locale === 'en' ? 'Track Order' : 'Suivi Colis'}</span>
              </Link>
            )}
          </div>

          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 text-lg md:text-2xl font-serif tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity truncate"
          >
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={brand} className="h-9 w-auto object-contain" />
            ) : (
              <span>{brand}</span>
            )}
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs font-medium border border-black/15 rounded-full px-2 py-0.5 bg-white/80 backdrop-blur-xs">
              <Globe size={13} style={{ color: settings.accentColor }} />
              {(['fr', 'ar', 'en'] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLocale(lng)}
                  className={`px-1.5 py-0.5 rounded-full uppercase transition-colors text-[11px] ${
                    locale === lng ? 'bg-black text-white' : 'text-black/60 hover:text-black'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    style={{ backgroundColor: settings.accentColor }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Luxury scroll progress bar */}
        <motion.div
          style={{ scaleX, backgroundColor: settings.accentColor, transformOrigin: '0%' }}
          className="absolute bottom-0 inset-x-0 h-[2px] pointer-events-none"
        />

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ backgroundColor: settings.bgColor }}
              className="md:hidden border-b border-black/10 px-6 py-4 flex flex-col gap-3 text-xs uppercase tracking-widest overflow-hidden"
            >
              <Link href={`/${locale}`} onClick={() => setMobileOpen(false)}>{t('nav.home')}</Link>
              <Link href={`/${locale}#collections`} onClick={() => setMobileOpen(false)}>{t('nav.collections')}</Link>
              {settings.showOrderTracking && (
                <Link href={`/${locale}/track`} onClick={() => setMobileOpen(false)}>
                  {locale === 'ar' ? 'تتبع طلبي' : 'Suivi de Commande'}
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}