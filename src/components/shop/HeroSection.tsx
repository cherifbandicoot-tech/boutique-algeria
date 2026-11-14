'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useCart } from './CartContext';

export interface ProductCardItem {
  id: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  priceDzd: number;
  sizes: string[];
  img: string;
}

export function HeroSection({ products }: { products: ProductCardItem[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { addItem } = useCart();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <>
      <section className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 md:px-10 grid md:grid-cols-12 gap-10 items-center w-full">
          <div className="md:col-span-6 space-y-6 z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-white/70 text-xs uppercase tracking-[0.18em] text-[#9A7835]"
            >
              <Sparkles size={13} />
              <span>{t('hero.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium leading-[1.12] tracking-tight text-[#141414]"
            >
              {t('hero.title')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2 }}
              className="text-base md:text-lg text-[#141414]/70 max-w-lg leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.3 }} className="pt-2">
              <motion.a
                href="#collections"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 bg-[#141414] text-white px-7 py-4 rounded-full text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#13382C] transition-colors shadow-lg shadow-[#141414]/10"
              >
                <span>{t('hero.cta')}</span>
                <ArrowIcon size={16} />
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="pt-8 grid grid-cols-3 gap-4 border-t border-[#141414]/10 text-xs text-[#141414]/75"
            >
              <div className="flex items-center gap-2"><Truck size={16} className="text-[#C5A059] shrink-0" /><span>{t('features.delivery')}</span></div>
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#C5A059] shrink-0" /><span>{t('features.cod')}</span></div>
              <div className="flex items-center gap-2"><Sparkles size={16} className="text-[#C5A059] shrink-0" /><span>{t('features.craft')}</span></div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-6 relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-[#C5A059]/20">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} className="w-full h-full relative">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
                  alt="Algerian Luxury Fashion"
                  fill
                  priority
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="collections" className="max-w-7xl mx-auto px-5 md:px-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="flex items-end justify-between mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-medium">{t('nav.collections')}</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item, idx) => {
            const title = locale === 'ar' ? item.titleAr : locale === 'en' ? item.titleEn : item.titleFr;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 mb-4">
                  <Image src={item.img} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur rounded-2xl p-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                    <p className="text-[10px] uppercase tracking-widest text-center text-[#141414]/60 mb-2">{t('product.selectSize')}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {item.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            addItem({
                              productId: item.id,
                              titleFr: item.titleFr,
                              titleAr: item.titleAr,
                              titleEn: item.titleEn,
                              priceDzd: item.priceDzd,
                              size,
                              image: item.img,
                            })
                          }
                          className="py-2 rounded-lg text-xs font-semibold border border-[#141414]/15 hover:bg-[#141414] hover:text-white transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">{title}</h3>
                  <span className="text-sm font-semibold text-[#9A7835]">
                    {item.priceDzd.toLocaleString()} {t('product.currency')}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </>
  );
}