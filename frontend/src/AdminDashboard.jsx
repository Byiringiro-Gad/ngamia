import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Download, 
  RefreshCcw,
  Check,
  XCircle,
  Clock,
  Lock,
  LogOut,
  ChevronRight,
  Loader2,
  Sun,
  Moon,
  Plus,
  Trash2,
  UserPlus,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from './ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <button 
        onClick={toggleTheme}
        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-all cursor-pointer"
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>
  );
};

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  
  // Use session state only, do not persist token in localStorage for automatic sign-out
  const [token, setToken] = useState(null); 
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('orders'); // orders, inventory
  
  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: '', price: '', stock_quantity: '', max_per_customer: '', image_url: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Manual Order State
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({
    customer_name: '', customer_phone: '', items: []
  });

  // Automatically sign out if the user leaves the tab/window or refreshes
  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [ordRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, config),
        axios.get(`${API_URL}/products`)
      ]);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      if (err.response?.status === 401) setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, productFormData, config);
      } else {
        await axios.post(`${API_URL}/products`, productFormData, config);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductFormData({
        name: '', price: '', stock_quantity: '', max_per_customer: '', image_url: ''
      });
      fetchData();
    } catch (err) {
      setErrorMsg('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleManualOrderSubmit = async (e) => {
    e.preventDefault();
    if (manualOrderData.items.length === 0) {
      setErrorMsg('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/orders`, {
        ...manualOrderData,
        language: i18n.language
      });
      setShowManualOrder(false);
      setManualOrderData({ customer_name: '', customer_phone: '', items: [] });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to place manual order');
    } finally {
      setLoading(false);
    }
  };

  const removeOrder = async (id) => {
    if (!window.confirm(t('confirm_remove'))) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/orders/${id}`, config);
      fetchData();
    } catch (err) {
      setErrorMsg('Failed to remove order');
    }
  };

  const startEditProduct = (p) => {
    setEditingProduct(p);
    setProductFormData(p);
    setShowProductForm(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/login`, loginData);
      setToken(res.data.token);
    } catch (err) {
      setErrorMsg('Login failed: Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  const updateStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${API_URL}/orders/${id}/status`, { status }, config);
      fetchData();
    } catch (err) {
      setErrorMsg('Update failed');
    }
  };

  const exportPDF = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/export/daily`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `manifest-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setErrorMsg('Export failed');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary p-6">
        <ThemeToggle />
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="fixed top-6 left-6 z-[100] w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <form onSubmit={handleLogin} className="card-serious w-full max-w-md p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-xl">
              <Lock className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-black text-text-main">{t('admin_portal')}</h1>
            <p className="text-text-muted font-bold">{t('admin_login_msg')}</p>
          </div>
          <div className="space-y-4">
            <input 
              className="input-serious text-lg p-4"
              placeholder="Username"
              value={loginData.username}
              onChange={e => setLoginData({...loginData, username: e.target.value})}
              required
            />
            <input 
              className="input-serious text-lg p-4"
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={e => setLoginData({...loginData, password: e.target.value})}
              required
            />
          </div>
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border-4 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl font-black text-sm text-center uppercase tracking-widest">
              {errorMsg}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? <Loader2 className="animate-spin" /> : t('sign_in')}
          </button>
          <div className="flex gap-2 justify-center pt-4">
             <button type="button" onClick={() => i18n.changeLanguage('en')} className={`px-3 py-1 rounded-lg font-bold ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-bg text-text-muted'}`}>EN</button>
             <button type="button" onClick={() => i18n.changeLanguage('rw')} className={`px-3 py-1 rounded-lg font-bold ${i18n.language === 'rw' ? 'bg-primary text-white' : 'bg-bg text-text-muted'}`}>RW</button>
             <button type="button" onClick={() => i18n.changeLanguage('fr')} className={`px-3 py-1 rounded-lg font-bold ${i18n.language === 'fr' ? 'bg-primary text-white' : 'bg-bg text-text-muted'}`}>FR</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main flex transition-colors duration-500">
      <ThemeToggle />
      {/* Sidebar */}
      <aside className="w-80 bg-primary dark:bg-slate-900 text-white flex flex-col hidden lg:flex border-r border-border-main shrink-0 h-screen sticky top-0">
        <div className="p-8">
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3 font-display text-white">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg text-indigo-900">N</div>
            Ngamia
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setView('orders')}
            className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all group ${view === 'orders' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-4">
              <ClipboardList size={22} />
              <span className="font-bold text-lg">{t('active_queue')}</span>
            </div>
            <ChevronRight size={18} className={view === 'orders' ? 'opacity-100' : 'opacity-0'} />
          </button>

          <button 
            onClick={() => setView('inventory')}
            className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all group ${view === 'inventory' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-4">
              <Package size={22} />
              <span className="font-bold text-lg">{t('inventory')}</span>
            </div>
            <ChevronRight size={18} className={view === 'inventory' ? 'opacity-100' : 'opacity-0'} />
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 space-y-4">
          <div className="flex gap-2 justify-center">
             <button onClick={() => i18n.changeLanguage('en')} className={`px-2 py-1 rounded font-bold text-xs ${i18n.language === 'en' ? 'bg-accent text-indigo-950' : 'bg-white/10 text-white/50'}`}>EN</button>
             <button onClick={() => i18n.changeLanguage('rw')} className={`px-2 py-1 rounded font-bold text-xs ${i18n.language === 'rw' ? 'bg-accent text-indigo-950' : 'bg-white/10 text-white/50'}`}>RW</button>
             <button onClick={() => i18n.changeLanguage('fr')} className={`px-2 py-1 rounded font-bold text-xs ${i18n.language === 'fr' ? 'bg-accent text-indigo-950' : 'bg-white/10 text-white/50'}`}>FR</button>
           </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-white/70 hover:text-white hover:bg-red-500 rounded-3xl transition-all font-black uppercase tracking-widest text-xs">
            <LogOut size={20} /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-card dark:bg-slate-800 border-b border-border-main p-8 flex justify-between items-center shrink-0 shadow-sm sticky top-0 z-50 transition-colors">
          <div>
            <h1 className="text-4xl font-black text-text-main tracking-tight leading-none">
              {view === 'orders' ? t('active_queue') : t('inventory')}
            </h1>
            <p className="text-text-muted font-bold mt-2">{t('manage_operations')}</p>
          </div>
          <div className="flex gap-4 pr-16">
            {view === 'orders' && (
              <button onClick={() => setShowManualOrder(true)} className="btn-accent px-6 py-3 shadow-xl">
                <UserPlus size={20} /> {t('add_customer')}
              </button>
            )}
            {view === 'inventory' && (
              <button onClick={() => setShowProductForm(true)} className="btn-accent px-6 py-3 shadow-xl">
                <Plus size={20} /> {t('add_product')}
              </button>
            )}
            <button onClick={fetchData} className="btn-secondary px-4 py-3 shadow-sm"><RefreshCcw size={20} /></button>
            <button onClick={exportPDF} className="btn-primary px-6 py-3 shadow-lg">
              <Download size={20} /> {t('export_manifest')}
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {errorMsg && (
            <div className="max-w-5xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border-4 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl font-black text-sm flex justify-between items-center uppercase tracking-widest">
              {errorMsg}
              <button onClick={() => setErrorMsg('')} className="ml-4 text-red-400 hover:text-red-600 text-lg">✕</button>
            </div>
          )}
          {/* Manual Order Modal */}
          {showManualOrder && (
            <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
              <div className="card-serious w-full max-w-lg shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
                <h2 className="text-3xl font-black mb-8 text-primary">{t('add_customer')}</h2>
                <form onSubmit={handleManualOrderSubmit} className="space-y-6">
                  <input className="input-serious text-lg" placeholder={t('name')} value={manualOrderData.customer_name} onChange={e => setManualOrderData({...manualOrderData, customer_name: e.target.value})} required />
                  <input className="input-serious text-lg" placeholder={t('phone')} value={manualOrderData.customer_phone} onChange={e => setManualOrderData({...manualOrderData, customer_phone: e.target.value})} required />
                  <div className="space-y-2">
                    <p className="font-bold text-sm uppercase tracking-widest text-text-muted">{t('products_title')}</p>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded-3xl border-border-main">
                      {products.map(p => {
                        const existing = manualOrderData.items.find(i => i.product_id === p.id);
                        return (
                          <div key={p.id} className="flex justify-between items-center bg-bg p-3 rounded-2xl">
                            <span className="font-bold text-sm">{p.name}</span>
                            <div className="flex items-center gap-3">
                              {existing ? (
                                <>
                                  <button type="button" onClick={() => setManualOrderData({...manualOrderData, items: manualOrderData.items.map(i => i.product_id === p.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0)})} className="p-1 bg-white dark:bg-slate-700 rounded-lg"><Minus size={14}/></button>
                                  <span className="font-black w-4 text-center">{existing.quantity}</span>
                                  <button type="button" onClick={() => setManualOrderData({...manualOrderData, items: manualOrderData.items.map(i => i.product_id === p.id ? {...i, quantity: Math.min(p.max_per_customer, i.quantity + 1)} : i)})} className="p-1 bg-primary text-white rounded-lg"><Plus size={14}/></button>
                                </>
                              ) : (
                                <button type="button" onClick={() => setManualOrderData({...manualOrderData, items: [...manualOrderData.items, {product_id: p.id, quantity: 1}]})} className="text-primary font-black text-sm uppercase tracking-wider">{t('add_to_cart')}</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="btn-accent flex-1">{t('confirm_order')}</button>
                    <button type="button" onClick={() => setShowManualOrder(false)} className="btn-secondary flex-1">{t('cancel')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Product Form Modal */}
          {showProductForm && (
            <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
              <div className="card-serious w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-3xl font-black mb-8 text-primary">{editingProduct ? t('edit_product') : t('add_product')}</h2>
                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-black text-text-muted uppercase tracking-widest text-xs">{t('image_url')}</label>
                    <input className="input-serious text-lg p-4" value={productFormData.image_url} onChange={e => setProductFormData({...productFormData, image_url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-black text-text-muted uppercase tracking-widest text-xs">{t('product_name')}</label>
                    <input className="input-serious text-lg p-4" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-text-muted uppercase tracking-widest text-xs">{t('price')}</label>
                    <input type="number" className="input-serious text-lg p-4" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-text-muted uppercase tracking-widest text-xs">{t('stock')}</label>
                    <input type="number" className="input-serious text-lg p-4" value={productFormData.stock_quantity} onChange={e => setProductFormData({...productFormData, stock_quantity: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-black text-text-muted uppercase tracking-widest text-xs">{t('max_per_cust')}</label>
                    <input type="number" className="input-serious text-lg p-4" value={productFormData.max_per_customer} onChange={e => setProductFormData({...productFormData, max_per_customer: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2 flex gap-4 pt-6">
                    <button type="submit" className="btn-accent flex-1 shadow-xl">{t('save_product')}</button>
                    <button type="button" onClick={() => {setShowProductForm(false); setEditingProduct(null);}} className="btn-secondary flex-1">{t('cancel')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {view === 'orders' ? (
            <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
              {orders.map(order => (
                <div key={order.id} className="card-serious flex flex-col md:flex-row justify-between gap-8 p-8 border-l-[12px] border-l-primary dark:border-l-primary shadow-xl hover:scale-[1.02] transition-transform">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <span className="text-7xl font-black text-primary tracking-tighter">#{order.queue_number}</span>
                      <div>
                        <h3 className="text-2xl font-black text-text-main">{order.customer_name}</h3>
                        <p className="text-xl text-text-muted font-bold tracking-wide">{order.customer_phone}</p>
                      </div>
                    </div>
                    <div className="bg-bg p-4 rounded-3xl inline-flex flex-wrap gap-3 border-2 border-border-main transition-colors">
                       {order.OrderItems.map(item => (
                         <span key={item.id} className="bg-card px-4 py-2 rounded-2xl border border-border-main font-black text-text-main text-sm uppercase tracking-wider shadow-sm">
                           {item.quantity}x {item.Product.name}
                         </span>
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between gap-6 border-t md:border-t-0 md:border-l border-border-main pt-6 md:pt-0 md:pl-10">
                    <div className="text-right">
                      <p className="text-sm font-black text-text-muted uppercase tracking-widest mb-2">{t('pickup_scheduled')}</p>
                      <p className="text-4xl font-black text-text-main flex items-center gap-4 justify-end font-display">
                        <Clock size={32} className="text-accent" /> 
                        {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      {order.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => updateStatus(order.id, 'picked_up')}
                            className="bg-green-600 text-white px-8 py-4 rounded-3xl font-black hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                          >
                            <Check size={24} /> {t('complete')}
                          </button>
                          <button 
                            onClick={() => removeOrder(order.id)}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-3xl font-black hover:bg-red-100 transition-all flex items-center gap-2 border-4 border-red-100 dark:border-red-900/30 shadow-lg"
                            title={t('remove_order')}
                          >
                            <Trash2 size={24} />
                          </button>
                        </>
                      ) : (
                        <span className={`px-8 py-4 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-inner ${
                          order.status === 'picked_up' ? 'bg-bg text-text-muted border-2 border-border-main' : 
                          'bg-red-600 text-white'
                        }`}>
                          {order.status === 'picked_up' ? t('complete') : t('missed')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-serious overflow-hidden p-0 max-w-6xl mx-auto shadow-2xl border-4 border-border-main">
              <table className="w-full text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-6 font-black uppercase tracking-wider text-xs">{t('image')}</th>
                    <th className="p-6 font-black uppercase tracking-wider text-xs">{t('product_name')}</th>
                    <th className="p-6 font-black uppercase tracking-wider text-xs">{t('price')} (RWF)</th>
                    <th className="p-6 font-black uppercase tracking-wider text-xs">{t('stock')}</th>
                    <th className="p-6 font-black uppercase tracking-wider text-xs">{t('max_per_cust')}</th>
                    <th className="p-6 font-black uppercase tracking-wider text-xs text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-bg transition-colors group">
                      <td className="p-6">
                        {p.image_url ? (
                          <img src={p.image_url} className="w-20 h-20 object-cover rounded-[1.5rem] border-4 border-white dark:border-slate-800 shadow-lg" alt="" />
                        ) : (
                          <div className="w-20 h-20 bg-bg rounded-[1.5rem] flex items-center justify-center text-text-muted border-4 border-dashed border-border-main">
                            <Package size={32} />
                          </div>
                        )}
                      </td>
                      <td className="p-6 font-black text-2xl text-text-main leading-tight font-display">{p.name}</td>
                      <td className="p-6 font-black text-2xl text-primary tracking-tighter font-display">{p.price}</td>
                      <td className="p-6">
                        <span className={`px-5 py-2 rounded-2xl font-black text-lg ${p.stock_quantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="p-6 font-black text-text-muted text-2xl tracking-tighter font-display">{p.max_per_customer}</td>
                      <td className="p-6 text-right">
                        <button onClick={() => startEditProduct(p)} className="btn-secondary px-8 py-3 text-sm shadow-sm font-black uppercase tracking-widest">{t('edit_product')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
