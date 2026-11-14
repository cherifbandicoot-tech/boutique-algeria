'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Sparkles, Truck, ShieldCheck, Eye, Search, MapPin, Building2, Clock,
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

interface WilayaFeeRow {
  code: number;
  nameFr: string;
  nameAr: string;
  homeDeliveryDzd: number;
  stopDeskDzd: number;
  delay: string;
  isActive: boolean;
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
  const [wilayas, setWilayas] = useState<WilayaFeeRow[]>([]);
  const [wilayaSearch, setWilayaSearch] = useState('');

  useEffect(() => {
    if (!settings.showDeliverySection) return;
    fetch('/api/delivery-fees?all=true')
      .then((r) => r.json())
      .then((d) => setWilayas(d.wilayas || []))
      .catch(() => {});
  }, [settings.showDeliverySection]);

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

  const filteredWilayas = wilayas.filter((w) => {
    if (!w.isActive) return false;
    const q = wilayaSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      w.nameFr.toLowerCase().includes(q) ||
      w.nameAr.includes(q) ||
      String(w.code).padStart(2, '0').includes(q)
    );
  });

  return (
    <div className="overflow-hidden">
      {settings.showHero && (
        <section className="relative min-h-[82vh] flex items-center pt-28 pb-14">
          <div
            style={{ backgroundColor: `${settings.accentColor}26` }}
            className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          />

          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-6 z-10 text-start">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ borderColor: `${settings.accentColor}66`, color: settings.accentColor }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-white/80 text-xs uppercase tracking-[0.2em] font-medium"
              >
                <Sparkles size={13} />
                <span>{badge}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium leading-[1.15]"
              >
                {heroTitle}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-lg opacity-75 max-w-lg leading-relaxed"
              >
                {heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="pt-2 flex flex-wrap gap-3"
              >
                <motion.a
                  href="#collections"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ backgroundColor: settings.primaryColor }}
                  className="inline-flex items-center gap-3 text-white px-8 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  <span>{heroCta}</span>
                  <ArrowIcon size={16} />
                </motion.a>
                {settings.showOrderTracking && (
                  <Link
                    href={`/${locale}/track`}
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-black/20 bg-white/75 text-xs uppercase tracking-[0.16em] font-semibold hover:bg-white transition-colors"
                  >
                    <span>{locale === 'ar' ? 'تتبع طلبي' : 'Suivre ma commande'}</span>
                  </Link>
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.15 }}
              className="md:col-span-5 flex justify-center"
            >
              <div className="relative w-full max-w-[380px] h-[460px] sm:h-[520px] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/60 bg-stone-100">
                <Image
                  src={settings.heroImageUrl}
                  alt={heroTitle}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Collections + Search + Category Filter */}
      <section id="collections" className={`max-w-7xl mx-auto px-6 md:px-12 ${settings.showHero ? 'py-16' : 'pt-32 pb-16'}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-medium">{t('nav.collections')}</h2>
            <p className="text-xs opacity-60 mt-1">
              {filteredProducts.length} {locale === 'ar' ? 'قطعة متوفرة' : 'pièces disponibles'}
            </p>
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
                  className="pl-9 pr-4 py-2.5 rounded-full bg-white border border-black/15 text-xs focus:outline-none w-56"
                />
              </div>
            )}

            {settings.showCategoryFilter && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    selectedCategory === 'ALL' ? 'bg-black text-white border-black' : 'bg-white border-black/15'
                  }`}
                >
                  {locale === 'ar' ? 'الكل' : 'Tout'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                      selectedCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white border-black/15'
                    }`}
                  >
                    {locale === 'ar' ? cat.nameAr : locale === 'en' ? cat.nameEn : cat.nameFr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((item, idx) => {
            const title = locale === 'ar' ? item.titleAr : locale === 'en' ? item.titleEn : item.titleFr;
            const linkHref = item.slug ? `/${locale}/products/${item.slug}` : `/${locale}/products/${item.id}`;
            const hasDiscount = item.compareAtPriceDzd && item.compareAtPriceDzd > item.priceDzd;

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: Math.min(idx * 0.06, 0.3) }}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 mb-4 shadow-sm border border-black/5">
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
                      className="absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    >
                      -{Math.round(((item.compareAtPriceDzd! - item.priceDzd) / item.compareAtPriceDzd!) * 100)}%
                    </span>
                  )}

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={linkHref}
                      className="p-2.5 rounded-full bg-white/90 text-black hover:bg-black hover:text-white transition-colors shadow-md block"
                      title="Voir le produit"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>

                  <div className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                    <p className="text-[10px] uppercase tracking-widest text-center opacity-60 mb-2 font-medium">
                      {t('product.selectSize')}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {item.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            addItem({
                              productId: item.id,
                              slug: item.slug,
                              titleFr: item.titleFr,
                              titleAr: item.titleAr,
                              titleEn: item.titleEn,
                              priceDzd: item.priceDzd,
                              size,
                              image: item.img,
                            })
                          }
                          className="py-2 rounded-lg text-xs font-semibold border border-black/15 hover:bg-black hover:text-white transition-colors"
                        >
                          {size}
                        </button>
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
        </div>
      </section>

      {/* Live 58-Wilaya E-com Delivery Tariffs Explorer */}
      {settings.showDeliverySection && wilayas.length > 0 && (
        <section id="delivery" className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-black/10 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold" style={{ color: settings.accentColor }}>
                  <Truck size={14} />
                  <span>E-com Delivery • 58 Wilayas</span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mt-1">
                  {locale === 'ar' ? 'أسعار ومواعيد التوصيل لجميع الولايات' : 'Tarifs & Délais de Livraison par Wilaya'}
                </h2>
                {settings.freeShippingThresholdDzd > 0 && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Livraison gratuite dès {settings.freeShippingThresholdDzd.toLocaleString()} DZD d’achat !
                  </p>
                )}
              </div>

              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  value={wilayaSearch}
                  onChange={(e) => setWilayaSearch(e.target.value)}
                  placeholder={locale === 'ar' ? 'ابحثي بالولاية أو الرقم...' : 'Chercher une wilaya (ex: Alger, 31)...'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-full bg-stone-50 border border-black/15 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredWilayas.map((w) => (
                <div key={w.code} className="p-3.5 rounded-2xl bg-stone-50/80 border border-black/8 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      <MapPin size={12} style={{ color: settings.accentColor }} />
                      <span>{String(w.code).padStart(2, '0')} - {locale === 'ar' ? w.nameAr : w.nameFr}</span>
                    </p>
                    <p className="text-[11px] opacity-60 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {w.delay}
                    </p>
                  </div>
                  <div className="text-end shrink-0 space-y-0.5">
                    <p className="font-semibold flex items-center justify-end gap-1">
                      <Truck size={11} /> {w.homeDeliveryDzd} DZD
                    </p>
                    <p className="text-[11px] opacity-75 flex items-center justify-end gap-1">
                      <Building2 size={11} /> {w.stopDeskDzd} DZD
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}