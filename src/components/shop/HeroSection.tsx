'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Sparkles, Truck, ShieldCheck, Eye, Search, ShoppingBag,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useSiteSettings } from './SiteSettingsContext';

export interface ProductCardItem {
  id: string;
  slug?: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  priceDzd: number;
  compareAtPriceDzd?: number | null;
  categoryId?: string;
  categoryNameFr?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  isFeatured?: boolean;
  sizes: string[];
  totalStock?: number;
  img: string;
}

export interface CategoryItem {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
}

export function HeroSection({
  products,
  categories = [],
}: {
  products: ProductCardItem[];
  categories?: CategoryItem[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { addItem } = useCart();
  const settings = useSiteSettings();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [quickOpenId, setQuickOpenId] = useState<string | null>(null);

  const badge = locale === 'ar' ? settings.heroBadgeAr : locale === 'en' ? settings.heroBadgeEn : settings.heroBadgeFr;
  const heroTitle = locale === 'ar' ? settings.heroTitleAr : locale === 'en' ? settings.heroTitleEn : settings.heroTitleFr;
  const heroSubtitle = locale === 'ar' ? settings.heroSubtitleAr : locale === 'en' ? settings.heroSubtitleEn : settings.heroSubtitleFr;
  const heroCta = locale === 'ar' ? settings.heroCtaAr : locale === 'en' ? settings.heroCtaEn : settings.heroCtaFr;

  const f1 = locale === 'ar' ? settings.feature1TitleAr : locale === 'en' ? settings.feature1TitleEn : settings.feature1TitleFr;
  const f2 = locale === 'ar' ? settings.feature2TitleAr : locale === 'en' ? settings.feature2TitleEn : settings.feature2TitleFr;
  const f3 = locale === 'ar' ? settings.feature3TitleAr : locale === 'en' ? settings.feature3TitleEn : settings.feature3TitleFr;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      p.titleFr.toLowerCase().includes(q) ||
      p.titleAr.toLowerCase().includes(q) ||
      p.titleEn.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const marqueeItems =
    locale === 'ar'
      ? ['دار نيرافا للأزياء الراقية', 'توصيل سريع 58 ولاية', 'الدفع نقداً عند الاستلام', 'تطريز يدوي أصيل', 'توصيل مع E-com Delivery']
      : ['HAUTE COUTURE ALGÉRIENNE', 'LIVRAISON EXPRESS 58 WILAYAS', 'PAIEMENT À LA LIVRAISON', 'BRODERIE ARTISANALE', 'PARTENAIRE E-COM DELIVERY'];

  return (
    <div className="overflow-hidden">
      {settings.showHero && (
        <section className="relative min-h-[86vh] flex items-center pt-28 pb-16">
          <motion.div
            animate={{ y: [0, -18, 0], scale: [1, 1.07, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            style={{ backgroundColor: `${settings.accentColor}26` }}
            className="absolute top-12 right-10 w-96 h-96 rounded-full ur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
            style={{ backgroundColor: `${settings.primaryColor}14` }}
            className="absolute bottom-4 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          />

          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-6 z-10 text-start">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ borderColor: `${settings.accentColor}66`, color: settings.accentColor }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-white/85 backdrop-blur-xs text-xs uppercase tracking-[0.2em] font-medium shadow-xs"
              >
                <Sparkles size={13} />
                <span>{badge}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium leading-[1.12]"
              >
                {heroTitle}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="text-base sm:text-lg opacity-75 max-w-lg leading-relaxed"
              >
                {heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.3 }}
                className="pt-2 flex flex-wrap gap-3"
              >
                <motion.a
                  href="#collections"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ backgroundColor: settings.primaryColor }}
                  className="inline-flex items-center gap-3 text-white px-8 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-semibold shadow-xl transition-shadow"
                >
                  <span>{heroCta}</span>
                  <ArrowIcon size={16} />
                </motion.a>
                {settings.showOrderTracking && (
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={`/${locale}/track`}
                      className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-black/20 bg-white/85 backdrop-blur-xs text-xs uppercase tracking-[0.16em] font-semibold hover:bg-white transition-colors"
                    >
                      <span>{locale === 'ar' ? 'تتبع طلبي' : 'Suivre ma commande'}</span>
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {settings.showFeatures && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.8 }}
                  className="pt-8 grid grid-cols-3 gap-4 border-t border-black/10 text-xs opacity-80"
                >
                  <div className="flex items-center gap-2"><Truck size={16} style={{ color: settings.accentColor }} className="shrink-0" /><span>{f1}</span></div>
                  <div className="flex items-center gap-2"><ShieldCheck size={16} style={{ color: settings.accentColor }} className="shrink-0" /><span>{f2}</span></div>
                  <div className="flex items-center gap-2"><Sparkles size={16} style={{ color: settings.accentColor }} className="shrink-0" /><span>{f3}</span></div>
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.15 }}
              className="md:col-span-5 flex justify-center relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="relative w-full max-w-[390px] h-[470px] sm:h-[530px] rounded-[2.2rem] overflow-hidden shadow-2xl border-2 border-white/70 bg-stone-100"
              >
                <Image
                  src={settings.heroImageUrl}
                  alt={heroTitle}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 390px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-lg"
                >
                  <div>
                    <p className="font-serif font-semibold text-sm text-black">
                      {locale === 'ar' ? settings.brandNameAr : settings.brandName}
                    </p>
                    <p className="text-[11px] text-black/65">58 Wilayas • E-com Delivery</p>
                  </div>
                  <span
                    style={{ backgroundColor: settings.primaryColor }}
                    className="px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    COD
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      <div
        style={{ backgroundColor: settings.primaryColor }}
        className="py-3.5 text-[#FAF8F5] overflow-hidden border-y border-white/15"
      >
        <motion.div
          animate={{ x: isRtl ? ['0%', '50%'] : ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
          className="flex items-center gap-10 whitespace-nowrap w-max text-[11px] uppercase tracking-[0.25em] font-medium"
        >
          {[...marqueeItems, ...marqueeItems].map((txt, idx) => (
            <span key={idx} className="inline-flex items-center gap-4">
              <Sparkles size={11} style={{ color: settings.accentColor }} />
              <span>{txt}</span>
            </span>
          ))}
        </motion.div>
      </div>

      <section id="collections" className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-semibold" style={{ color: settings.accentColor }}>
              {locale === 'ar' ? 'تشكيلة حصرية' : 'Sélection Exclusive'}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-medium mt-1">{t('nav.collections')}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {settings.showSearch && (
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ar' ? 'ابحثي عن موديل...' : 'Rechercher une pièce...'}
                  className="pl-9 pr-4 py-2.5 rounded-full bg-white border border-black/15 text-xs focus:outline-none w-56 shadow-2xs"
                />
              </div>
            )}

            {settings.showCategoryFilter && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    selectedCategory === 'ALL' ? 'bg-black text-white border-black shadow-sm' : 'bg-white border-black/15 hover:border-black/40'
                  }`}
                >
                  {locale === 'ar' ? 'الكل' : 'Tout'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      selectedCategory === cat.id ? 'bg-black text-white border-black shadow-sm' : 'bg-white border-black/15 hover:border-black/40'
                    }`}
                  >
                    {locale === 'ar' ? cat.nameAr : locale === 'en' ? cat.nameEn : cat.nameFr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((item, idx) => {
              const title = locale === 'ar' ? item.titleAr : locale === 'en' ? item.titleEn : item.titleFr;
              const linkHref = item.slug ? `/${locale}/products/${item.slug}` : `/${locale}/products/${item.id}`;
              const hasDiscount = item.compareAtPriceDzd && item.compareAtPriceDzd > item.priceDzd;
              const isQuickOpen = quickOpenId === item.id;

              return (
                <motion.article
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.25) }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-stone-200 mb-4 shadow-md border border-black/5">
                    <Link href={linkHref}>
                      <Image
                        src={item.img}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>

                    {hasDiscount && (
                      <span
                        style={{ backgroundColor: settings.primaryColor }}
                        className="absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm"
                      >
                        -{Math.round(((item.compareAtPriceDzd! - item.priceDzd) / item.compareAtPriceDzd!) * 100)}%
                      </span>
                    )}

                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickOpenId(isQuickOpen ? null : item.id)}
                        className="md:hidden p-2.5 rounded-full bg-white/95 text-black shadow-md"
                        aria-label="Ajout rapide"
                      >
                        <ShoppingBag size={15} />
                      </button>
                      <Link
                        href={linkHref}
                        className="p-2.5 rounded-full bg-white/95 text-black hover:bg-black hover:text-white transition-colors shadow-md md:opacity-0 md:group-hover:opacity-100"
                        title="Voir le produit"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>

                    <div
                      className={`absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 transition-all duration-300 shadow-xl ${
                        isQuickOpen
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-4 opacity-0 pointer-events-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:pointer-events-auto'
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-center opacity-60 mb-2 font-medium">
                        {t('product.selectSize')}
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {item.sizes.map((size) => (
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            key={size}
                            onClick={() => {
                              setQuickOpenId(null);
                              addItem({
                                productId: item.id,
                                slug: item.slug,
                                titleFr: item.titleFr,
                                titleAr: item.titleAr,
                                titleEn: item.titleEn,
                                priceDzd: item.priceDzd,
                                size,
                                image: item.img,
                              });
                            }}
                            className="py-2 rounded-lg text-xs font-semibold border border-black/15 hover:bg-black hover:text-white transition-colors"
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 px-1">
                    <Link href={linkHref} className="hover:opacity-75 transition-opacity">
                      <h3 className="font-medium text-base">{title}</h3>
                      {item.categoryNameFr && (
                        <p className="text-[11px] opacity-55">
                          {locale === 'ar' ? item.categoryNameAr : locale === 'en' ? item.categoryNameEn : item.categoryNameFr}
                        </p>
                      )}
                    </Link>
                    <div className="text-end shrink-0">
                      <span className="text-sm font-semibold" style={{ color: settings.accentColor }}>
                        {item.priceDzd.toLocaleString()} {t('product.currency')}
                      </span>
                      {hasDiscount && (
                        <p className="text-[11px] line-through opacity-45">
                          {item.compareAtPriceDzd!.toLocaleString()} {t('product.currency')}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}