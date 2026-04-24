import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Package, ClipboardList, Download, RefreshCcw,
  Check, Clock, Lock, LogOut, Loader2, Sun, Moon,
  Plus, Trash2, UserPlus, Minus, ArrowLeft, AlertCircle, X
} from 'lucide-react';
import { useTheme } from './ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} type="button"
      className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-main text-text-muted active:scale-90 transition-all flex-shrink-0"
      aria-label="Toggle theme">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const EMPTY_PRODUCT = { name: '', description: '', price: '', stock_quantity: '', max_per_customer: '', image_url: '' };

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('orders');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState(EMPTY_PRODUCT);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({ customer_name: '', customer_phone: '', items: [] });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Separate interval that always has fresh token reference
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      const [ordRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, cfg),
        axios.get(`${API_URL}/products/admin/all`, cfg),
      ]);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await axios.post(`${API_URL}/admin/login`, loginData);
      setToken(res.data.token);
    } catch {
      setErrorMsg('Invalid username or password');
    } finally {
      setSaving(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, productFormData, cfg);
      } else {
        await axios.post(`${API_URL}/products`, productFormData, cfg);
      }
      // Close form immediately on success
      setShowProductForm(false);
      setEditingProduct(null);
      setProductFormData(EMPTY_PRODUCT);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleManualOrderSubmit = async (e) => {
    e.preventDefault();
    if (manualOrderData.items.length === 0) { setErrorMsg('Add at least one item'); return; }
    try {
      setSaving(true);
      setErrorMsg('');
      await axios.post(`${API_URL}/orders`, { ...manualOrderData, language: i18n.language });
      setShowManualOrder(false);
      setManualOrderData({ customer_name: '', customer_phone: '', items: [] });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  const removeOrder = async (id) => {
    if (!window.confirm(t('confirm_remove'))) return;
    try {
      await axios.delete(`${API_URL}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch { setErrorMsg('Failed to remove order'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch { setErrorMsg('Update failed'); }
  };

  const exportPDF = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/export/daily`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `manifest-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { setErrorMsg('Export failed'); }
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductFormData({ ...p, description: p.description || '' });
    setShowProductForm(true);
  };

  const closeProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductFormData(EMPTY_PRODUCT);
    setErrorMsg('');
  };

  /* ── LOGIN SCREEN ── */
  if (!token) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex items-center justify-between p-5">
          <button onClick={() => window.history.back()} type="button"
            className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-main text-text-muted active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex flex-col justify-center px-6 pb-10 max-w-sm mx-auto w-full">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-text-main font-display">{t('admin_portal')}</h1>
            <p className="text-text-muted text-sm mt-1">{t('admin_login_msg')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input className="input-serious" placeholder="Username"
              value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} required />
            <input className="input-serious" type="password" placeholder="Password"
              value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
              {saving ? <Loader2 className="animate-spin" size={22} /> : t('sign_in')}
            </button>
          </form>
          <div className="flex gap-2 justify-center mt-6">
            {['en', 'rw', 'fr'].map(lang => (
              <button key={lang} type="button" onClick={() => i18n.changeLanguage(lang)}
                className={`px-3 py-1 rounded-lg font-bold text-sm transition-all ${i18n.language === lang ? 'bg-primary text-white' : 'bg-card border border-border-main text-text-muted'}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN DASHBOARD ── */
  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col lg:flex-row pb-20 lg:pb-0">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border-main h-screen sticky top-0 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-border-main">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">N</div>
            <div>
              <h1 className="font-black text-text-main font-display text-lg leading-none">Ngamia</h1>
              <p className="text-text-muted text-xs font-semibold">{t('manage_operations')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('orders')} type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${view === 'orders' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:bg-bg'}`}>
            <ClipboardList size={18} /> {t('active_queue')}
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-auto bg-accent text-white text-xs font-black px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={() => setView('inventory')} type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${view === 'inventory' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:bg-bg'}`}>
            <Package size={18} /> {t('inventory')}
          </button>
        </nav>

        {/* Actions */}
        <div className="p-4 space-y-2 border-t border-border-main">
          <button onClick={() => view === 'orders' ? setShowManualOrder(true) : setShowProductForm(true)} type="button"
            className="w-full btn-accent py-3 text-sm">
            <Plus size={16} /> {view === 'orders' ? t('add_customer') : t('add_product')}
          </button>
          <button onClick={exportPDF} type="button" className="w-full btn-primary py-3 text-sm">
            <Download size={16} /> {t('export_manifest')}
          </button>
          <button onClick={fetchData} type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-bg border border-border-main rounded-2xl text-text-muted text-sm font-bold hover:text-primary transition-all">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-main flex items-center justify-between">
          <div className="flex gap-1">
            {['en', 'rw', 'fr'].map(lang => (
              <button key={lang} type="button" onClick={() => i18n.changeLanguage(lang)}
                className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${i18n.language === lang ? 'bg-primary text-white' : 'bg-bg border border-border-main text-text-muted'}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setToken(null)} type="button"
              className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border-main px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">N</div>
            <h1 className="font-black text-text-main text-base font-display leading-none">
              {view === 'orders' ? t('active_queue') : t('inventory')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} type="button" className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-main text-text-muted active:scale-90 transition-all">
              <RefreshCcw size={16} />
            </button>
            <button onClick={exportPDF} type="button" className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
              <Download size={16} />
            </button>
            <ThemeToggle />
            <button onClick={() => setToken(null)} type="button" className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 active:scale-90 transition-all border border-red-100 dark:border-red-900/30">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Desktop page header */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-border-main bg-card">
          <div>
            <h2 className="text-2xl font-black text-text-main font-display">
              {view === 'orders' ? t('active_queue') : t('inventory')}
            </h2>
            <p className="text-text-muted text-sm">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {loading && <Loader2 className="animate-spin text-primary" size={20} />}
        </div>

      {errorMsg && (
        <div className="mx-4 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2"><AlertCircle size={16} /> {errorMsg}</div>
          <button onClick={() => setErrorMsg('')} type="button" className="text-red-400 font-black">✕</button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {view === 'orders' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {loading && orders.length === 0 ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={40} /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-widest">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="card-serious p-4 border-l-4 border-l-primary">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-primary font-display leading-none">#{order.queue_number}</span>
                    <div>
                      <p className="font-black text-text-main text-base">{order.customer_name}</p>
                      <p className="text-text-muted text-sm font-semibold">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{t('pickup_scheduled')}</p>
                    <p className="font-black text-text-main font-display flex items-center gap-1 justify-end">
                      <Clock size={14} className="text-accent" />
                      {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.OrderItems.map(item => (
                    <span key={item.id} className="bg-bg border border-border-main px-3 py-1 rounded-xl text-xs font-black text-text-main uppercase tracking-wide">
                      {item.quantity}× {item.Product.name}
                    </span>
                  ))}
                </div>
                {order.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(order.id, 'picked_up')} type="button"
                      className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2 text-sm active:scale-95 transition-all">
                      <Check size={18} /> {t('complete')}
                    </button>
                    <button onClick={() => removeOrder(order.id)} type="button"
                      className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/30 active:scale-95 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <span className={`inline-block px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${order.status === 'picked_up' ? 'bg-bg text-text-muted border border-border-main' : 'bg-red-600 text-white'}`}>
                    {order.status === 'picked_up' ? t('complete') : t('missed')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {products.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-widest">No products yet</p>
              </div>
            ) : products.map(p => (
              <div key={p.id} className="card-serious p-4 flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-border-main" alt={p.name} />
                ) : (
                  <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                    <Package size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-text-main font-display truncate">{p.name}</p>
                  {p.description && <p className="text-text-muted text-xs truncate">{p.description}</p>}
                  <p className="text-primary font-black font-display">{p.price} <span className="text-xs text-text-muted font-bold">RWF</span></p>
                  <div className="flex gap-3 mt-1">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${p.stock_quantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {t('stock')}: {p.stock_quantity}
                    </span>
                    <span className="text-xs font-bold text-text-muted">Max: {p.max_per_customer}</span>
                  </div>
                </div>
                <button onClick={() => openEditProduct(p)} type="button"
                  className="flex-shrink-0 px-4 py-2 bg-bg border border-border-main rounded-xl text-sm font-black text-text-muted hover:text-primary hover:border-primary transition-all">
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border-main px-4 py-2 flex items-center justify-around">
        <button onClick={() => setView('orders')} type="button"
          className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${view === 'orders' ? 'bg-primary/10 text-primary' : 'text-text-muted'}`}>
          <ClipboardList size={22} />
          <span className="text-xs font-black uppercase tracking-wide">{t('active_queue')}</span>
        </button>
        <button onClick={() => view === 'orders' ? setShowManualOrder(true) : setShowProductForm(true)} type="button"
          className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all -mt-5 border-4 border-bg">
          <Plus size={26} />
        </button>
        <button onClick={() => setView('inventory')} type="button"
          className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${view === 'inventory' ? 'bg-primary/10 text-primary' : 'text-text-muted'}`}>
          <Package size={22} />
          <span className="text-xs font-black uppercase tracking-wide">{t('inventory')}</span>
        </button>
      </nav>

      </div> {/* end main content */}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[95vh] overflow-y-auto shadow-2xl border border-border-main">
            <div className="flex items-center justify-between p-5 border-b border-border-main sticky top-0 bg-card z-10">
              <h2 className="text-xl font-black text-primary font-display">{editingProduct ? t('edit_product') : t('add_product')}</h2>
              <button onClick={closeProductForm} type="button" className="w-9 h-9 bg-bg rounded-xl flex items-center justify-center text-text-muted border border-border-main">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('product_name')} *</label>
                <input className="input-serious" value={productFormData.name}
                  onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('description')}</label>
                <textarea className="input-serious resize-none" rows={2} value={productFormData.description || ''}
                  onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder={t('description_placeholder')} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('price')} *</label>
                  <input type="number" min="0" className="input-serious" value={productFormData.price}
                    onChange={e => setProductFormData({ ...productFormData, price: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('stock')} *</label>
                  <input type="number" min="0" className="input-serious" value={productFormData.stock_quantity}
                    onChange={e => setProductFormData({ ...productFormData, stock_quantity: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('max_per_cust')} *</label>
                  <input type="number" min="1" className="input-serious" value={productFormData.max_per_customer}
                    onChange={e => setProductFormData({ ...productFormData, max_per_customer: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('image_url')}</label>
                {/* Show current image preview if exists */}
                {productFormData.image_url && (
                  <div className="relative mb-2 inline-block">
                    <img src={productFormData.image_url} alt="preview" className="w-24 h-24 object-cover rounded-2xl border border-border-main" />
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, image_url: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black"
                    >✕</button>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer w-full p-4 border-4 border-dashed border-border-main rounded-2xl hover:border-primary transition-all bg-bg">
                  <span className="text-2xl">📸</span>
                  <span className="font-bold text-text-muted text-sm">
                    {productFormData.image_url ? 'Change icyapa' : t('image_placeholder')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      // Limit to 2MB
                      if (file.size > 2 * 1024 * 1024) {
                        setErrorMsg('Image too large. Max 2MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProductFormData({ ...productFormData, image_url: reader.result });
                        setErrorMsg('');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-accent flex-1 py-4">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : t('save_product')}
                </button>
                <button type="button" onClick={closeProductForm} className="btn-secondary flex-1 py-4">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showManualOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[95vh] overflow-y-auto shadow-2xl border border-border-main">
            <div className="flex items-center justify-between p-5 border-b border-border-main sticky top-0 bg-card z-10">
              <h2 className="text-xl font-black text-primary font-display">{t('add_customer')}</h2>
              <button onClick={() => setShowManualOrder(false)} type="button" className="w-9 h-9 bg-bg rounded-xl flex items-center justify-center text-text-muted border border-border-main">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleManualOrderSubmit} className="p-5 space-y-4">
              <input className="input-serious" placeholder={t('name')} value={manualOrderData.customer_name}
                onChange={e => setManualOrderData({ ...manualOrderData, customer_name: e.target.value })} required />
              <input className="input-serious" placeholder={t('phone')} value={manualOrderData.customer_phone}
                onChange={e => setManualOrderData({ ...manualOrderData, customer_phone: e.target.value })} required />
              <div>
                <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-2">{t('products_title')}</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {products.map(p => {
                    const existing = manualOrderData.items.find(i => i.product_id === p.id);
                    return (
                      <div key={p.id} className="flex justify-between items-center bg-bg p-3 rounded-2xl border border-border-main">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-bold text-sm text-text-main truncate">{p.name}</p>
                          <p className="text-xs text-primary font-bold">{p.price} RWF</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {existing ? (
                            <>
                              <button type="button" onClick={() => setManualOrderData({ ...manualOrderData, items: manualOrderData.items.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0) })}
                                className="w-8 h-8 bg-card rounded-lg flex items-center justify-center border border-border-main"><Minus size={14} /></button>
                              <span className="font-black w-5 text-center text-text-main">{existing.quantity}</span>
                              <button type="button" onClick={() => setManualOrderData({ ...manualOrderData, items: manualOrderData.items.map(i => i.product_id === p.id ? { ...i, quantity: Math.min(p.max_per_customer, i.quantity + 1) } : i) })}
                                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><Plus size={14} /></button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setManualOrderData({ ...manualOrderData, items: [...manualOrderData.items, { product_id: p.id, quantity: 1 }] })}
                              className="text-primary font-black text-xs uppercase tracking-wider px-3 py-1 bg-primary/10 rounded-lg">+ Add</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-accent flex-1 py-4">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : t('confirm_order')}
                </button>
                <button type="button" onClick={() => setShowManualOrder(false)} className="btn-secondary flex-1 py-4">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
