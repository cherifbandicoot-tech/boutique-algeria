'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Package, ShoppingCart, Plus, LogOut, Upload, Trash2, CheckCircle, Phone, MapPin } from 'lucide-react';

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  deliveryType: string;
  totalDzd: number;
  status: string;
  createdAt: string;
}

interface AdminProduct {
  id: string;
  titleFr: string;
  titleAr: string;
  priceDzd: number;
  isActive: boolean;
}

interface AdminCategory {
  id: string;
  nameFr: string;
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Standard', 'Sur Mesure'];

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('admin@maisonyasmine.dz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // Product Form state
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [priceDzd, setPriceDzd] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadDashboard = useCallback(async () => {
    const [ordRes, prodRes] = await Promise.all([
      fetch('/api/admin/orders'),
      fetch('/api/admin/products'),
    ]);
    if (ordRes.status === 401 || prodRes.status === 401) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const ordData = await ordRes.json();
    const prodData = await prodRes.json();
    setOrders(ordData.orders || []);
    setProducts((prodData.products || []).filter((p: AdminProduct) => p.isActive));
    setCategories(prodData.categories || []);
    if (prodData.categories?.[0] && !categoryId) setCategoryId(prodData.categories[0].id);
    setAuthed(true);
    setChecking(false);
  }, [categoryId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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
    loadDashboard();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sigRes = await fetch('/api/admin/upload', { method: 'POST' });
      const sigData = await sigRes.json();
      if (!sigRes.ok) {
        alert(sigData.error || 'Erreur de configuration Cloudinary');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', String(sigData.timestamp));
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const uploaded = await uploadRes.json();
      if (uploaded.secure_url) setImageUrl(uploaded.secure_url);
    } finally {
      setUploading(false);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    loadDashboard();
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleFr,
          titleAr,
          titleEn: titleEn || titleFr,
          priceDzd: Number(priceDzd),
          categoryId,
          imageUrl,
          sizes: selectedSizes.length > 0 ? selectedSizes : ['Standard'],
        }),
      });
      setTitleFr('');
      setTitleAr('');
      setTitleEn('');
      setPriceDzd('');
      setImageUrl('');
      loadDashboard();
    } finally {
      setCreating(false);
    }
  };

  const hideProduct = async (id: string) => {
    if (!confirm('Voulez-vous masquer cet article de la boutique ?')) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    loadDashboard();
  };

  if (checking) return <div className="pt-32 text-center text-sm font-medium">Chargement du tableau de bord...</div>;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-[#141414]/10 space-y-4">
          <div className="flex items-center gap-2 text-[#9A7835]">
            <Lock size={20} />
            <h1 className="font-serif text-2xl text-[#141414]">Espace Gestion Boutique</h1>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            placeholder="Mot de passe"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#141414] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#13382C] transition-colors"
          >
            Se Connecter
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED')
    .reduce((sum, o) => sum + o.totalDzd, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20 space-y-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#141414]">Tableau de Bord — Maison Yasmine</h1>
          <p className="text-xs text-[#141414]/60 mt-1">Gérez vos commandes, ajoutez des vêtements et suivez vos ventes.</p>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            setAuthed(false);
          }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-[#141414]/20 hover:bg-black hover:text-white transition-colors"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[#141414]/60">Chiffre d’Affaires</p>
          <p className="text-2xl font-serif font-bold text-[#13382C] mt-2">{totalRevenue.toLocaleString()} DZD</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[#141414]/60">Commandes Totales</p>
          <p className="text-2xl font-serif font-bold text-[#141414] mt-2">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[#141414]/60">Articles Actifs</p>
          <p className="text-2xl font-serif font-bold text-[#9A7835] mt-2">{products.length}</p>
        </div>
      </div>

      {/* Add New Product Form */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-[#141414]/10 shadow-sm space-y-6">
        <h2 className="font-serif text-2xl flex items-center gap-2">
          <Plus size={20} className="text-[#C5A059]" />
          <span>Ajouter une Nouvelle Pièce au Catalogue</span>
        </h2>

        <form onSubmit={addProduct} className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              required
              placeholder="Titre en Français (ex: Karakou Moderne Velours)"
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            />
            <input
              required
              placeholder="العنوان بالعربية (مثال: كاراكو عصري مخملي)"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            />
            <input
              placeholder="Title in English (optional)"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            />
            <input
              required
              type="number"
              placeholder="Prix en DZD (ex: 28000)"
              value={priceDzd}
              onChange={(e) => setPriceDzd(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameFr}</option>
              ))}
            </select>

            {/* Photo Upload & URL */}
            <div className="flex gap-2">
              <input
                required
                type="url"
                placeholder="URL de l'image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#141414]/15 text-sm"
              />
              <label className="px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#141414]/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#141414] hover:text-white transition-colors shrink-0">
                <Upload size={14} />
                <span>{uploading ? 'Chargement...' : 'Photo Directe'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Size Pills Multi-Select */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-[#141414]/70 uppercase tracking-wider">Tailles Disponibles pour cette pièce :</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((sz) => (
                <button
                  type="button"
                  key={sz}
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedSizes.includes(sz)
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414]/70 border-[#141414]/15'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || uploading}
            className="w-full py-4 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#141414] transition-colors disabled:opacity-50"
          >
            {creating ? 'Publication en cours...' : 'Publier ce Vêtement sur la Boutique'}
          </button>
        </form>
      </section>

      {/* Orders Pipeline */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#C5A059]" />
          <span>Commandes Clients ({orders.length})</span>
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-[#141414]/60">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white p-5 rounded-2xl border border-[#141414]/10 flex flex-wrap items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="text-[#C5A059]">#{o.orderNumber}</span>
                    <span>—</span>
                    <span>{o.customerName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#141414]/70">
                    <span className="flex items-center gap-1"><Phone size={13} /> {o.customerPhone}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> Wilaya {o.wilayaCode} ({o.wilayaName}) • {o.commune}</span>
                    <span>({o.deliveryType === 'HOME' ? 'À Domicile' : 'Stop Desk'})</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-bold text-[#141414]">
                    {o.totalDzd.toLocaleString()} DZD
                  </span>

                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#141414]/20 text-xs font-semibold bg-white"
                  >
                    <option value="PENDING">En Attente (Appeler le client)</option>
                    <option value="CONFIRMED">Confirmée</option>
                    <option value="SHIPPED">Expédiée (Yalidine/ZR)</option>
                    <option value="DELIVERED">Livrée & Encaissée</option>
                    <option value="CANCELLED">Annulée</option>
                    <option value="RETURNED">Retour</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Catalog List with Delete Button */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl flex items-center gap-2">
          <Package size={20} className="text-[#C5A059]" />
          <span>Pièces Actives sur la Boutique ({products.length})</span>
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#141414]/10 flex justify-between items-center shadow-xs">
              <div>
                <p className="font-medium text-sm text-[#141414]">{p.titleFr}</p>
                <p className="text-xs text-[#9A7835] font-semibold mt-0.5">{p.priceDzd.toLocaleString()} DZD</p>
              </div>
              <button
                onClick={() => hideProduct(p.id)}
                className="p-2 text-[#141414]/40 hover:text-red-600 transition-colors"
                title="Retirer de la boutique"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}