'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Package, ShoppingCart, Plus, LogOut, Upload, Trash2, Phone, MapPin,
  Settings, Truck, Tag, BarChart3, Send, Printer, RefreshCw, Edit3, Download,
  CheckCircle2, X, ExternalLink, Wallet, CalendarClock, AlertCircle, Link2,
} from 'lucide-react';
import type { SiteSettingsData } from '@/lib/settings';
import { DEFAULT_SITE_SETTINGS } from '@/lib/settings';

type AdminTab = 'overview' | 'orders' | 'catalog' | 'delivery' | 'customize' | 'promos';

interface AdminOrderItem {
  id: string;
  quantity: number;
  unitPriceDzd: number;
  product: { titleFr: string };
  variant: { size: string; colorName: string; colorHex?: string };
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  stopdeskCode?: string | null;
  stopdeskName?: string | null;
  address?: string | null;
  deliveryType: 'HOME' | 'DESK';
  subtotalDzd: number;
  discountDzd: number;
  promoCode?: string | null;
  shippingDzd: number;
  totalDzd: number;
  status: string;
  trackingCode?: string | null;
  ecomStatus?: string | null;
  ecomLogistic?: string | null;
  ecomPaid?: boolean;
  ecomRecovered?: boolean;
  adminNotes?: string | null;
  createdAt: string;
  items: AdminOrderItem[];
}

interface AdminVariant {
  id?: string;
  size: string;
  colorName: string;
  colorHex: string;
  stockQuantity: number;
}

interface AdminProduct {
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
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  category?: { nameFr: string };
  images: { id: string; url: string }[];
  variants: AdminVariant[];
}

interface AdminCategory {
  id: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
}

interface AdminWilaya {
  code: number;
  nameFr: string;
  nameAr: string;
  homeDeliveryDzd: number;
  stopDeskDzd: number;
  delay: string;
  isActive: boolean;
}

interface AdminPromo {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderDzd: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('admin@maisonyasmine.dz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [tab, setTab] = useState<AdminTab>('overview');
  const [toast, setToast] = useState('');

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [wilayas, setWilayas] = useState<AdminWilaya[]>([]);
  const [promos, setPromos] = useState<AdminPromo[]>([]);
  const [site, setSite] = useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);

  const [ecomAccount, setEcomAccount] = useState<{ id_fournisseur?: number; nom_fournisseur?: string; stock?: boolean; colis_0da?: boolean } | null>(null);
  const [ecomLimits, setEcomLimits] = useState<Record<string, string | null> | null>(null);
  const [ecomResume, setEcomResume] = useState<{ total?: number; taux_livraison?: number; taux_stopdesk?: number } | null>(null);
  const [ecomPaiements, setEcomPaiements] = useState<Array<{ code?: string; date?: string; colis_livres?: number; nb_colis?: number; montant?: number }>>([]);
  const [webhookSub, setWebhookSub] = useState<{ actif?: boolean; url?: string; events?: string[] } | null>(null);
  const [busyAction, setBusyAction] = useState('');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [pickupForm, setPickupForm] = useState({ nb_colis: 5, type_vehicule: 2, commune: 'Cheraga', heure: '14h00', note: '' });
  const [inspectDetail, setInspectDetail] = useState<{ tracking?: string; [key: string]: unknown } | null>(null);

  // Edit Parcel Modal state
  const [editParcel, setEditParcel] = useState<{
    tracking: string; nom_complet: string; mobile_1: string; id_wilaya: number;
    commune: string; code_stopdesk: string; stopdesk: number; adresse: string; total: number; article: string;
  } | null>(null);

  // Reclamation Modal state
  const [reclamTarget, setReclamTarget] = useState<string | null>(null);
  const [motifs, setMotifs] = useState<Array<{ id: number; libelle: string; type_champ: string; libelle_champ: string }>>([]);
  const [reclamForm, setReclamForm] = useState({ id_motif: 0, valeurInput: '', remarque: '' });

  // Product editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pForm, setPForm] = useState({
    titleFr: '', titleAr: '', titleEn: '',
    descriptionFr: '', descriptionAr: '', descriptionEn: '',
    priceDzd: '', compareAtPriceDzd: '', categoryId: '',
    isFeatured: true, isActive: true, imageUrlsText: '',
  });
  const [variantsDraft, setVariantsDraft] = useState<AdminVariant[]>([
    { size: 'S', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 },
    { size: 'M', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 },
    { size: 'L', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 },
    { size: 'XL', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 },
  ]);
  const [catForm, setCatForm] = useState({ nameFr: '', nameAr: '', nameEn: '' });
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'PERCENT', discountValue: '10', minOrderDzd: '0', maxUses: '' });
  const [accountForm, setAccountForm] = useState({ name: '', email: '', newPassword: '' });
  const [wilayaFilter, setWilayaFilter] = useState('');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const loadAll = useCallback(async () => {
    const res = await fetch('/api/admin/bootstrap');
    if (res.status === 401) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const d = await res.json();
    setOrders(d.orders || []);
    setProducts(d.products || []);
    setCategories(d.categories || []);
    setWilayas(d.wilayas || []);
    if (d.settings) setSite(d.settings);
    setPromos(d.promos || []);
    if (d.categories?.[0] && !pForm.categoryId) {
      setPForm((prev) => ({ ...prev, categoryId: d.categories[0].id }));
    }
    setAuthed(true);
    setChecking(false);
  }, [pForm.categoryId]);

  const loadEcomStatus = useCallback(async () => {
    try {
      const [testR, resR, payR, whR] = await Promise.all([
        fetch('/api/admin/ecom?action=test').then((r) => r.json()),
        fetch('/api/admin/ecom?action=resume').then((r) => r.json()),
        fetch('/api/admin/ecom?action=paiements').then((r) => r.json()),
        fetch('/api/admin/ecom?action=webhook').then((r) => r.json()),
      ]);
      if (testR.account) setEcomAccount(testR.account);
      if (testR.limits) setEcomLimits(testR.limits);
      if (resR.resume) setEcomResume(resR.resume);
      if (payR.paiements?.items) setEcomPaiements(payR.paiements.items);
      if (whR.subscription) setWebhookSub(whR.subscription);
    } catch {}
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (authed) loadEcomStatus();
  }, [authed, loadEcomStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Identifiants incorrects');
      return;
    }
    loadAll();
  };

  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      if (file.size <= 350 * 1024) return resolve(file);
      const img = new window.Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const maxDim = 1400;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.86
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(file);
      };
      img.src = objUrl;
    });

  const uploadCloudinary = async (file: File): Promise<string | null> => {
    try {
      const readyFile = await compressImage(file);
      const fd = new FormData();
      fd.append('file', readyFile);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(raw); } catch {}
      if (!res.ok || !data.url) {
        alert(data.error || `Erreur serveur (${res.status}) lors de l’envoi de la photo`);
        return null;
      }
      return data.url;
    } catch {
      alert('Erreur réseau lors de l’envoi de la photo');
      return null;
    }
  };

  const ecomDispatch = async (orderId: string, confirmee: number) => {
    setBusyAction(orderId);
    try {
      const res = await fetch('/api/admin/ecom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch', orderId, confirmee }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error || 'Erreur E-com Delivery');
      else {
        notify(`Colis créé sur E-com Delivery : ${d.trackingCode}`);
        loadAll();
      }
    } finally {
      setBusyAction('');
    }
  };

  const ecomConfirmParcel = async (tracking: string) => {
    setBusyAction(tracking);
    try {
      const res = await fetch('/api/admin/ecom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', tracking }),
      });
      const d = await res.json();
      if (d.data?.resultats?.[0]?.ok) notify(`Colis ${tracking} confirmé (Prêt à expédier)`);
      else alert(d.data?.resultats?.[0]?.erreur || d.error || 'Erreur confirmation');
      loadAll();
    } finally {
      setBusyAction('');
    }
  };

  const ecomSyncAll = async () => {
    setBusyAction('sync');
    try {
      const res = await fetch('/api/admin/ecom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-statuses' }),
      });
      const d = await res.json();
      if (res.ok) {
        notify(`${d.synced} colis synchronisés avec E-com Delivery`);
        loadAll();
        loadEcomStatus();
      } else alert(d.error || 'Erreur sync');
    } finally {
      setBusyAction('');
    }
  };

  const ecomDeleteParcel = async (tracking: string) => {
    if (!confirm(`Supprimer le colis ${tracking} sur E-com Delivery (uniquement si En Préparation) ?`)) return;
    const res = await fetch('/api/admin/ecom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-parcel', tracking }),
    });
    const d = await res.json();
    if (res.ok) {
      notify(`Colis ${tracking} annulé`);
      loadAll();
    } else alert(d.data?.error?.message || d.error || 'Impossible de supprimer');
  };

  const openBordereau = (tracking: string, format: '10x13' | '10x10' = '10x13') => {
    window.open(`/api/admin/ecom/label?tracking=${encodeURIComponent(tracking)}&format=${format}`, '_blank');
  };

  const batchPrintBordereaux = async () => {
    const trackings = orders.map((o) => o.trackingCode).filter(Boolean) as string[];
    if (trackings.length === 0) return alert('Aucun colis avec numéro de tracking');
    const res = await fetch('/api/admin/ecom/label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackings: trackings.slice(0, 100), format: '10x13' }),
    });
    if (!res.ok) return alert('Erreur impression par lot');
    const html = await res.text();
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const requestPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/ecom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pickup', ...pickupForm }),
    });
    const d = await res.json();
    if (res.ok) notify(`Demande de ramassage #${d.data?.id} enregistrée`);
    else alert(d.data?.detail?.error?.message || d.error || 'Guichet fermé ou erreur');
  };

  const openReclamationModal = async (tracking: string) => {
    setReclamTarget(tracking);
    if (motifs.length === 0) {
      const r = await fetch('/api/admin/ecom?action=reclamations-motifs').then((x) => x.json());
      if (Array.isArray(r.motifs)) {
        setMotifs(r.motifs);
        if (r.motifs[0]) setReclamForm((p) => ({ ...p, id_motif: r.motifs[0].id }));
      }
    }
  };

  const exportCsv = () => {
    const headers = ['Numero', 'Client', 'Telephone', 'Wilaya', 'Commune', 'Mode', 'Total DZD', 'Statut', 'Tracking', 'Date'];
    const rows = orders.map((o) => [
      o.orderNumber, o.customerName, o.customerPhone, `${o.wilayaCode} ${o.wilayaName}`,
      o.commune, o.deliveryType, o.totalDzd, o.status, o.trackingCode || '', o.createdAt.slice(0, 10),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrls = pForm.imageUrlsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (imageUrls.length === 0) return alert('Ajoutez au moins une URL ou photo.');

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      titleFr: pForm.titleFr,
      titleAr: pForm.titleAr,
      titleEn: pForm.titleEn || pForm.titleFr,
      descriptionFr: pForm.descriptionFr || pForm.titleFr,
      descriptionAr: pForm.descriptionAr || pForm.titleAr,
      descriptionEn: pForm.descriptionEn || pForm.titleFr,
      priceDzd: Number(pForm.priceDzd),
      compareAtPriceDzd: pForm.compareAtPriceDzd ? Number(pForm.compareAtPriceDzd) : null,
      categoryId: pForm.categoryId || categories[0]?.id,
      isFeatured: pForm.isFeatured,
      isActive: pForm.isActive,
      imageUrls,
      variants: variantsDraft,
    };

    const res = await fetch('/api/admin/products', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      return alert(d.error || 'Erreur enregistrement produit');
    }
    notify(editingId ? 'Produit mis à jour' : 'Produit publié');
    setEditingId(null);
    setPForm({
      titleFr: '', titleAr: '', titleEn: '', descriptionFr: '', descriptionAr: '', descriptionEn: '',
      priceDzd: '', compareAtPriceDzd: '', categoryId: categories[0]?.id || '', isFeatured: true, isActive: true, imageUrlsText: '',
    });
    loadAll();
  };

  const startEditProduct = (p: AdminProduct) => {
    setEditingId(p.id);
    setPForm({
      titleFr: p.titleFr,
      titleAr: p.titleAr,
      titleEn: p.titleEn,
      descriptionFr: p.descriptionFr,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      priceDzd: String(p.priceDzd),
      compareAtPriceDzd: p.compareAtPriceDzd ? String(p.compareAtPriceDzd) : '',
      categoryId: p.categoryId,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      imageUrlsText: p.images.map((i) => i.url).join('\n'),
    });
    setVariantsDraft(
      p.variants.length > 0
        ? p.variants.map((v) => ({ id: v.id, size: v.size, colorName: v.colorName, colorHex: v.colorHex, stockQuantity: v.stockQuantity }))
        : [{ size: 'Standard', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 }]
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    });
    if (res.ok) notify('Paramètres du site enregistrés !');
    else alert('Erreur lors de la sauvegarde');
  };

  if (checking) return <div className="pt-36 text-center text-sm">Chargement du panneau de contrôle...</div>;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-black/10 space-y-4"
        >
          <div className="flex items-center gap-2 text-[#9A7835]">
            <Lock size={20} />
            <h1 className="font-serif text-2xl text-black">Admin — {site.brandName}</h1>
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm" placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm" placeholder="Mot de passe" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-semibold">
            Connexion Admin
          </button>
        </motion.form>
      </div>
    );
  }

  const activeRevenue = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED').reduce((s, o) => s + o.totalDzd, 0);
  const deliveredRevenue = orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.totalDzd, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const lowStockVariants = products.flatMap((p) => p.variants.filter((v) => v.stockQuantity <= 3).map((v) => ({ product: p.titleFr, size: v.size, qty: v.stockQuantity })));

  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.wilayaName.toLowerCase().includes(q) ||
      (o.trackingCode || '').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const selectedMotif = motifs.find((m) => m.id === reclamForm.id_motif);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-28 pb-24 space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-black/10 shadow-xs">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">Panneau de Contrôle Total — {site.brandName}</h1>
          <p className="text-xs opacity-60">Modifiez tout le site, gérez vos colis E-com Delivery, produits & promos.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-black/15 hover:bg-stone-50">
            <ExternalLink size={13} /> Voir Boutique
          </a>
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              setAuthed(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-black text-white"
          >
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Animated Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Aperçu & Stats', Icon: BarChart3 },
          { id: 'orders', label: `Commandes & E-com (${orders.length})`, Icon: ShoppingCart },
          { id: 'catalog', label: `Produits & Catégories (${products.length})`, Icon: Package },
          { id: 'delivery', label: 'E-com 58 Wilayas', Icon: Truck },
          { id: 'customize', label: 'Personnalisation Site', Icon: Settings },
          { id: 'promos', label: 'Promos & Compte', Icon: Tag },
        ].map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id as AdminTab)}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border transition-colors ${
              tab === tItem.id ? 'text-white border-black' : 'bg-white border-black/15 hover:bg-stone-50'
            }`}
          >
            {tab === tItem.id && (
              <motion.span layoutId="adminTabPill" className="absolute inset-0 bg-black rounded-full -z-0" />
            )}
            <tItem.Icon size={14} className="relative z-10" />
            <span className="relative z-10">{tItem.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'CA Actif (Hors Annulés)', val: `${activeRevenue.toLocaleString()} DZD`, color: 'text-[#13382C]' },
                  { label: 'CA Encaissé (Livrées)', val: `${deliveredRevenue.toLocaleString()} DZD`, color: '' },
                  { label: 'À Appeler (En Attente)', val: `${pendingCount}`, color: 'text-[#9A7835]' },
                  { label: 'Alertes Stock Faible', val: `${lowStockVariants.length}`, color: 'text-red-600' },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-5 rounded-3xl border border-black/10 shadow-xs"
                  >
                    <p className="text-[11px] uppercase tracking-wider opacity-60">{kpi.label}</p>
                    <p className={`text-2xl font-serif font-bold mt-1 ${kpi.color}`}>{kpi.val}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl flex items-center gap-2">
                      <Truck size={18} className="text-[#C5A059]" /> Connexion E-com Delivery v2
                    </h2>
                    <button onClick={loadEcomStatus} className="text-xs px-3 py-1.5 rounded-full border border-black/15 inline-flex items-center gap-1 hover:bg-stone-50">
                      <RefreshCw size={12} /> Actualiser
                    </button>
                  </div>
                  {ecomAccount ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50 rounded-2xl">
                        <p className="opacity-60">Fournisseur</p>
                        <p className="font-bold text-emerald-950">{String(ecomAccount.nom_fournisseur)} (#{String(ecomAccount.id_fournisseur)})</p>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-2xl">
                        <p className="opacity-60">Mode Compte</p>
                        <p className="font-semibold">Stock: {ecomAccount.stock ? 'Oui' : 'Non'} • 0 DA: {ecomAccount.colis_0da ? 'Oui' : 'Non'}</p>
                      </div>
                      {ecomLimits && (
                        <div className="col-span-2 p-3 bg-stone-50 rounded-2xl flex flex-wrap gap-4 text-[11px]">
                          <span>API v{ecomLimits.version || '2'}</span>
                          <span>Quota 1m: <strong>{ecomLimits.remaining1m ?? '-'}</strong></span>
                          <span>Quota 1h: <strong>{ecomLimits.remaining1h ?? '-'}</strong></span>
                          <span>Quota 24h: <strong>{ecomLimits.remaining24h ?? '-'}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
                      Vérifiez ECOM_API_ID et ECOM_API_TOKEN puis actualisez.
                    </p>
                  )}

                  {/* Webhook Auto-Subscription Box */}
                  <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold flex items-center gap-1.5"><Link2 size={13} className="text-[#C5A059]" /> Webhook Statuts Temps Réel</p>
                      <p className="opacity-60 text-[11px]">
                        {webhookSub?.actif ? `Actif : ${String(webhookSub.url)}` : 'Non activé sur E-com Delivery'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const r = await fetch('/api/admin/ecom', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'webhook-setup', url: `${window.location.origin}/api/webhooks/ecom` }),
                          });
                          const d = await r.json();
                          if (r.ok) { notify('Webhook activé automatiquement !'); loadEcomStatus(); }
                          else alert(d.data?.error?.message || d.error || 'Erreur webhook');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#13382C] text-white font-semibold"
                      >
                        Activer Webhook
                      </button>
                      {Boolean(webhookSub?.actif) && (
                        <button
                          onClick={async () => {
                            const r = await fetch('/api/admin/ecom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'webhook-test' }) });
                            const d = await r.json();
                            if (r.ok) notify(`Test Webhook envoyé : ${d.data?.detail || 'OK'}`);
                            else alert(d.error || 'Erreur test');
                          }}
                          className="px-3 py-1.5 rounded-full border border-black/15 font-semibold"
                        >
                          Tester
                        </button>
                      )}
                    </div>
                  </div>

                  {ecomResume && (
                    <div className="pt-3 border-t border-black/10 space-y-2 text-xs">
                      <p className="font-semibold">Statistiques Live E-com Delivery :</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-stone-50 rounded-xl"><p className="opacity-60">Total Colis</p><p className="font-bold text-base">{String(ecomResume.total ?? 0)}</p></div>
                        <div className="p-2.5 bg-stone-50 rounded-xl"><p className="opacity-60">Taux Livraison</p><p className="font-bold text-base text-emerald-700">{String(ecomResume.taux_livraison ?? 0)}%</p></div>
                        <div className="p-2.5 bg-stone-50 rounded-xl"><p className="opacity-60">Stopdesk</p><p className="font-bold text-base">{String(ecomResume.taux_stopdesk ?? 0)}%</p></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                  <h2 className="font-serif text-xl flex items-center gap-2">
                    <Wallet size={18} className="text-[#C5A059]" /> Derniers Paiements E-com Delivery
                  </h2>
                  {ecomPaiements.length === 0 ? (
                    <p className="text-xs opacity-60">Aucun paiement récent retourné par l’API.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
                      {ecomPaiements.slice(0, 8).map((pay, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                          <div>
                            <p className="font-semibold">{String(pay.code)} — {String(pay.date)}</p>
                            <p className="text-[11px] opacity-65">{String(pay.colis_livres)} livrés / {String(pay.nb_colis)} colis</p>
                          </div>
                          <span className="font-bold text-emerald-800">{Number(pay.montant || 0).toLocaleString()} DZD</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {lowStockVariants.length > 0 && (
                    <div className="pt-3 border-t border-black/10">
                      <p className="text-xs font-semibold text-red-700 mb-2">Stock Faible (≤ 3 unités) :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lowStockVariants.slice(0, 12).map((ls, idx) => (
                          <span key={idx} className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                            {ls.product} ({ls.size}): {ls.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS & E-COM DELIVERY */}
          {tab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-3xl border border-black/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Rechercher N°, client, tél, tracking..."
                    className="px-4 py-2 rounded-full border border-black/15 text-xs w-60"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-full border border-black/15 text-xs font-semibold"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="PENDING">En attente</option>
                    <option value="CONFIRMED">Confirmées</option>
                    <option value="SHIPPED">Expédiées</option>
                    <option value="DELIVERED">Livrées</option>
                    <option value="CANCELLED">Annulées</option>
                    <option value="RETURNED">Retours</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={ecomSyncAll} disabled={busyAction === 'sync'} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#13382C] text-white text-xs font-semibold">
                    <RefreshCw size={13} className={busyAction === 'sync' ? 'animate-spin' : ''} /> Sync Statuts E-com
                  </button>
                  <button onClick={batchPrintBordereaux} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/20 text-xs font-semibold hover:bg-stone-50">
                    <Printer size={13} /> Bordereaux en Lot
                  </button>
                  <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/20 text-xs font-semibold hover:bg-stone-50">
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              </div>

              <form onSubmit={requestPickup} className="bg-white p-5 rounded-3xl border border-black/10 grid sm:grid-cols-6 gap-3 items-end text-xs">
                <div className="sm:col-span-6 flex items-center gap-2 font-semibold text-sm">
                  <CalendarClock size={16} className="text-[#C5A059]" /> Demander un Ramassage E-com Delivery
                </div>
                <label className="space-y-1">
                  <span className="opacity-60">Nb Colis</span>
                  <input type="number" min={1} value={pickupForm.nb_colis} onChange={(e) => setPickupForm({ ...pickupForm, nb_colis: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-black/15" />
                </label>
                <label className="space-y-1">
                  <span className="opacity-60">Véhicule</span>
                  <select value={pickupForm.type_vehicule} onChange={(e) => setPickupForm({ ...pickupForm, type_vehicule: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-black/15">
                    <option value={1}>Moto</option>
                    <option value={2}>Voiture</option>
                    <option value={3}>Pickup</option>
                    <option value={4}>Fourgon</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="opacity-60">Commune</span>
                  <input type="text" value={pickupForm.commune} onChange={(e) => setPickupForm({ ...pickupForm, commune: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" />
                </label>
                <label className="space-y-1">
                  <span className="opacity-60">Heure</span>
                  <input type="text" value={pickupForm.heure} onChange={(e) => setPickupForm({ ...pickupForm, heure: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" />
                </label>
                <label className="space-y-1">
                  <span className="opacity-60">Note</span>
                  <input type="text" value={pickupForm.note} onChange={(e) => setPickupForm({ ...pickupForm, note: e.target.value })} placeholder="Ex: Sonner" className="w-full px-3 py-2 rounded-xl border border-black/15" />
                </label>
                <button type="submit" className="py-2.5 px-4 rounded-xl bg-black text-white font-semibold">Envoyer Ramassage</button>
              </form>

              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <motion.div
                    layout
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-3xl border border-black/10 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 font-semibold text-sm">
                          <span className="text-[#C5A059] font-mono">#{o.orderNumber}</span>
                          <span>— {o.customerName}</span>
                          {o.trackingCode && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono">
                              Tracking: {o.trackingCode}
                            </span>
                          )}
                          {o.ecomStatus && (
                            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-[11px]">
                              E-com: {o.ecomStatus} {o.ecomLogistic ? `(${o.ecomLogistic})` : ''}
                            </span>
                          )}
                          {o.ecomPaid && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Encaissé</span>}
                          {o.ecomRecovered && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Recouvert</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs opacity-75">
                          <a href={`tel:${o.customerPhone}`} className="inline-flex items-center gap-1 hover:underline"><Phone size={12} /> {o.customerPhone}</a>
                          <a href={`https://wa.me/213${o.customerPhone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">WhatsApp</a>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} /> W{o.wilayaCode} {o.wilayaName} • {o.commune} {o.stopdeskName ? `[${o.stopdeskCode} ${o.stopdeskName}]` : ''}
                          </span>
                          <span>{o.deliveryType === 'HOME' ? 'À Domicile' : 'Stop Desk'}</span>
                          <span>{new Date(o.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                        {o.address && <p className="text-xs opacity-65">Adresse : {o.address}</p>}
                      </div>

                      <div className="text-end space-y-1">
                        <p className="text-lg font-bold">{o.totalDzd.toLocaleString()} DZD</p>
                        <p className="text-[11px] opacity-60">
                          Articles: {o.subtotalDzd} {o.discountDzd > 0 ? `- ${o.discountDzd} (${o.promoCode})` : ''} + Liv: {o.shippingDzd} DZD
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs bg-stone-50 p-3 rounded-2xl">
                      {o.items.map((it) => (
                        <span key={it.id} className="px-2.5 py-1 rounded-lg bg-white border border-black/10">
                          <span className="inline-flex items-center gap-1.5 flex-wrap">
  <span>{it.product?.titleFr} — Taille <strong>{it.variant?.size}</strong></span>
  {it.variant?.colorName && (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 border border-black/10 text-[11px]">
      <span className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block" style={{ backgroundColor: it.variant.colorHex || '#141414' }} />
      <span>Couleur : <strong>{it.variant.colorName}</strong></span>
    </span>
  )}
  <span>× {it.quantity} ({it.unitPriceDzd} DZD)</span>
</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/10">
                      <div className="flex flex-wrap gap-2">
                        {!o.trackingCode ? (
                          <>
                            <button
                              onClick={() => ecomDispatch(o.id, 0)}
                              disabled={busyAction === o.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#13382C] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              <Send size={12} /> Envoyer E-com (En prép.)
                            </button>
                            <button
                              onClick={() => ecomDispatch(o.id, 1)}
                              disabled={busyAction === o.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              <Send size={12} /> Envoyer & Confirmer
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openBordereau(o.trackingCode!, '10x13')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/20 text-xs font-semibold hover:bg-stone-50">
                              <Printer size={12} /> Bordereau 10×13
                            </button>
                            <button onClick={() => openBordereau(o.trackingCode!, '10x10')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/20 text-xs font-semibold hover:bg-stone-50">
                              <Printer size={12} /> 10×10
                            </button>
                            <button onClick={() => ecomConfirmParcel(o.trackingCode!)} className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold">
                              Confirmer Prêt
                            </button>
                            <button
                              onClick={() =>
                                setEditParcel({
                                  tracking: o.trackingCode!,
                                  nom_complet: o.customerName,
                                  mobile_1: o.customerPhone,
                                  id_wilaya: o.wilayaCode,
                                  commune: o.commune,
                                  code_stopdesk: o.stopdeskCode || '',
                                  stopdesk: o.deliveryType === 'DESK' ? 1 : 0,
                                  adresse: o.address || '',
                                  total: o.totalDzd,
                                  article: o.items.map((i) => `${i.product.titleFr} (${i.variant?.size}) x${i.quantity}`).join(', '),
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/20 text-xs"
                            >
                              <Edit3 size={12} /> Modifier Colis
                            </button>
                            <button
                              onClick={() => openReclamationModal(o.trackingCode!)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 text-amber-800 text-xs"
                            >
                              <AlertCircle size={12} /> Réclamation
                            </button>
                            <button
                              onClick={async () => {
                                const r = await fetch(`/api/admin/ecom?action=detail&tracking=${encodeURIComponent(o.trackingCode!)}`);
                                const d = await r.json();
                                setInspectDetail(d.detail || d);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-black/20 text-xs"
                            >
                              Historique
                            </button>
                            <button onClick={() => ecomDeleteParcel(o.trackingCode!)} className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs">
                              Annuler Colis
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={o.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const r = await fetch('/api/admin/orders', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderId: o.id, status: newStatus }),
                            });
                            const d = await r.json();
                            if (d.ecomMessage) notify(d.ecomMessage);
                            else if (d.ecomWarning) notify(`Statut enregistré • E-com: ${d.ecomWarning}`);
                            loadAll();
                          }}
                          className="px-3 py-2 rounded-xl border border-black/20 text-xs font-semibold bg-white"
                        >
                          <option value="PENDING">En Attente</option>
                          <option value="CONFIRMED">Confirmée (+ Sync E-com)</option>
                          <option value="SHIPPED">Expédiée (+ Confirmer E-com)</option>
                          <option value="DELIVERED">Livrée & Encaissée</option>
                          <option value="CANCELLED">Annulée</option>
                          <option value="RETURNED">Retour</option>
                        </select>
                        <button
                          onClick={async () => {
                            if (!confirm('Supprimer définitivement cette commande ?')) return;
                            await fetch(`/api/admin/orders?id=${o.id}`, { method: 'DELETE' });
                            loadAll();
                          }}
                          className="p-2 text-black/40 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {tab === 'catalog' && (
            <div className="space-y-8">
              <form onSubmit={saveProduct} className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl flex items-center gap-2">
                    {editingId ? <Edit3 size={18} className="text-[#C5A059]" /> : <Plus size={18} className="text-[#C5A059]" />}
                    <span>{editingId ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</span>
                  </h2>
                  {editingId && (
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs underline">Annuler modification</button>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <input required placeholder="Titre FR *" value={pForm.titleFr} onChange={(e) => setPForm({ ...pForm, titleFr: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <input required placeholder="العنوان بالعربية *" value={pForm.titleAr} onChange={(e) => setPForm({ ...pForm, titleAr: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <input placeholder="Title EN" value={pForm.titleEn} onChange={(e) => setPForm({ ...pForm, titleEn: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <textarea placeholder="Description FR" value={pForm.descriptionFr} onChange={(e) => setPForm({ ...pForm, descriptionFr: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" rows={2} />
                  <textarea placeholder="الوصف بالعربية" value={pForm.descriptionAr} onChange={(e) => setPForm({ ...pForm, descriptionAr: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" rows={2} />
                  <textarea placeholder="Description EN" value={pForm.descriptionEn} onChange={(e) => setPForm({ ...pForm, descriptionEn: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" rows={2} />
                  <input required type="number" placeholder="Prix DZD *" value={pForm.priceDzd} onChange={(e) => setPForm({ ...pForm, priceDzd: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <input type="number" placeholder="Ancien prix barré (optionnel)" value={pForm.compareAtPriceDzd} onChange={(e) => setPForm({ ...pForm, compareAtPriceDzd: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <select value={pForm.categoryId} onChange={(e) => setPForm({ ...pForm, categoryId: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-black/15">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
                  </select>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Images (1 URL par ligne) :</span>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 cursor-pointer hover:bg-black hover:text-white font-semibold">
                      <Upload size={13} /> Choisir une Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await uploadCloudinary(f);
                          if (url) setPForm((prev) => ({ ...prev, imageUrlsText: prev.imageUrlsText ? `${prev.imageUrlsText}\n${url}` : url }));
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="https://..."
                    value={pForm.imageUrlsText}
                    onChange={(e) => setPForm({ ...pForm, imageUrlsText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs font-mono"
                  />
                  {pForm.imageUrlsText.trim() && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pForm.imageUrlsText.split('\n').map((s) => s.trim()).filter(Boolean).map((url, idx) => (
                        <div key={idx} className="relative w-16 h-20 rounded-xl overflow-hidden border border-black/15 bg-[#F4F0EA]">
                          <img src={url} alt="" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              const next = pForm.imageUrlsText.split('\n').map((s) => s.trim()).filter((_, i) => i !== idx).join('\n');
                              setPForm({ ...pForm, imageUrlsText: next });
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white text-[10px] flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Tailles, Couleurs & Stock :</span>
                    <button
                      type="button"
                      onClick={() => setVariantsDraft([...variantsDraft, { size: 'M', colorName: 'Standard', colorHex: '#141414', stockQuantity: 10 }])}
                      className="px-3 py-1 rounded-lg border border-black/15 font-semibold"
                    >
                      + Variante
                    </button>
                  </div>
                  <div className="space-y-2">
                    {variantsDraft.map((v, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <input value={v.size} onChange={(e) => { const n = [...variantsDraft]; n[idx].size = e.target.value; setVariantsDraft(n); }} placeholder="Taille" className="px-3 py-2 rounded-lg border border-black/15" />
                        <input value={v.colorName} onChange={(e) => { const n = [...variantsDraft]; n[idx].colorName = e.target.value; setVariantsDraft(n); }} placeholder="Couleur" className="px-3 py-2 rounded-lg border border-black/15" />
                        <input type="color" value={v.colorHex} onChange={(e) => { const n = [...variantsDraft]; n[idx].colorHex = e.target.value; setVariantsDraft(n); }} className="h-9 w-full rounded-lg border border-black/15" />
                        <input type="number" value={v.stockQuantity} onChange={(e) => { const n = [...variantsDraft]; n[idx].stockQuantity = Number(e.target.value); setVariantsDraft(n); }} placeholder="Stock" className="px-3 py-2 rounded-lg border border-black/15" />
                        <button type="button" onClick={() => setVariantsDraft(variantsDraft.filter((_, i) => i !== idx))} className="text-red-600 text-xs">Supprimer</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={pForm.isFeatured} onChange={(e) => setPForm({ ...pForm, isFeatured: e.target.checked })} /> Produit Vedette</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={pForm.isActive} onChange={(e) => setPForm({ ...pForm, isActive: e.target.checked })} /> Visible sur la boutique</label>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest font-semibold">
                  {editingId ? 'Enregistrer les Modifications' : 'Publier sur la Boutique'}
                </button>
              </form>

              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                <h3 className="font-serif text-xl">Catégories ({categories.length})</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
                    setCatForm({ nameFr: '', nameAr: '', nameEn: '' });
                    loadAll();
                  }}
                  className="grid sm:grid-cols-4 gap-2 text-xs"
                >
                  <input required placeholder="Nom FR" value={catForm.nameFr} onChange={(e) => setCatForm({ ...catForm, nameFr: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15" />
                  <input required placeholder="الاسم بالعربية" value={catForm.nameAr} onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15" />
                  <input placeholder="Name EN" value={catForm.nameEn} onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15" />
                  <button type="submit" className="py-2 px-4 rounded-xl bg-black text-white font-semibold">+ Ajouter Catégorie</button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <div key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-black/10 text-xs">
                      <span>{c.nameFr} / {c.nameAr}</span>
                      <button onClick={async () => { const r = await fetch(`/api/admin/categories?id=${c.id}`, { method: 'DELETE' }); if (!r.ok) { const d = await r.json(); alert(d.error); } else loadAll(); }} className="text-red-500">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-black/10 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.titleFr}</p>
                      <p className="text-xs text-[#9A7835] font-semibold">{p.priceDzd.toLocaleString()} DZD • {p.isActive ? 'Actif' : 'Masqué'}</p>
                      <p className="text-[11px] opacity-60">Stock total: {p.variants.reduce((s, v) => s + v.stockQuantity, 0)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEditProduct(p)} className="p-2 rounded-lg hover:bg-stone-100" title="Modifier"><Edit3 size={15} /></button>
                      <button
                        onClick={async () => {
                          if (!confirm('Masquer/Supprimer cet article ?')) return;
                          await fetch(`/api/admin/products?id=${p.id}&hard=true`, { method: 'DELETE' });
                          loadAll();
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE E-COM 58 WILAYAS (Read-only prices synced from E-com + Active/Delay controls) */}
          {tab === 'delivery' && (
            <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl">Couverture & Tarifs Live E-com Delivery</h2>
                  <p className="text-xs opacity-60">
                    Les tarifs Domicile & Stop Desk sont synchronisés directement depuis votre compte E-com Delivery.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input type="text" value={wilayaFilter} onChange={(e) => setWilayaFilter(e.target.value)} placeholder="Filtrer wilaya..." className="px-3.5 py-2 rounded-full border border-black/15 text-xs" />
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/wilayas', { method: 'POST' });
                      const d = await res.json();
                      if (res.ok) { notify(`${d.updatedCount} wilayas actualisées depuis E-com Delivery !`); loadAll(); }
                      else alert(d.error || 'Erreur sync tarifs');
                    }}
                    className="px-4 py-2 rounded-full bg-[#13382C] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} /> Actualiser depuis E-com
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {wilayas
                  .filter((w) => !wilayaFilter || w.nameFr.toLowerCase().includes(wilayaFilter.toLowerCase()) || String(w.code).includes(wilayaFilter))
                  .map((w) => (
                    <div key={w.code} className="p-4 rounded-2xl bg-stone-50/80 border border-black/8 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{String(w.code).padStart(2, '0')} - {w.nameFr}</p>
                        <p className="text-[11px] opacity-70">
                          Domicile : <strong>{w.homeDeliveryDzd} DZD</strong> • Desk : <strong>{w.stopDeskDzd} DZD</strong>
                        </p>
                        <p className="text-[11px] opacity-55">Délai : {w.delay}</p>
                      </div>
                      <label className="flex flex-col items-end gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={w.isActive}
                          onChange={async (e) => {
                            const updated = { ...w, isActive: e.target.checked };
                            setWilayas(wilayas.map((x) => (x.code === w.code ? updated : x)));
                            await fetch('/api/admin/wilayas', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updated),
                            });
                            notify(`${w.nameFr} ${updated.isActive ? 'activée' : 'désactivée'}`);
                          }}
                        />
                        <span className="text-[10px] opacity-60">{w.isActive ? 'Active' : 'Désactivée'}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMIZE EVERYTHING ON WEBSITE */}
          {tab === 'customize' && (
            <form onSubmit={saveSiteSettings} className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4 text-xs">
                <h2 className="font-serif text-xl">1. Identité, Contact & Réseaux</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="space-y-1"><span>Nom Marque (FR/EN)</span><input value={site.brandName} onChange={(e) => setSite({ ...site, brandName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>اسم العلامة (AR)</span><input value={site.brandNameAr} onChange={(e) => setSite({ ...site, brandNameAr: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>URL Logo (optionnel)</span><input value={site.logoUrl || ''} onChange={(e) => setSite({ ...site, logoUrl: e.target.value || null })} placeholder="https://..." className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Numéro WhatsApp (213...)</span><input value={site.whatsappNumber} onChange={(e) => setSite({ ...site, whatsappNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Téléphone Affiché</span><input value={site.contactPhone} onChange={(e) => setSite({ ...site, contactPhone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Email Contact</span><input value={site.contactEmail} onChange={(e) => setSite({ ...site, contactEmail: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Adresse FR</span><input value={site.addressFr} onChange={(e) => setSite({ ...site, addressFr: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>العنوان AR</span><input value={site.addressAr} onChange={(e) => setSite({ ...site, addressAr: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Livraison Gratuite dès (DZD, 0=désactivé)</span><input type="number" value={site.freeShippingThresholdDzd} onChange={(e) => setSite({ ...site, freeShippingThresholdDzd: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Instagram URL</span><input value={site.instagramUrl} onChange={(e) => setSite({ ...site, instagramUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Facebook URL</span><input value={site.facebookUrl} onChange={(e) => setSite({ ...site, facebookUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>TikTok URL</span><input value={site.tiktokUrl} onChange={(e) => setSite({ ...site, tiktokUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/15" /></label>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4 text-xs">
                <h2 className="font-serif text-xl">2. Couleurs & Modules</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="space-y-1"><span>Fond du Site</span><input type="color" value={site.bgColor} onChange={(e) => setSite({ ...site, bgColor: e.target.value })} className="w-full h-10 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Texte Principal</span><input type="color" value={site.textColor} onChange={(e) => setSite({ ...site, textColor: e.target.value })} className="w-full h-10 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Couleur Or / Accent</span><input type="color" value={site.accentColor} onChange={(e) => setSite({ ...site, accentColor: e.target.value })} className="w-full h-10 rounded-xl border border-black/15" /></label>
                  <label className="space-y-1"><span>Couleur Primaire</span><input type="color" value={site.primaryColor} onChange={(e) => setSite({ ...site, primaryColor: e.target.value })} className="w-full h-10 rounded-xl border border-black/15" /></label>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showAnnouncement} onChange={(e) => setSite({ ...site, showAnnouncement: e.target.checked })} /> Barre d’annonce</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showHero} onChange={(e) => setSite({ ...site, showHero: e.target.checked })} /> Section Hero</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showFeatures} onChange={(e) => setSite({ ...site, showFeatures: e.target.checked })} /> 3 Piliers de confiance</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showSearch} onChange={(e) => setSite({ ...site, showSearch: e.target.checked })} /> Barre de recherche</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showCategoryFilter} onChange={(e) => setSite({ ...site, showCategoryFilter: e.target.checked })} /> Filtres catégories</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showOrderTracking} onChange={(e) => setSite({ ...site, showOrderTracking: e.target.checked })} /> Page Suivi Colis</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={site.showWhatsAppButton} onChange={(e) => setSite({ ...site, showWhatsAppButton: e.target.checked })} /> Bouton WhatsApp</label>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4 text-xs">
                <h2 className="font-serif text-xl">3. Textes Bandeau, Hero, Pied de Page & Guide Tailles</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input value={site.announcementFr} onChange={(e) => setSite({ ...site, announcementFr: e.target.value })} placeholder="Annonce FR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.announcementAr} onChange={(e) => setSite({ ...site, announcementAr: e.target.value })} placeholder="الإعلان AR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.announcementEn} onChange={(e) => setSite({ ...site, announcementEn: e.target.value })} placeholder="Announcement EN" className="px-3 py-2 rounded-xl border border-black/15" />

                  <input value={site.heroTitleFr} onChange={(e) => setSite({ ...site, heroTitleFr: e.target.value })} placeholder="Titre Hero FR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.heroTitleAr} onChange={(e) => setSite({ ...site, heroTitleAr: e.target.value })} placeholder="عنوان Hero AR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.heroTitleEn} onChange={(e) => setSite({ ...site, heroTitleEn: e.target.value })} placeholder="Hero Title EN" className="px-3 py-2 rounded-xl border border-black/15" />

                  <textarea value={site.heroSubtitleFr} onChange={(e) => setSite({ ...site, heroSubtitleFr: e.target.value })} placeholder="Sous-titre Hero FR" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />
                  <textarea value={site.heroSubtitleAr} onChange={(e) => setSite({ ...site, heroSubtitleAr: e.target.value })} placeholder="وصف Hero AR" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />
                  <textarea value={site.heroSubtitleEn} onChange={(e) => setSite({ ...site, heroSubtitleEn: e.target.value })} placeholder="Hero Subtitle EN" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />

                  <input value={site.heroCtaFr} onChange={(e) => setSite({ ...site, heroCtaFr: e.target.value })} placeholder="Bouton CTA FR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.heroCtaAr} onChange={(e) => setSite({ ...site, heroCtaAr: e.target.value })} placeholder="زر CTA AR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.heroCtaEn} onChange={(e) => setSite({ ...site, heroCtaEn: e.target.value })} placeholder="CTA EN" className="px-3 py-2 rounded-xl border border-black/15" />

                  <div className="sm:col-span-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <input value={site.heroImageUrl} onChange={(e) => setSite({ ...site, heroImageUrl: e.target.value })} placeholder="URL Image Hero" className="flex-1 px-3 py-2 rounded-xl border border-black/15" />
                      <label className="px-3 py-2 rounded-xl bg-stone-100 cursor-pointer font-semibold hover:bg-black hover:text-white transition-colors">
                        Uploader Photo Hero
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadCloudinary(f); if (u) setSite({ ...site, heroImageUrl: u }); } }} />
                      </label>
                    </div>
                    {site.heroImageUrl && (
                      <div className="relative w-24 aspect-[4/5] rounded-2xl overflow-hidden border border-black/15 bg-[#F4F0EA]">
                        <img src={site.heroImageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-40" />
                        <img src={site.heroImageUrl} alt="Aperçu Hero" className="relative z-10 w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  <textarea value={site.sizeGuideFr} onChange={(e) => setSite({ ...site, sizeGuideFr: e.target.value })} placeholder="Guide des tailles FR" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />
                  <textarea value={site.sizeGuideAr} onChange={(e) => setSite({ ...site, sizeGuideAr: e.target.value })} placeholder="دليل المقاسات AR" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />
                  <textarea value={site.sizeGuideEn} onChange={(e) => setSite({ ...site, sizeGuideEn: e.target.value })} placeholder="Size Guide EN" className="px-3 py-2 rounded-xl border border-black/15" rows={2} />

                  <input value={site.footerDescFr} onChange={(e) => setSite({ ...site, footerDescFr: e.target.value })} placeholder="Footer FR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.footerDescAr} onChange={(e) => setSite({ ...site, footerDescAr: e.target.value })} placeholder="Footer AR" className="px-3 py-2 rounded-xl border border-black/15" />
                  <input value={site.footerDescEn} onChange={(e) => setSite({ ...site, footerDescEn: e.target.value })} placeholder="Footer EN" className="px-3 py-2 rounded-xl border border-black/15" />
                </div>
              </div>

              <button type="submit" className="w-full py-4 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest font-bold shadow-lg">
                Sauvegarder Toute la Configuration du Site
              </button>
            </form>
          )}

          {/* TAB 6: PROMO CODES & ADMIN ACCOUNT */}
          {tab === 'promos' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                <h2 className="font-serif text-xl">Codes Promo</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/promos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promoForm) });
                    setPromoForm({ code: '', discountType: 'PERCENT', discountValue: '10', minOrderDzd: '0', maxUses: '' });
                    loadAll();
                  }}
                  className="grid grid-cols-2 gap-2 text-xs"
                >
                  <input required placeholder="CODE (ex: RAMADAN15)" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} className="px-3 py-2 rounded-xl border border-black/15 uppercase" />
                  <select value={promoForm.discountType} onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15">
                    <option value="PERCENT">Pourcentage (%)</option>
                    <option value="FIXED">Montant Fixe (DZD)</option>
                  </select>
                  <input required type="number" placeholder="Valeur" value={promoForm.discountValue} onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15" />
                  <input type="number" placeholder="Min commande DZD" value={promoForm.minOrderDzd} onChange={(e) => setPromoForm({ ...promoForm, minOrderDzd: e.target.value })} className="px-3 py-2 rounded-xl border border-black/15" />
                  <button type="submit" className="col-span-2 py-2.5 rounded-xl bg-black text-white font-semibold">+ Créer Code Promo</button>
                </form>
                <div className="space-y-2 text-xs">
                  {promos.map((pr) => (
                    <div key={pr.id} className="flex justify-between items-center p-3 rounded-xl bg-stone-50">
                      <div>
                        <span className="font-mono font-bold">{pr.code}</span>
                        <span className="opacity-70"> — {pr.discountType === 'PERCENT' ? `${pr.discountValue}%` : `${pr.discountValue} DZD`} (utilisé {pr.usedCount}×)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await fetch('/api/admin/promos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pr.id, isActive: !pr.isActive }) });
                            loadAll();
                          }}
                          className={`px-2.5 py-1 rounded-full font-semibold ${pr.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200'}`}
                        >
                          {pr.isActive ? 'Actif' : 'Inactif'}
                        </button>
                        <button onClick={async () => { await fetch(`/api/admin/promos?id=${pr.id}`, { method: 'DELETE' }); loadAll(); }} className="text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-black/10 space-y-4">
                <h2 className="font-serif text-xl">Sécurité du Compte Admin</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await fetch('/api/admin/account', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountForm) });
                    if (r.ok) { notify('Compte admin mis à jour !'); setAccountForm({ name: '', email: '', newPassword: '' }); }
                    else { const d = await r.json(); alert(d.error || 'Erreur'); }
                  }}
                  className="space-y-3 text-xs"
                >
                  <input placeholder="Nouveau nom" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <input type="email" placeholder="Nouvel email admin" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <input type="password" placeholder="Nouveau mot de passe (min 8 car.)" value={accountForm.newPassword} onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-black/15" />
                  <button type="submit" className="w-full py-3 rounded-xl bg-black text-white font-semibold">Mettre à Jour</button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals: Inspect Parcel, Edit Parcel (PUT /colis), Reclamation */}
      {inspectDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl">Détail E-com — {String(inspectDetail.tracking || '')}</h3>
              <button onClick={() => setInspectDetail(null)}><X size={18} /></button>
            </div>
            <pre className="text-[11px] bg-stone-50 p-4 rounded-2xl overflow-x-auto">{JSON.stringify(inspectDetail, null, 2)}</pre>
          </div>
        </div>
      )}

      {editParcel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await fetch('/api/admin/ecom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update-parcel', ...editParcel }),
              });
              const d = await r.json();
              if (r.ok) { notify(`Colis ${editParcel.tracking} modifié sur E-com Delivery`); setEditParcel(null); loadAll(); }
              else alert(d.error || 'Modification refusée (colis déjà confirmé ?)');
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 text-xs"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl">Modifier Colis {editParcel.tracking}</h3>
              <button type="button" onClick={() => setEditParcel(null)}><X size={18} /></button>
            </div>
            <input required value={editParcel.nom_complet} onChange={(e) => setEditParcel({ ...editParcel, nom_complet: e.target.value })} placeholder="Client" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            <input required value={editParcel.mobile_1} onChange={(e) => setEditParcel({ ...editParcel, mobile_1: e.target.value })} placeholder="Téléphone" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            <input required type="number" value={editParcel.total} onChange={(e) => setEditParcel({ ...editParcel, total: Number(e.target.value) })} placeholder="Total DZD" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            {editParcel.stopdesk === 1 ? (
              <input required value={editParcel.code_stopdesk} onChange={(e) => setEditParcel({ ...editParcel, code_stopdesk: e.target.value })} placeholder="Code Stopdesk (ex: 16B)" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            ) : (
              <input required value={editParcel.commune} onChange={(e) => setEditParcel({ ...editParcel, commune: e.target.value })} placeholder="Commune" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            )}
            <input value={editParcel.adresse} onChange={(e) => setEditParcel({ ...editParcel, adresse: e.target.value })} placeholder="Adresse" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            <input required value={editParcel.article} onChange={(e) => setEditParcel({ ...editParcel, article: e.target.value })} placeholder="Article" className="w-full px-3 py-2 rounded-xl border border-black/15" />
            <button type="submit" className="w-full py-3 rounded-xl bg-black text-white font-semibold">Enregistrer sur E-com</button>
          </form>
        </div>
      )}

      {reclamTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              let valeur: Record<string, unknown> | undefined;
              if (selectedMotif?.type_champ === 'montant') valeur = { montant: Number(reclamForm.valeurInput) };
              else if (selectedMotif?.type_champ === 'telephone') valeur = { telephone: reclamForm.valeurInput };
              else if (selectedMotif?.type_champ === 'date') valeur = { date: reclamForm.valeurInput };
              else if (selectedMotif?.type_champ === 'echange') valeur = { echange: true };

              const r = await fetch('/api/admin/ecom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'reclamation-create',
                  tracking: reclamTarget,
                  id_motif: reclamForm.id_motif,
                  valeur,
                  remarque: reclamForm.remarque,
                }),
              });
              const d = await r.json();
              if (r.ok) { notify(`Réclamation créée : ${d.data?.reference || 'OK'}`); setReclamTarget(null); }
              else alert(d.data?.error?.message || d.error || 'Erreur réclamation');
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 text-xs"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl">Réclamation Colis {reclamTarget}</h3>
              <button type="button" onClick={() => setReclamTarget(null)}><X size={18} /></button>
            </div>
            <select value={reclamForm.id_motif} onChange={(e) => setReclamForm({ ...reclamForm, id_motif: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-black/15">
              {motifs.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>
            {selectedMotif && selectedMotif.type_champ !== 'aucun' && selectedMotif.type_champ !== 'echange' && (
              <input
                required
                placeholder={selectedMotif.libelle_champ || selectedMotif.type_champ}
                value={reclamForm.valeurInput}
                onChange={(e) => setReclamForm({ ...reclamForm, valeurInput: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-black/15"
              />
            )}
            <textarea
              placeholder="Remarque..."
              value={reclamForm.remarque}
              onChange={(e) => setReclamForm({ ...reclamForm, remarque: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/15"
              rows={2}
            />
            <button type="submit" className="w-full py-3 rounded-xl bg-black text-white font-semibold">Envoyer Réclamation</button>
          </form>
        </div>
      )}
    </div>
  );
}