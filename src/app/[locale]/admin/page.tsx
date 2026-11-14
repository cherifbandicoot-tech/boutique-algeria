'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Package, ShoppingCart, Plus, LogOut, Upload, Trash2 } from 'lucide-react';

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
}

interface AdminProduct {
  id: string;
  titleFr: string;
  priceDzd: number;
  isActive: boolean;
}

interface AdminCategory {
  id: string;
  nameFr: string;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('admin@maisonyasmine.dz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [priceDzd, setPriceDzd] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uploading, setUploading] = useState(false);

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
    if (prodData.categories?.[0]) setCategoryId(prodData.categories[0].id);
    setAuthed(true);
    setChecking(false);
  }, []);

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
      setError(d.error || 'Login failed');
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
        alert(sigData.error || 'Configure Cloudinary keys first, or paste an image URL.');
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
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titleFr,
        titleAr,
        titleEn,
        priceDzd: Number(priceDzd),
        categoryId,
        imageUrl,
        sizes: ['S', 'M', 'L', 'XL'],
      }),
    });
    setTitleFr('');
    setTitleAr('');
    setTitleEn('');
    setPriceDzd('');
    setImageUrl('');
    loadDashboard();
  };

  const hideProduct = async (id: string) => {
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    loadDashboard();
  };

  if (checking) return <div className="pt-32 text-center text-sm">Loading...</div>;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-20">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-[#141414]/10 space-y-4">
          <div className="flex items-center gap-2 text-[#9A7835]">
            <Lock size={20} />
            <h1 className="font-serif text-2xl text-[#141414]">Espace Boutique Admin</h1>
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" placeholder="Mot de passe" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-full bg-[#141414] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#13382C]">
            Connexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-10 pt-28 pb-20 space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl md:text-4xl">Tableau de Bord — Maison Yasmine</h1>
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            setAuthed(false);
          }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-[#141414]/20 hover:bg-black hover:text-white"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      <section className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
        <h2 className="font-serif text-2xl mb-4 flex items-center gap-2"><Plus size={20} className="text-[#C5A059]" /> Ajouter un Produit</h2>
        <form onSubmit={addProduct} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input required placeholder="Nom (Français)" value={titleFr} onChange={(e) => setTitleFr(e.target.value)} className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" />
          <input required placeholder="الاسم (بالعربية)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" />
          <input required placeholder="Name (English)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" />
          <input required type="number" placeholder="Prix (DZD)" value={priceDzd} onChange={(e) => setPriceDzd(e.target.value)} className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-4 py-3 rounded-xl border border-[#141414]/15 text-sm">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
          </select>
          <div className="flex gap-2">
            <input required type="url" placeholder="URL Image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-[#141414]/15 text-sm" />
            <label className="px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#141414]/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#141414] hover:text-white transition-colors">
              <Upload size={14} />
              <span>{uploading ? '...' : 'Photo'}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <button type="submit" className="sm:col-span-2 lg:col-span-3 py-3.5 rounded-full bg-[#13382C] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#141414]">
            Publier le Produit
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl flex items-center gap-2"><ShoppingCart size={20} className="text-[#C5A059]" /> Commandes Clients ({orders.length})</h2>
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-5 rounded-2xl border border-[#141414]/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">{o.orderNumber} — {o.customerName} ({o.customerPhone})</p>
                <p className="text-xs text-[#141414]/65">
                  {o.wilayaCode} {o.wilayaName} • {o.commune} ({o.deliveryType}) — <strong>{o.totalDzd.toLocaleString()} DZD</strong>
                </p>
              </div>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="px-3 py-2 rounded-xl border border-[#141414]/15 text-xs font-semibold">
                {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl flex items-center gap-2"><Package size={20} className="text-[#C5A059]" /> Catalogue Actif ({products.length})</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#141414]/10 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{p.titleFr}</p>
                <p className="text-xs text-[#9A7835] font-semibold">{p.priceDzd.toLocaleString()} DZD</p>
              </div>
              <button onClick={() => hideProduct(p.id)} className="p-2 text-[#141414]/40 hover:text-red-600" title="Retirer">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}