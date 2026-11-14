'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Sparkles, Ruler, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/components/shop/CartContext';
import Link from 'next/link';

export function ProductDetailClient({ product, locale }: { product: any; locale: string }) {
  const isRtl = locale === 'ar';
  const { addItem } = useCart();

  const title = locale === 'ar' ? product.titleAr : locale === 'en' ? product.titleEn : product.titleFr;
  const description = locale === 'ar' ? product.descriptionAr : locale === 'en' ? product.descriptionEn : product.descriptionFr;

  const sizes = Array.from(new Set(product.variants.map((v: any) => v.size))) as string[];
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || 'Standard');
  const [activeImage, setActiveImage] = useState<string>(product.images[0]?.url || '');

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest text-[#141414]/50 mb-8 flex items-center gap-2">
        <Link href={`/${locale}`} className="hover:text-[#141414]">Accueil</Link>
        <span>/</span>
        <span className="text-[#141414]">{title}</span>
      </nav>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] max-w-[540px] mx-auto rounded-3xl overflow-hidden bg-stone-100 shadow-xl border border-[#141414]/5">
            <Image
              src={activeImage || product.images[0]?.url}
              alt={title}
              fill
              priority
              className="object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 justify-center">
              {product.images.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === img.url ? 'border-[#C5A059]' : 'border-transparent opacity-60'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#9A7835] font-semibold">
              {product.category?.nameFr || 'Haute Couture'}
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-[#141414]">{title}</h1>
            <p className="text-2xl font-semibold text-[#141414]">
              {product.priceDzd.toLocaleString()} <span className="text-sm font-normal text-[#9A7835]">DZD</span>
            </p>
          </div>

          <p className="text-sm text-[#141414]/75 leading-relaxed">{description}</p>

          {/* Size Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider font-medium">
              <span>{locale === 'ar' ? 'المقاس' : 'Taille'}</span>
              <button className="flex items-center gap-1 text-[#9A7835] hover:underline">
                <Ruler size={13} />
                <span>Guide des tailles</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    selectedSize === size
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414] border-[#141414]/15 hover:border-[#141414]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Bag CTA */}
          <button
            onClick={() =>
              addItem({
                productId: product.id,
                titleFr: product.titleFr,
                titleAr: product.titleAr,
                titleEn: product.titleEn,
                priceDzd: product.priceDzd,
                size: selectedSize,
                image: product.images[0]?.url || '',
              })
            }
            className="w-full py-4 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#141414] transition-colors shadow-lg shadow-[#13382C]/20"
          >
            {locale === 'ar' ? 'أضيفي إلى السلة — الدفع عند الاستلام' : 'Ajouter au Panier — Paiement à la Livraison'}
          </button>

          {/* Trust Value Props */}
          <div className="pt-6 border-t border-[#141414]/10 space-y-3 text-xs text-[#141414]/75">
            <div className="flex items-center gap-3">
              <Truck size={17} className="text-[#C5A059] shrink-0" />
              <span>Livraison express 58 Wilayas (Alger 24h, autres 48h-72h)</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-[#C5A059] shrink-0" />
              <span>Paiement en espèces à la livraison avec vérification du colis</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles size={17} className="text-[#C5A059] shrink-0" />
              <span>Finitions artisanales & broderies traditionnelles garanties</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}