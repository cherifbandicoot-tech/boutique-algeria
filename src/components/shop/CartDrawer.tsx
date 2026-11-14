'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, CheckCircle2, Truck, Building2, Loader2, Clock, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCart } from './CartContext';
import { ALGERIA_WILAYAS } from '@/lib/wilayas';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotalDzd, clearCart } = useCart();
  const locale = useLocale();
  const t = useTranslations();
  const isRtl = locale === 'ar';

  const [wilayaCode, setWilayaCode] = useState<number>(16); // Alger default
  const [deliveryType, setDeliveryType] = useState<'HOME' | 'DESK'>('HOME');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<string | null>(null);

  // Live E-com Delivery rates state
  const [loadingFee, setLoadingFee] = useState(false);
  const [homeDeliveryDzd, setHomeDeliveryDzd] = useState<number>(400);
  const [stopDeskDzd, setStopDeskDzd] = useState<number>(300);
  const [deliveryDelay, setDeliveryDelay] = useState<string>('24h (Express)');
  const [isLiveFee, setIsLiveFee] = useState<boolean>(false);

  // Fetch real-time live E-com Delivery fee whenever Wilaya changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchLiveFee() {
      setLoadingFee(true);
      try {
        const res = await fetch(`/api/delivery-fees?wilaya=${wilayaCode}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setHomeDeliveryDzd(data.homeDeliveryDzd);
            setStopDeskDzd(data.stopDeskDzd);
            setDeliveryDelay(data.delay);
            setIsLiveFee(data.isLive);
          }
        }
      } catch {
        // Handled silently
      } finally {
        if (!isCancelled) setLoadingFee(false);
      }
    }

    fetchLiveFee();
    return () => {
      isCancelled = true;
    };
  }, [wilayaCode]);

  const selectedWilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode) || ALGERIA_WILAYAS[15];
  const shippingDzd = deliveryType === 'HOME' ? homeDeliveryDzd : stopDeskDzd;
  const totalDzd = subtotalDzd + (items.length > 0 ? shippingDzd : 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          wilayaCode,
          commune,
          address,
          deliveryType,
          paymentMethod: 'COD',
          items: items.map((i) => ({
            productId: i.productId,
            title: i.titleFr,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Une erreur est survenue lors de la commande.');
      } else {
        setConfirmedOrder(data.orderNumber);
        clearCart();
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
              setConfirmedOrder(null);
              closeCart();
            }}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50"
          />

          <motion.aside
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={`fixed top-0 ${
              isRtl ? 'left-0' : 'right-0'
            } h-full w-full max-w-md bg-[#FAF8F5] z-50 shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#141414]/10 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#141414]">{t('nav.cart')}</h2>
                <div className="flex items-center gap-1.5 text-[11px] text-[#13382C] font-semibold mt-0.5">
                  <Sparkles size={11} className="text-[#C5A059]" />
                  <span>Tarifs E-com Delivery Officiels</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  closeCart();
                }}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {confirmedOrder ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 size={54} className="mx-auto text-[#13382C]" />
                  <h3 className="font-serif text-2xl text-[#141414]">
                    {locale === 'ar' ? 'تم تسجيل طلبك بنجاح!' : 'Commande Confirmée !'}
                  </h3>
                  <p className="text-xs text-[#141414]/70 leading-relaxed max-w-xs mx-auto">
                    {locale === 'ar'
                      ? `رقم الطلب الخاص بك: ${confirmedOrder}. سيتصل بك فريق MAISON NERAVA لتأكيد المقاس قبل تسليمه إلى E-com Delivery.`
                      : `Votre commande N° ${confirmedOrder} est enregistrée. Notre équipe vous contactera par téléphone pour confirmer la commande avant expédition via E-com Delivery.`}
                  </p>
                </div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm text-[#141414]/60 py-20">
                  {locale === 'ar' ? 'سلتك فارغة حالياً.' : 'Votre panier est actuellement vide.'}
                </p>
              ) : (
                <>
                  {/* Selected Clothing Items */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const title = locale === 'ar' ? item.titleAr : locale === 'en' ? item.titleEn : item.titleFr;
                      return (
                        <div key={`${item.productId}-${item.size}`} className="flex gap-3 bg-white p-3 rounded-2xl border border-[#141414]/8">
                          <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0">
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <h4 className="font-medium text-xs text-[#141414] line-clamp-1">{title}</h4>
                                <span className="text-[10px] uppercase tracking-wider text-[#9A7835] font-semibold">Taille: {item.size}</span>
                              </div>
                              <button onClick={() => removeItem(item.productId, item.size)} className="text-[#141414]/30 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 border border-[#141414]/15 rounded-full px-2 py-0.5">
                                <button onClick={() => updateQty(item.productId, item.size, -1)} className="p-0.5"><Minus size={10} /></button>
                                <span className="text-xs font-semibold">{item.quantity}</span>
                                <button onClick={() => updateQty(item.productId, item.size, 1)} className="p-0.5"><Plus size={10} /></button>
                              </div>
                              <span className="text-xs font-bold text-[#141414]">{(item.priceDzd * item.quantity).toLocaleString()} DZD</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 58-Wilayas Checkout with Live E-com Delivery Price */}
                  <form id="cod-checkout-form" onSubmit={handleOrder} className="space-y-3 pt-3 border-t border-[#141414]/10">
                    <h3 className="font-serif text-lg">{t('checkout.title')}</h3>

                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Nom et Prénom'}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#141414]/15 text-xs focus:outline-none focus:border-[#C5A059]"
                    />

                    <input
                      required
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t('checkout.phone')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#141414]/15 text-xs focus:outline-none focus:border-[#C5A059]"
                    />

                    {/* Wilaya Selector with Live Delivery Fee Tag */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[#141414]/60 font-semibold">
                        <span>{t('checkout.wilaya')}</span>
                        {loadingFee && <span className="text-[#9A7835] animate-pulse">Calcul du tarif en direct...</span>}
                      </div>
                      <select
                        value={wilayaCode}
                        onChange={(e) => setWilayaCode(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#141414]/15 text-xs font-medium focus:outline-none focus:border-[#C5A059]"
                      >
                        {ALGERIA_WILAYAS.map((w) => (
                          <option key={w.code} value={w.code}>
                            {String(w.code).padStart(2, '0')} - {locale === 'ar' ? w.nameAr : w.nameFr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      required
                      type="text"
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      placeholder={t('checkout.commune')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#141414]/15 text-xs focus:outline-none focus:border-[#C5A059]"
                    />

                    {/* Home vs Stop Desk Switch with Real Live E-com Rates */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('HOME')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          deliveryType === 'HOME'
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white border-[#141414]/15 text-[#141414]'
                        }`}
                      >
                        <Truck size={13} />
                        <span>{t('checkout.homeDelivery')} ({homeDeliveryDzd} DZD)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('DESK')}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          deliveryType === 'DESK'
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white border-[#141414]/15 text-[#141414]'
                        }`}
                      >
                        <Building2 size={13} />
                        <span>{t('checkout.stopDesk')} ({stopDeskDzd} DZD)</span>
                      </button>
                    </div>

                    {/* Estimated Delivery Time Badge */}
                    <div className="flex items-center justify-between text-[11px] text-[#13382C] bg-emerald-50 px-3 py-2 rounded-xl font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Délai estimé : <strong>{deliveryDelay}</strong></span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold">E-com Delivery</span>
                    </div>

                    {deliveryType === 'HOME' && (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Adresse de livraison exacte (Optionnel)"
                        className="w-full px-4 py-2 rounded-xl bg-white border border-[#141414]/15 text-xs focus:outline-none"
                      />
                    )}

                    {errorMsg && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</p>}
                  </form>
                </>
              )}
            </div>

            {/* Transparent Subtotal + Live Delivery Breakdown */}
            {items.length > 0 && !confirmedOrder && (
              <div className="p-5 bg-white border-t border-[#141414]/10 space-y-2">
                <div className="flex justify-between text-xs text-[#141414]/70">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{subtotalDzd.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#9A7835]">
                  <span>+ {t('checkout.shipping')} ({selectedWilaya.nameFr})</span>
                  <span>{shippingDzd.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#141414] pt-2 border-t border-[#141414]/10">
                  <span>{t('checkout.total')}</span>
                  <span>{totalDzd.toLocaleString()} DZD</span>
                </div>

                <button
                  type="submit"
                  form="cod-checkout-form"
                  disabled={submitting}
                  className="w-full mt-2 py-4 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-[0.18em] font-bold hover:bg-[#141414] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#13382C]/15"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{locale === 'ar' ? 'تأكيد الطلب الآن' : 'Confirmer la Commande (Paiement à la Livraison)'}</span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}