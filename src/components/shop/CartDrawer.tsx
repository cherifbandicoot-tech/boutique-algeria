'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Minus, Trash2, CheckCircle2, Truck, Building2, Loader2, Clock, Sparkles, Tag, MapPin, PackageSearch, ChevronDown, Check,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useSiteSettings } from './SiteSettingsContext';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';

interface CommuneOption {
  id: number;
  commune: string;
  code_postal: number;
}

interface StopdeskOption {
  id: number;
  nom_bureau: string;
  code_stopdesk: string;
  adresse: string;
  adresse_maps?: string;
  tel_contact?: string;
  commune: string;
}

interface OrderReceipt {
  orderNumber: string;
  subtotalDzd: number;
  discountDzd: number;
  shippingDzd: number;
  totalDzd: number;
  wilayaName: string;
  commune: string;
  stopdeskName?: string | null;
  deliveryType: string;
  delay: string;
  items: { title: string; size: string; quantity: number; unitPriceDzd: number }[];
}

function formatDeskLabel(nomBureau: string, commune?: string) {
  let cleaned = nomBureau
    .replace(/\[\s*e-?com\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    cleaned = cleaned
      .toLowerCase()
      .replace(/(^|\s|-)\S/g, (ch) => ch.toUpperCase());
  }

  if (!commune) return cleaned;
  const c = commune.trim();
  if (
    cleaned.toLowerCase() === c.toLowerCase() ||
    cleaned.toLowerCase().includes(c.toLowerCase()) ||
    c.toLowerCase().includes(cleaned.toLowerCase())
  ) {
    return cleaned;
  }
  return `${cleaned} (${c})`;
}

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotalDzd, clearCart } = useCart();
  const locale = useLocale();
  const t = useTranslations();
  const settings = useSiteSettings();
  const isRtl = locale === 'ar';

  const [wilayaCode, setWilayaCode] = useState<number>(16);
  const [deliveryType, setDeliveryType] = useState<'HOME' | 'DESK'>('HOME');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [commune, setCommune] = useState('');
  const [stopdeskCode, setStopdeskCode] = useState('');
  const [deskMenuOpen, setDeskMenuOpen] = useState(false);
  const [deskSearch, setDeskSearch] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [stopdesks, setStopdesks] = useState<StopdeskOption[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountDzd: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);

  const [loadingFee, setLoadingFee] = useState(false);
  const [homeDeliveryDzd, setHomeDeliveryDzd] = useState<number>(450);
  const [stopDeskDzd, setStopDeskDzd] = useState<number>(300);
  const [homeAvailable, setHomeAvailable] = useState<boolean>(true);
  const [stopdeskAvailable, setStopdeskAvailable] = useState<boolean>(true);
  const [deliveryDelay, setDeliveryDelay] = useState<string>('24h (Express)');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadWilayaData() {
      setLoadingFee(true);
      setLoadingGeo(true);
      setDeskMenuOpen(false);
      setDeskSearch('');
      try {
        const [feeRes, comRes, deskRes] = await Promise.all([
          fetch(`/api/delivery-fees?wilaya=${wilayaCode}`),
          fetch(`/api/ecom/communes?wilaya=${wilayaCode}`),
          fetch(`/api/ecom/stopdesks?wilaya=${wilayaCode}`),
        ]);
        if (!cancelled) {
          if (feeRes.ok) {
            const feeData = await feeRes.json();
            setHomeDeliveryDzd(feeData.homeDeliveryDzd);
            setStopDeskDzd(feeData.stopDeskDzd);
            setHomeAvailable(feeData.homeAvailable ?? true);
            setStopdeskAvailable(feeData.stopdeskAvailable ?? true);
            setDeliveryDelay(feeData.delay || settings.defaultDeliveryDelay);
          }
          if (comRes.ok) {
            const comData = await comRes.json();
            const list: CommuneOption[] = (comData.communes || []).sort((a: CommuneOption, b: CommuneOption) =>
              a.commune.localeCompare(b.commune)
            );
            setCommunes(list);
            if (list.length > 0) setCommune(list[0].commune);
            else setCommune('');
          }
          if (deskRes.ok) {
            const deskData = await deskRes.json();
            const list: StopdeskOption[] = deskData.stopdesks || [];
            setStopdesks(list);
            setStopdeskCode(list[0]?.code_stopdesk || '');
          }
        }
      } catch {
      } finally {
        if (!cancelled) {
          setLoadingFee(false);
          setLoadingGeo(false);
        }
      }
    }
    loadWilayaData();
    return () => {
      cancelled = true;
    };
  }, [isOpen, wilayaCode, settings.defaultDeliveryDelay]);

  const selectedWilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode) || ALGERIA_WILAYAS[15];
  const selectedDesk = stopdesks.find((d) => d.code_stopdesk === stopdeskCode);

  const filteredDesks = stopdesks.filter((d) => {
    const q = deskSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      formatDeskLabel(d.nom_bureau, d.commune).toLowerCase().includes(q) ||
      d.adresse.toLowerCase().includes(q)
    );
  });

  const discountDzd = appliedPromo ? Math.min(subtotalDzd, appliedPromo.discountDzd) : 0;
  const netSubtotal = Math.max(0, subtotalDzd - discountDzd);
  const freeShippingThreshold = settings.freeShippingThresholdDzd || 0;
  const isFreeShipping = freeShippingThreshold > 0 && netSubtotal >= freeShippingThreshold;
  const baseShipping = deliveryType === 'HOME' ? homeDeliveryDzd : stopDeskDzd;
  const shippingDzd = items.length === 0 ? 0 : isFreeShipping ? 0 : baseShipping;
  const totalDzd = netSubtotal + shippingDzd;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    setPromoMsg('');
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput, subtotalDzd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppliedPromo(null);
        setPromoMsg(data.error || 'Code invalide');
      } else {
        setAppliedPromo({ code: data.code, discountDzd: data.discountDzd });
        setPromoMsg(`Code ${data.code} appliqué (-${data.discountDzd.toLocaleString()} DZD)`);
      }
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const effectiveCommune =
      deliveryType === 'DESK' && selectedDesk
        ? selectedDesk.commune || formatDeskLabel(selectedDesk.nom_bureau)
        : commune;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          wilayaCode,
          commune: effectiveCommune || selectedWilaya.nameFr,
          stopdeskCode: deliveryType === 'DESK' ? stopdeskCode : undefined,
          stopdeskName: deliveryType === 'DESK' && selectedDesk ? formatDeskLabel(selectedDesk.nom_bureau, selectedDesk.commune) : undefined,
          address,
          deliveryType,
          paymentMethod: 'COD',
          promoCode: appliedPromo?.code,
          items: items.map((i) => ({
            productId: i.productId,
            title: i.titleFr,
            size: i.size,
            colorName: i.colorName,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Une erreur est survenue lors de la commande.');
      } else {
        setReceipt(data);
        clearCart();
        setAppliedPromo(null);
        setPromoInput('');
      }
    } catch {
      setErrorMsg('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setReceipt(null);
              closeCart();
            }}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
          />

          <motion.aside
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ backgroundColor: settings.bgColor }}
            className={`fixed top-0 ${isRtl ? 'left-0' : 'right-0'} h-full w-full max-w-md z-50 shadow-2xl flex flex-col`}
          >
            <div className="p-5 border-b border-black/10 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl">{t('nav.cart')}</h2>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5" style={{ color: settings.primaryColor }}>
                  <Sparkles size={11} style={{ color: settings.accentColor }} />
                  <span>E-com Delivery Officiel • 58 Wilayas</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setReceipt(null);
                  closeCart();
                }}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {freeShippingThreshold > 0 && items.length > 0 && !receipt && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200/70 text-[11px] text-emerald-950">
                {isFreeShipping ? (
                  <p className="font-semibold text-center">Livraison GRATUITE débloquée sur votre commande !</p>
                ) : (
                  <p className="text-center">
                    Plus que <strong>{(freeShippingThreshold - netSubtotal).toLocaleString()} DZD</strong> pour la livraison gratuite !
                  </p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {receipt ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm space-y-4"
                >
                  <div className="text-center space-y-2">
                    <CheckCircle2 size={48} className="mx-auto" style={{ color: settings.primaryColor }} />
                    <h3 className="font-serif text-2xl">
                      {locale === 'ar' ? 'تم تسجيل طلبك بنجاح!' : 'Commande Confirmée !'}
                    </h3>
                    <p className="text-xs font-mono font-bold bg-stone-100 inline-block px-3 py-1 rounded-full">
                      {receipt.orderNumber}
                    </p>
                  </div>

                  <div className="border-t border-b border-black/10 py-3 space-y-2 text-xs">
                    {receipt.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.title} ({it.size}{it.colorName && it.colorName !== 'Standard' ? ` • ${it.colorName}` : ''}) × {it.quantity}</span>
                        <span className="font-semibold">{(it.unitPriceDzd * it.quantity).toLocaleString()} DZD</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between opacity-70">
                      <span>Sous-total</span>
                      <span>{receipt.subtotalDzd.toLocaleString()} DZD</span>
                    </div>
                    {receipt.discountDzd > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Remise promo</span>
                        <span>-{receipt.discountDzd.toLocaleString()} DZD</span>
                      </div>
                    )}
                    <div className="flex justify-between opacity-80">
                      <span>Livraison ({receipt.wilayaName} • {receipt.deliveryType === 'HOME' ? 'Domicile' : 'Stop Desk'})</span>
                      <span>{receipt.shippingDzd === 0 ? 'GRATUITE' : `${receipt.shippingDzd.toLocaleString()} DZD`}</span>
                    </div>
                    {receipt.stopdeskName && (
                      <p className="text-[11px] opacity-70">Bureau : {receipt.stopdeskName}</p>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-black/10">
                      <span>Total à payer (COD)</span>
                      <span>{receipt.totalDzd.toLocaleString()} DZD</span>
                    </div>
                  </div>

                  <p className="text-[11px] opacity-70 text-center">
                    Délai estimé : <strong>{receipt.delay}</strong>. Notre équipe vous contactera par téléphone pour confirmer avant l’expédition.
                  </p>

                  <Link
                    href={`/${locale}/track?order=${receipt.orderNumber}`}
                    onClick={() => {
                      setReceipt(null);
                      closeCart();
                    }}
                    style={{ backgroundColor: settings.primaryColor }}
                    className="w-full py-3 rounded-full text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2"
                  >
                    <PackageSearch size={14} />
                    <span>{locale === 'ar' ? 'تتبع طلبي' : 'Suivre ma commande'}</span>
                  </Link>
                </motion.div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm opacity-60 py-20">
                  {locale === 'ar' ? 'سلتك فارغة حالياً.' : 'Votre panier est actuellement vide.'}
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {items.map((item) => {
                        const title = locale === 'ar' ? item.titleAr : locale === 'en' ? item.titleEn : item.titleFr;
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            key={`${item.productId}-${item.size}-${item.colorName || ''}`}
                            className="flex gap-3 bg-white p-3 rounded-2xl border border-black/8"
                          >
                            <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0">
                              <Image src={item.image} alt={title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="flex justify-between items-start gap-1">
                                <div>
                                  <h4 className="font-medium text-xs line-clamp-1">{title}</h4>
                                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: settings.accentColor }}>
                                    Taille: {item.size} {item.colorName && item.colorName !== 'Standard' ? `• ${item.colorName}` : ''}
                                  </span>
                                </div>
                                <button onClick={() => removeItem(item.productId, item.size, item.colorName)} className="opacity-40 hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 border border-black/15 rounded-full px-2 py-0.5">
                                  <button onClick={() => updateQty(item.productId, item.size, -1, item.colorName)} className="p-0.5"><Minus size={10} /></button>
                                  <span className="text-xs font-semibold">{item.quantity}</span>
                                  <button onClick={() => updateQty(item.productId, item.size, 1, item.colorName)} className="p-0.5"><Plus size={10} /></button>
                                </div>
                                <span className="text-xs font-bold">{(item.priceDzd * item.quantity).toLocaleString()} DZD</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Promo Code */}
                  <div className="bg-white p-3 rounded-2xl border border-black/10 space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="Code promo (ex: BIENVENUE10)"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-black/10 text-xs uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={checkingPromo}
                        className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:opacity-85 disabled:opacity-50"
                      >
                        {checkingPromo ? '...' : 'Appliquer'}
                      </button>
                    </div>
                    {promoMsg && (
                      <p className={`text-[11px] ${appliedPromo ? 'text-emerald-700 font-medium' : 'text-red-600'}`}>
                        {promoMsg}
                      </p>
                    )}
                  </div>

                  {/* Checkout Form */}
                  <form id="cod-checkout-form" onSubmit={handleOrder} className="space-y-3 pt-3 border-t border-black/10">
                    <h3 className="font-serif text-lg">{t('checkout.title')}</h3>

                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Nom et Prénom'}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs focus:outline-none"
                    />

                    <input
                      required
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t('checkout.phone')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs focus:outline-none"
                    />

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                        <span>{t('checkout.wilaya')}</span>
                        {(loadingFee || loadingGeo) && <span className="animate-pulse">Calcul en direct...</span>}
                      </div>
                      <select
                        value={wilayaCode}
                        onChange={(e) => setWilayaCode(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium focus:outline-none"
                      >
                        {ALGERIA_WILAYAS.map((w) => (
                          <option key={w.code} value={w.code}>
                            {String(w.code).padStart(2, '0')} - {locale === 'ar' ? w.nameAr : w.nameFr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!homeAvailable}
                        onClick={() => setDeliveryType('HOME')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 ${
                          deliveryType === 'HOME' ? 'bg-black text-white border-black' : 'bg-white border-black/15'
                        }`}
                      >
                        <Truck size={13} />
                        <span>{t('checkout.homeDelivery')} ({isFreeShipping ? '0' : homeDeliveryDzd} DZD)</span>
                      </button>
                      <button
                        type="button"
                        disabled={!stopdeskAvailable}
                        onClick={() => setDeliveryType('DESK')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 ${
                          deliveryType === 'DESK' ? 'bg-black text-white border-black' : 'bg-white border-black/15'
                        }`}
                      >
                        <Building2 size={13} />
                        <span>{t('checkout.stopDesk')} ({isFreeShipping ? '0' : stopDeskDzd} DZD)</span>
                      </button>
                    </div>

                    {deliveryType === 'HOME' ? (
                      <>
                        {communes.length > 0 ? (
                          <select
                            required
                            value={commune}
                            onChange={(e) => setCommune(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium focus:outline-none"
                          >
                            {communes.map((c) => (
                              <option key={c.id} value={c.commune}>
                                {c.commune}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            required
                            type="text"
                            value={commune}
                            onChange={(e) => setCommune(e.target.value)}
                            placeholder={t('checkout.commune')}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs focus:outline-none"
                          />
                        )}
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Adresse exacte / Rue / Quartier"
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs focus:outline-none"
                        />
                      </>
                    ) : (
                      <div className="space-y-2 relative">
                        {stopdesks.length > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setDeskMenuOpen(!deskMenuOpen)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs font-medium flex items-center justify-between gap-2 text-start hover:border-black/35 transition-colors"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Building2 size={13} style={{ color: settings.accentColor }} className="shrink-0" />
                                <span className="truncate">
                                  {selectedDesk
                                    ? formatDeskLabel(selectedDesk.nom_bureau, selectedDesk.commune)
                                    : 'Choisir un bureau Stop Desk'}
                                </span>
                              </span>
                              <ChevronDown size={14} className={`shrink-0 transition-transform ${deskMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {deskMenuOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  className="bg-white border border-black/15 rounded-2xl shadow-xl p-2 space-y-1.5 max-h-56 overflow-y-auto"
                                >
                                  {stopdesks.length > 5 && (
                                    <input
                                      type="text"
                                      value={deskSearch}
                                      onChange={(e) => setDeskSearch(e.target.value)}
                                      placeholder="Chercher un bureau..."
                                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-black/10 text-xs focus:outline-none"
                                    />
                                  )}
                                  {filteredDesks.map((d) => {
                                    const active = d.code_stopdesk === stopdeskCode;
                                    return (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => {
                                          setStopdeskCode(d.code_stopdesk);
                                          setDeskMenuOpen(false);
                                        }}
                                        className={`w-full text-start px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 ${
                                          active ? 'bg-black text-white' : 'hover:bg-stone-100'
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <p className="font-semibold truncate">{formatDeskLabel(d.nom_bureau, d.commune)}</p>
                                          <p className={`text-[10px] truncate ${active ? 'text-white/75' : 'opacity-60'}`}>{d.adresse}</p>
                                        </div>
                                        {active && <Check size={13} className="shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {selectedDesk && (
                              <div className="bg-white p-3 rounded-2xl border border-black/10 text-[11px] space-y-1">
                                <p className="font-semibold flex items-center gap-1.5">
                                  <MapPin size={12} style={{ color: settings.accentColor }} />
                                  {formatDeskLabel(selectedDesk.nom_bureau, selectedDesk.commune)}
                                </p>
                                <p className="opacity-70">{selectedDesk.adresse}</p>
                                {selectedDesk.tel_contact && <p className="opacity-70">Tél : {selectedDesk.tel_contact}</p>}
                                {selectedDesk.adresse_maps && (
                                  <a href={selectedDesk.adresse_maps} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline inline-block font-medium">
                                    Voir l’emplacement sur Google Maps
                                  </a>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <input
                            required
                            type="text"
                            value={commune}
                            onChange={(e) => setCommune(e.target.value)}
                            placeholder="Commune / Bureau Stop Desk"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-black/15 text-xs focus:outline-none"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] bg-emerald-50 px-3 py-2 rounded-xl font-medium" style={{ color: settings.primaryColor }}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Délai estimé : <strong>{deliveryDelay}</strong></span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: settings.accentColor }}>E-com Delivery</span>
                    </div>

                    {errorMsg && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</p>}
                  </form>
                </>
              )}
            </div>

            {items.length > 0 && !receipt && (
              <div className="p-5 bg-white border-t border-black/10 space-y-2">
                <div className="flex justify-between text-xs opacity-70">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{subtotalDzd.toLocaleString()} DZD</span>
                </div>
                {discountDzd > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700">
                    <span>Remise ({appliedPromo?.code})</span>
                    <span>-{discountDzd.toLocaleString()} DZD</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-semibold" style={{ color: settings.accentColor }}>
                  <span>+ {t('checkout.shipping')} ({selectedWilaya.nameFr})</span>
                  <span>{shippingDzd === 0 ? 'GRATUITE' : `${shippingDzd.toLocaleString()} DZD`}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-black/10">
                  <span>{t('checkout.total')}</span>
                  <span>{totalDzd.toLocaleString()} DZD</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  form="cod-checkout-form"
                  disabled={submitting}
                  style={{ backgroundColor: settings.primaryColor }}
                  className="w-full mt-2 py-4 rounded-full text-white text-xs uppercase tracking-[0.18em] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{locale === 'ar' ? 'تأكيد الطلب الآن' : 'Confirmer la Commande (COD)'}</span>
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}