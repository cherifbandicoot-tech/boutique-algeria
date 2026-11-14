'use client';

import { useState, useEffect, Suspense } from 'react';
import { PackageSearch, Truck, CheckCircle2, Clock, XCircle, MapPin, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useSiteSettings } from '@/components/shop/SiteSettingsContext';

interface TrackedOrder {
  orderNumber: string;
  customerName: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  stopdeskName?: string | null;
  deliveryType: string;
  subtotalDzd: number;
  discountDzd: number;
  shippingDzd: number;
  totalDzd: number;
  status: string;
  trackingCode: string | null;
  ecomStatus: string | null;
  ecomLogistic: string | null;
  ecomHistory: Array<{ date: string; ville: number; situation: string; commentaire: string | null }>;
  createdAt: string;
  items: Array<{
    titleFr: string;
    titleAr: string;
    size: string;
    quantity: number;
    unitPriceDzd: number;
  }>;
}

const STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function TrackOrderContent() {
  const params = useSearchParams();
  const locale = useLocale();
  const settings = useSiteSettings();

  const [orderNumber, setOrderNumber] = useState(params.get('order') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    const o = params.get('order');
    if (o) setOrderNumber(o);
  }, [params]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Commande introuvable');
      else setOrder(data.order);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 space-y-8">
      <div className="text-center space-y-2">
        <div
          style={{ color: settings.accentColor }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold"
        >
          <PackageSearch size={16} />
          <span>E-com Delivery • Suivi en Direct</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl">
          {locale === 'ar' ? 'تتبع طلبيتك' : 'Suivre ma Commande'}
        </h1>
        <p className="text-xs opacity-65">
          Entrez votre numéro de commande (ex: DZ-123456) et votre numéro de téléphone.
        </p>
      </div>

      <form onSubmit={handleTrack} className="bg-white p-6 rounded-3xl border border-black/10 shadow-sm grid sm:grid-cols-3 gap-3">
        <input
          required
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          placeholder="N° Commande (DZ-...)"
          className="px-4 py-3 rounded-xl border border-black/15 text-xs font-mono uppercase"
        />
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone (05 / 06 / 07...)"
          className="px-4 py-3 rounded-xl border border-black/15 text-xs"
        />
        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: settings.primaryColor }}
          className="py-3 px-6 rounded-xl text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 hover:opacity-90"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <PackageSearch size={15} />}
          <span>Rechercher</span>
        </button>
      </form>

      {error && <p className="text-center text-xs text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

      {order && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/10 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-start gap-4 border-b border-black/10 pb-4">
            <div>
              <p className="text-xs opacity-60">Commande</p>
              <h2 className="font-serif text-2xl font-semibold">{order.orderNumber}</h2>
              <p className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                <MapPin size={12} /> Wilaya {order.wilayaCode} ({order.wilayaName}) • {order.commune}
                {order.stopdeskName ? ` • ${order.stopdeskName}` : ''}
              </p>
            </div>
            <div className="text-end">
              <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-xs font-bold">
                {order.ecomStatus || order.status}
              </span>
              {order.trackingCode && (
                <p className="text-xs font-mono mt-1 opacity-75">Tracking E-com : {order.trackingCode}</p>
              )}
              {order.ecomLogistic && (
                <p className="text-[11px] opacity-60">État logistique : {order.ecomLogistic}</p>
              )}
            </div>
          </div>

          {order.status === 'CANCELLED' || order.status === 'RETURNED' ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-xs font-semibold">
              <XCircle size={16} />
              <span>Statut : {order.status === 'CANCELLED' ? 'Commande annulée' : 'Colis retourné'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              {[
                { key: 'PENDING', label: 'En attente', Icon: Clock },
                { key: 'CONFIRMED', label: 'Confirmée', Icon: CheckCircle2 },
                { key: 'SHIPPED', label: 'En livraison', Icon: Truck },
                { key: 'DELIVERED', label: 'Livrée', Icon: CheckCircle2 },
              ].map((step, idx) => {
                const active = currentStep >= idx;
                return (
                  <div key={step.key} className={`p-3 rounded-2xl border ${active ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold' : 'opacity-45 border-black/10'}`}>
                    <step.Icon size={16} className="mx-auto mb-1" />
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {order.ecomHistory && order.ecomHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-black/10">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Historique E-com Delivery</p>
              <div className="space-y-2">
                {order.ecomHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-stone-50 px-3 py-2 rounded-xl">
                    <div>
                      <span className="font-semibold">{h.situation}</span>
                      {h.commentaire && <span className="opacity-65"> — {h.commentaire}</span>}
                    </div>
                    <span className="text-[11px] opacity-60">{h.date.slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-black/10 text-xs">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{locale === 'ar' ? it.titleAr : it.titleFr} ({it.size}) × {it.quantity}</span>
                <span className="font-semibold">{(it.unitPriceDzd * it.quantity).toLocaleString()} DZD</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-black/10 font-bold text-sm">
              <span>Total COD (Livraison incluse)</span>
              <span>{order.totalDzd.toLocaleString()} DZD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="pt-36 text-center text-xs">Chargement...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}