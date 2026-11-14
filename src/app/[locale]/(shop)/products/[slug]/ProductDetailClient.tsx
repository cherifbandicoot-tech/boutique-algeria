'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ShieldCheck, Sparkles, Ruler, Building2, Clock, Zap } from 'lucide-react';
import { useCart } from '@/components/shop/CartContext';
import { useSiteSettings } from '@/components/shop/SiteSettingsContext';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';

interface ProductVariant {
  id: string;
  size: string;
  colorName: string;
  colorHex: string;
  stockQuantity: number;
}

interface ProductImage {
  id: string;
  url: string;
}

interface ProductData {
  id: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionEn: string;
  priceDzd: number;
  compareAtPriceDzd?: number | null;
  category?: { nameFr: string; nameAr: string; nameEn: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export function ProductDetailClient({ product, locale }: { product: ProductData; locale: string }) {
  const { addItem } = useCart();
  const settings = useSiteSettings();

  const title = locale === 'ar' ? product.titleAr : locale === 'en' ? product.titleEn : product.titleFr;
  const description = locale === 'ar' ? product.descriptionAr : locale === 'en' ? product.descriptionEn : product.descriptionFr;

  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(new Map(product.variants.map((v) => [v.colorName, v])).values());

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.colorName || 'Standard');
  const [activeImage, setActiveImage] = useState<string>(product.images[0]?.url || '');
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [wilayaCode, setWilayaCode] = useState(16);
  const [deliveryMode, setDeliveryMode] = useState<'HOME' | 'DESK'>('HOME');
  const [feeInfo, setFeeInfo] = useState({ home: 450, desk: 300, delay: '24h (Express)' });

  useEffect(() => {
    fetch(`/api/delivery-fees?wilaya=${wilayaCode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.homeDeliveryDzd !== undefined) {
          setFeeInfo({ home: d.homeDeliveryDzd, desk: d.stopDeskDzd, delay: d.delay });
        }
      })
      .catch(() => {});
  }, [wilayaCode]);

  const currentVariant =
    product.variants.find((v) => v.size === selectedSize && v.colorName === selectedColor) ||
    product.variants.find((v) => v.size === selectedSize);
  const stock = currentVariant?.stockQuantity ?? 10;

  const activeShipping =
    settings.freeShippingThresholdDzd > 0 && product.priceDzd >= settings.freeShippingThresholdDzd
      ? 0
      : deliveryMode === 'HOME'
      ? feeInfo.home
      : feeInfo.desk;

  const sizeGuide = locale === 'ar' ? settings.sizeGuideAr : locale === 'en' ? settings.sizeGuideEn : settings.sizeGuideFr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24"
    >
      <nav className="text-xs uppercase tracking-widest opacity-55 mb-8 flex items-center gap-2">
        <Link href={`/${locale}`} className="hover:opacity-100">Accueil</Link>
        <span>/</span>
        <span>{title}</span>
      </nav>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] max-w-[540px] mx-auto rounded-3xl overflow-hidden bg-stone-100 shadow-xl border border-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage || product.images[0]?.url}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image src={activeImage || product.images[0]?.url} alt={title} fill priority className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center flex-wrap">
              {product.images.map((img) => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === img.url ? 'border-black shadow-md' : 'border-transparent opacity-60'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: settings.accentColor }}>
              {locale === 'ar' ? product.category?.nameAr : product.category?.nameFr || 'Haute Couture'}
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-medium">{title}</h1>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-semibold">
                {product.priceDzd.toLocaleString()} <span className="text-sm font-normal" style={{ color: settings.accentColor }}>DZD</span>
              </p>
              {product.compareAtPriceDzd && product.compareAtPriceDzd > product.priceDzd && (
                <p className="text-sm line-through opacity-45">{product.compareAtPriceDzd.toLocaleString()} DZD</p>
              )}
            </div>
          </div>

          <p className="text-sm opacity-75 leading-relaxed whitespace-pre-line">{description}</p>

          {colors.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider font-medium">
                {locale === 'ar' ? 'اللون' : 'Couleur'} : <strong>{selectedColor}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={c.colorName}
                    onClick={() => setSelectedColor(c.colorName)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                      selectedColor === c.colorName ? 'border-black bg-black text-white' : 'border-black/15 bg-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.colorHex }} />
                    <span>{c.colorName}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider font-medium">
              <span>{locale === 'ar' ? 'المقاس' : 'Taille'}</span>
              <button
                type="button"
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="flex items-center gap-1 hover:underline"
                style={{ color: settings.accentColor }}
              >
                <Ruler size={13} />
                <span>{locale === 'ar' ? 'دليل المقاسات' : 'Guide des tailles'}</span>
              </button>
            </div>
            <AnimatePresence>
              {showSizeGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-white border border-black/10 text-xs opacity-80 overflow-hidden"
                >
                  {sizeGuide}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    selectedSize === size ? 'bg-black text-white border-black shadow-sm' : 'bg-white border-black/15 hover:border-black'
                  }`}
                >
                  {size}
                </motion.button>
              ))}
            </div>
            <p className="text-[11px] opacity-65">
              {stock > 0 ? `Disponibilité : ${stock} en stock` : 'Rupture temporaire — sur commande'}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                titleFr: product.titleFr,
                titleAr: product.titleAr,
                titleEn: product.titleEn,
                priceDzd: product.priceDzd,
                size: selectedSize,
                colorName: selectedColor,
                image: product.images[0]?.url || '',
              })
            }
            style={{ backgroundColor: settings.primaryColor }}
            className="w-full py-4 rounded-full text-white text-xs uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            <span>{locale === 'ar' ? 'أضيفي إلى السلة — الدفع عند الاستلام' : 'Commander — Paiement à la Livraison'}</span>
          </motion.button>

          <div className="bg-white p-4 rounded-2xl border border-black/10 space-y-3 text-xs shadow-xs">
            <p className="font-semibold flex items-center gap-2">
              <Truck size={15} style={{ color: settings.accentColor }} />
              <span>{locale === 'ar' ? 'حاسبة التوصيل لولايتك' : 'Estimer la livraison dans votre Wilaya'}</span>
            </p>
            <select
              value={wilayaCode}
              onChange={(e) => setWilayaCode(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-black/10"
            >
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {String(w.code).padStart(2, '0')} - {locale === 'ar' ? w.nameAr : w.nameFr}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMode('HOME')}
                className={`py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  deliveryMode === 'HOME' ? 'bg-black text-white border-black' : 'bg-stone-50 border-black/10'
                }`}
              >
                <Truck size={12} /> Domicile ({feeInfo.home} DZD)
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('DESK')}
                className={`py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  deliveryMode === 'DESK' ? 'bg-black text-white border-black' : 'bg-stone-50 border-black/10'
                }`}
              >
                <Building2 size={12} /> Stop Desk ({feeInfo.desk} DZD)
              </button>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-black/10">
              <span className="flex items-center gap-1 opacity-70"><Clock size={12} /> {feeInfo.delay}</span>
              <span className="font-bold">
                Total estimé : {(product.priceDzd + activeShipping).toLocaleString()} DZD
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-black/10 space-y-3 text-xs opacity-75">
            <div className="flex items-center gap-3"><Truck size={17} style={{ color: settings.accentColor }} /><span>Livraison express 58 Wilayas via E-com Delivery</span></div>
            <div className="flex items-center gap-3"><ShieldCheck size={17} style={{ color: settings.accentColor }} /><span>Paiement en espèces à la livraison après vérification</span></div>
            <div className="flex items-center gap-3"><Sparkles size={17} style={{ color: settings.accentColor }} /><span>Finitions artisanales & broderies garanties</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}