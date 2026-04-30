import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { API_URL } from './api';
import {
  Package, ClipboardList, Download, RefreshCcw,
  Check, Clock, Lock, LogOut, Loader2, Sun, Moon,
  Plus, Trash2, Minus, ArrowLeft, AlertCircle, X,
  Tag, CreditCard, RotateCcw, ShieldAlert
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { SkeletonOrder, SkeletonProduct } from './components/Skeletons';

const BASE_URL = API_URL.replace('/api', '');

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

// Custom confirmation modal — replaces all window.confirm() calls
function ConfirmModal({ open, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-card rounded-3xl shadow-2xl border border-border-main w-full max-w-sm p-6 space-y-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
          <ShieldAlert size={24} className={danger ? 'text-red-500' : 'text-primary'} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-black text-text-main text-lg font-display">{title}</h3>
          <p className="text-text-muted text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} type="button"
            className="flex-1 py-3 rounded-2xl border-2 border-border-main font-black text-text-muted text-sm hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} type="button"
            className={`flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_PRODUCT = { name: '', description: '', price: '', stock_quantity: '', max_per_customer: '', category: 'General', image_url: '' };

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [view, setView] = useState('orders');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({ customer_name: '', customer_phone: '', items: [] });
  // Custom confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmLabel: '', danger: false, onConfirm: null });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchData(false); // background refresh without full loading state
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchData = async (showFullLoading = true) => {
    try {
      if (showFullLoading) setLoading(true);
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      const [ordRes, prodRes] = await Promise.all([
        api.get(`/orders`, cfg),
        api.get(`/products/admin/all`, cfg),
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
      if (showFullLoading) setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await api.post(`/admin/login`, loginData);
      setToken(res.data.token);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid username or password');
    } finally {
      setSaving(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      const cfg = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };

      const formData = new FormData();
      formData.append('name', productFormData.name);
      formData.append('description', productFormData.description || '');
      formData.append('price', productFormData.price);
      formData.append('stock_quantity', productFormData.stock_quantity);
      formData.append('max_per_customer', productFormData.max_per_customer);
      formData.append('category', productFormData.category);
      formData.append('image_url', productFormData.image_url || '');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData, cfg);
      } else {
        await api.post(`/products`, formData, cfg);
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setProductFormData(EMPTY_PRODUCT);
      setImageFile(null);
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
      await api.post(`/orders`, { ...manualOrderData, language: i18n.language });
      setShowManualOrder(false);
      setManualOrderData({ customer_name: '', customer_phone: '', items: [] });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  const showConfirm = (opts) => setConfirmModal({ open: true, ...opts });
  const closeConfirm = () => setConfirmModal(m => ({ ...m, open: false, onConfirm: null }));

  const removeOrder = (id) => {
    showConfirm({
      title: 'Remove Order',
      message: 'Are you sure you want to remove this order from the queue? Stock will be restored.',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchData(false);
        } catch { setErrorMsg('Failed to remove order'); }
      },
    });
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData(false);
    } catch { setErrorMsg('Update failed'); }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get(`/admin/export/daily`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob',
        _timeoutOverride: true, timeout: 30000, // PDF generation can take longer
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

  const handleResetAllOrders = () => {
    showConfirm({
      title: t('reset_all_orders'),
      message: t('confirm_reset_orders'),
      confirmLabel: t('reset_all_orders'),
      danger: true,
      onConfirm: () => {
        // Second confirmation for this destructive action
        showConfirm({
          title: t('reset_all_orders'),
          message: t('confirm_reset_orders_final'),
          confirmLabel: 'Yes, delete everything',
          danger: true,
          onConfirm: async () => {
            closeConfirm();
            try {
              setResetting(true);
              setErrorMsg('');
              await api.delete(`/admin/orders/reset`, { headers: { Authorization: `Bearer ${token}` } });
              fetchData(false);
            } catch (err) {
              setErrorMsg(err.response?.data?.error || 'Failed to reset orders');
            } finally {
              setResetting(false);
            }
          },
        });
      },
    });
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductFormData({ ...p, description: p.description || '', category: p.category || 'General' });
    setImageFile(null);
    setShowProductForm(true);
  };

  const closeProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductFormData(EMPTY_PRODUCT);
    setImageFile(null);
    setErrorMsg('');
  };

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Amabaro': return '👔';
      case 'Ibiribwa': return '🍲';
      case 'Ibinyobwa': return '🥤';
      case 'Electronic': return '🔌';
      case 'General': return '📦';
      default: return '🏷️';
    }
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

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col lg:flex-row pb-20 lg:pb-0">

      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border-main h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-border-main">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">N</div>
            <div>
              <h1 className="font-black text-text-main font-display text-lg leading-none">Ngamia</h1>
              <p className="text-text-muted text-xs font-semibold">{t('manage_operations')}</p>
            </div>
          </div>
        </div>

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

        <div className="p-4 space-y-2 border-t border-border-main">
          <button onClick={() => view === 'orders' ? setShowManualOrder(true) : setShowProductForm(true)} type="button"
            className="w-full btn-accent py-3 text-sm">
            <Plus size={16} /> {view === 'orders' ? t('add_customer') : t('add_product')}
          </button>
          <button onClick={exportPDF} type="button" className="w-full btn-primary py-3 text-sm">
            <Download size={16} /> {t('export_manifest')}
          </button>
          <button onClick={() => fetchData(true)} type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-2xl text-primary text-sm font-bold hover:bg-primary/20 transition-all">
            <RefreshCcw size={14} /> Refresh
          </button>
          {view === 'orders' && (
            <button onClick={handleResetAllOrders} disabled={resetting} type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-50 shadow-sm">
              {resetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              {t('reset_all_orders')}
            </button>
          )}
        </div>

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

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border-main px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">N</div>
            <h1 className="font-black text-text-main text-base font-display leading-none">
              {view === 'orders' ? t('active_queue') : t('inventory')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchData(true)} type="button"
              className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30 text-primary active:scale-90 transition-all">
              <RefreshCcw size={16} />
            </button>
            <button onClick={exportPDF} type="button" className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
              <Download size={16} />
            </button>
            {view === 'orders' && (
              <button onClick={handleResetAllOrders} disabled={resetting} type="button"
                className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-50 shadow-sm">
                {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              </button>
            )}
            <ThemeToggle />
            <button onClick={() => setToken(null)} type="button" className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 active:scale-90 transition-all border border-red-100 dark:border-red-900/30">
              <LogOut size={16} />
            </button>
          </div>
        </header>

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

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading && orders.length === 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            <SkeletonOrder />
            <SkeletonOrder />
            <SkeletonOrder />
          </div>
        ) : view === 'orders' ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-widest">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="card-serious p-4 border-l-4 border-l-primary relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-primary font-display leading-none">#{order.queue_number}</span>
                    <div>
                      <p className="font-black text-text-main text-base">{order.customer_name}</p>
                      <p className="text-text-muted text-sm font-semibold">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{t('order_time')}</p>
                    <p className="font-black text-text-main font-display flex items-center gap-1 justify-end">
                      <Clock size={14} className="text-accent" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {order.OrderItems.map(item => (
                    <span key={item.id} className="bg-bg border border-border-main px-3 py-1 rounded-xl text-xs font-black text-text-main uppercase tracking-wide">
                      {item.quantity}× {item.Product.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-border-main">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-2 rounded-xl">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest leading-none mb-1">{t('total_to_pay')}</p>
                      <p className="text-xl font-black text-text-main font-display leading-none">{parseFloat(order.total_price).toLocaleString()} RWF</p>
                    </div>
                  </div>

                  {order.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(order.id, 'picked_up')} type="button"
                        className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 text-sm active:scale-95 transition-all shadow-lg shadow-green-600/20">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {products.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-widest">No products yet</p>
              </div>
            ) : products.map(p => (
              <div key={p.id} className="card-serious p-4 flex items-center gap-4">
                {p.image_url ? (
                  <img src={getFullImageUrl(p.image_url)} className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-border-main" alt={p.name} />
                ) : (
                  <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                    <Package size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-text-main font-display truncate">{p.name}</p>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1">
                      {getCategoryIcon(p.category)} {p.category}
                    </span>
                  </div>
                  {p.description && <p className="text-text-muted text-xs truncate mb-1">{p.description}</p>}
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

      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('product_name')} *</label>
                  <input className="input-serious" value={productFormData.name}
                    onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('category')} *</label>
                  <select 
                    className="input-serious" 
                    value={productFormData.category}
                    onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Amabaro">Amabaro (Clothes)</option>
                    <option value="Ibiribwa">Ibiribwa (Food)</option>
                    <option value="Ibinyobwa">Ibinyobwa (Drinks)</option>
                    <option value="Electronic">Electronic</option>
                  </select>
                </div>
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
                <label className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 block">{t('image')}</label>
                {(productFormData.image_url || imageFile) && (
                  <div className="relative mb-2 inline-block">
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : getFullImageUrl(productFormData.image_url)} 
                      alt="preview" 
                      className="w-24 h-24 object-cover rounded-2xl border border-border-main" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProductFormData({ ...productFormData, image_url: '' });
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black"
                    >✕</button>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer w-full p-4 border-4 border-dashed border-border-main rounded-2xl hover:border-primary transition-all bg-bg">
                  <span className="text-2xl">📸</span>
                  <span className="font-bold text-text-muted text-sm">
                    {productFormData.image_url || imageFile ? 'Change icyapa' : t('image_placeholder')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setErrorMsg('Image too large. Max 2MB.');
                        return;
                      }
                      setImageFile(file);
                      setErrorMsg('');
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

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default AdminDashboard;
