'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, CheckCircle2, Truck, Building2, Loader2 } from 'lucide-react';
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

  const selectedWilaya = ALGERIA_WILAYAS.find((w) => w.code === wilayaCode) || ALGERIA_WILAYAS[15];
  const shippingDzd =
    deliveryType === 'HOME' ? selectedWilaya.homeDeliveryDzd : selectedWilaya.stopDeskDzd;
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
        setErrorMsg(data.error || 'Une erreur est survenue.');
      } else {
        setConfirmedOrder(data.orderNumber);
        clearCart();
      }
    } catch {
      setErrorMsg('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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

          {/* Slide-over Drawer */}
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
              <h2 className="font-serif text-2xl">{t('nav.cart')}</h2>
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  closeCart();
                }}
                className="p-2 rounded-full hover:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {confirmedOrder ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <CheckCircle2 size={54} className="mx-auto text-[#13382C]" />
                  <h3 className="font-serif text-2xl">
                    {locale === 'ar'
                      ? 'تم تسجيل طلبك بنجاح!'
                      : locale === 'en'
                      ? 'Order Confirmed!'
                      : 'Commande Confirmée !'}
                  </h3>
                  <p className="text-sm text-[#141414]/70">
                    {locale === 'ar'
                      ? `رقم الطلب: ${confirmedOrder} — سنتصل بك قريباً للتأكيد.`
                      : locale === 'en'
                      ? `Order #${confirmedOrder} — We will call you shortly to confirm.`
                      : `Commande N° ${confirmedOrder} — Notre équipe vous appellera pour confirmer.`}
                  </p>
                </motion.div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm text-[#141414]/60 py-16">
                  {locale === 'ar'
                    ? 'سلتك فارغة حالياً.'
                    : locale === 'en'
                    ? 'Your shopping bag is empty.'
                    : 'Votre panier est actuellement vide.'}
                </p>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-4">
                    {items.map((item) => {
                      const title =
                        locale === 'ar'
                          ? item.titleAr
                          : locale === 'en'
                          ? item.titleEn
                          : item.titleFr;

                      return (
                        <div
                          key={`${item.productId}-${item.size}`}
                          className="flex gap-4 bg-white p-3 rounded-2xl border border-[#141414]/8"
                        >
                          <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0">
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-medium text-sm">{title}</h4>
                                <button
                                  onClick={() => removeItem(item.productId, item.size)}
                                  className="text-[#141414]/40 hover:text-red-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              <p className="text-xs text-[#141414]/60 mt-0.5">
                                {locale === 'ar' ? 'المقاس' : 'Taille'}: {item.size}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 border border-[#141414]/15 rounded-full px-2 py-0.5">
                                <button
                                  onClick={() => updateQty(item.productId, item.size, -1)}
                                  className="p-1"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQty(item.productId, item.size, 1)}
                                  className="p-1"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span className="text-sm font-semibold text-[#9A7835]">
                                {(item.priceDzd * item.quantity).toLocaleString()} {t('product.currency')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 58-Wilaya COD Checkout Form */}
                  <form id="cod-checkout-form" onSubmit={handleOrder} className="space-y-3 pt-4 border-t border-[#141414]/10">
                    <h3 className="font-serif text-xl">{t('checkout.title')}</h3>

                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : locale === 'en' ? 'Full Name' : 'Nom complet'}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#141414]/15 text-sm focus:outline-none focus:border-[#C5A059]"
                    />

                    <input
                      required
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t('checkout.phone')}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#141414]/15 text-sm focus:outline-none focus:border-[#C5A059]"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={wilayaCode}
                        onChange={(e) => setWilayaCode(Number(e.target.value))}
                        className="w-full px-3 py-3 rounded-xl bg-white border border-[#141414]/15 text-sm focus:outline-none focus:border-[#C5A059]"
                      >
                        {ALGERIA_WILAYAS.map((w) => (
                          <option key={w.code} value={w.code}>
                            {String(w.code).padStart(2, '0')} - {locale === 'ar' ? w.nameAr : w.nameFr}
                          </option>
                        ))}
                      </select>

                      <input
                        required
                        type="text"
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        placeholder={t('checkout.commune')}
                        className="w-full px-3 py-3 rounded-xl bg-white border border-[#141414]/15 text-sm focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    {/* Home Delivery vs Stop Desk Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('HOME')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                          deliveryType === 'HOME'
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white border-[#141414]/15'
                        }`}
                      >
                        <Truck size={14} />
                        <span>{t('checkout.homeDelivery')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('DESK')}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                          deliveryType === 'DESK'
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white border-[#141414]/15'
                        }`}
                      >
                        <Building2 size={14} />
                        <span>{t('checkout.stopDesk')}</span>
                      </button>
                    </div>

                    {deliveryType === 'HOME' && (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={locale === 'ar' ? 'العنوان (اختياري)' : 'Adresse (optionnel)'}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#141414]/15 text-sm focus:outline-none focus:border-[#C5A059]"
                      />
                    )}

                    {errorMsg && (
                      <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</p>
                    )}
                  </form>
                </>
              )}
            </div>

            {/* Footer Totals & Submit */}
            {items.length > 0 && !confirmedOrder && (
              <div className="p-5 bg-white border-t border-[#141414]/10 space-y-3">
                <div className="flex justify-between text-xs text-[#141414]/70">
                  <span>{locale === 'ar' ? 'التوصيل' : 'Livraison'}</span>
                  <span>{shippingDzd.toLocaleString()} {t('product.currency')}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total ({t('checkout.cod')})</span>
                  <span className="text-[#9A7835]">{totalDzd.toLocaleString()} {t('product.currency')}</span>
                </div>
                <button
                  type="submit"
                  form="cod-checkout-form"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#141414] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>
                    {locale === 'ar' ? 'تأكيد الطلب' : locale === 'en' ? 'Confirm Order' : 'Confirmer la commande'}
                  </span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}