import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  ArrowRight,
  ArrowLeft,
  CheckCircle, 
  Plus, 
  Minus, 
  Loader2,
  Lock,
  ShoppingBag,
  Sun,
  Moon,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import { ThemeProvider, useTheme } from './ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-main text-text-muted active:scale-90 transition-all flex-shrink-0"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

function SuccessScreen({ orderResult, t, onDone }) {
  const [countdown, setCountdown] = useState(30);
  const [screenshotTaken, setScreenshotTaken] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) { onDone(); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const takeScreenshot = () => {
    setScreenshotTaken(true);
    window.print();
  };

  return (
    <>
      {/* Print styles — only the receipt shows when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary">
        <div id="receipt" className="card-serious w-full max-w-sm p-8 space-y-6 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto border-4 border-white dark:border-card shadow-xl">
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-main font-display uppercase">{t('order_success')}</h1>
            <p className="text-text-muted text-sm mt-1">{t('keep_screen')}</p>
          </div>

          {/* Queue number — big and clear */}
          <div className="bg-bg rounded-3xl p-6 border-4 border-border-main relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
            <p className="text-text-muted font-black uppercase tracking-widest text-xs mb-1">{t('queue_no')}</p>
            <p className="text-8xl font-black text-primary font-display leading-none">#{orderResult.queue_number}</p>
          </div>

          {/* Details */}
          <div className="flex justify-between text-left bg-bg rounded-2xl p-4 border border-border-main">
            <div>
              <p className="text-text-muted font-black uppercase tracking-widest text-xs">{t('pickup_time')}</p>
              <p className="text-xl font-black text-text-main font-display">
                {new Date(orderResult.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-text-muted font-black uppercase tracking-widest text-xs">{t('total')}</p>
              <p className="text-xl font-black text-text-main font-display">{parseFloat(orderResult.total_price).toLocaleString()} RWF</p>
            </div>
          </div>

          {/* Screenshot button */}
          <button
            onClick={takeScreenshot}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              screenshotTaken
                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                : 'bg-accent text-white shadow-lg'
            }`}
          >
            {screenshotTaken ? '✓ Screenshot saved' : '📸 Take Screenshot'}
          </button>

          {/* Done + countdown */}
          <button
            onClick={onDone}
            className="btn-primary w-full py-4"
          >
            {t('done')} ({countdown}s)
          </button>
        </div>
      </div>
    </>
  );
}

function CustomerApp() {
  const { t, i18n } = useTranslation();

  // Persist step and customer across refreshes (session only)
  const [step, setStepRaw] = useState(() => sessionStorage.getItem('ngamia_step') || 'lang');
  const [customer, setCustomerRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_customer')) || { name: '', phone: '' }; }
    catch { return { name: '', phone: '' }; }
  });
  const [products, setProducts] = useState([]);
  const [cart, setCartRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_cart')) || {}; }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [error, setError] = useState('');

  const setStep = (s) => { sessionStorage.setItem('ngamia_step', s); setStepRaw(s); };
  const setCustomer = (c) => { sessionStorage.setItem('ngamia_customer', JSON.stringify(c)); setCustomerRaw(c); };
  const setCart = (fn) => {
    setCartRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      sessionStorage.setItem('ngamia_cart', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (step === 'products') {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExistingOrder = (order) => {
    setExistingOrder(order);

    const savedCart = {};
    order.OrderItems.forEach((item) => {
      savedCart[item.product_id] = item.quantity;
    });

    setCart(savedCart);
    setError('');
    setStep('existing_order');
  };

  const addToCart = (id) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    if ((cart[id] || 0) >= p.max_per_customer) return; // silently block, button is disabled
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    if (!cart[id]) return;
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] === 1) delete updated[id];
      else updated[id] -= 1;
      return updated;
    });
  };

  const handleOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const items = Object.entries(cart).map(([id, qty]) => ({
        product_id: parseInt(id),
        quantity: qty
      }));

      const res = await axios.post(`${API_URL}/orders`, {
        customer_name: customer.name,
        customer_phone: customer.phone,
        items,
        language: i18n.language
      });
      setOrderResult(res.data);
      // Clear session so next customer starts fresh
      sessionStorage.removeItem('ngamia_step');
      sessionStorage.removeItem('ngamia_cart');
      sessionStorage.removeItem('ngamia_customer');
      setStep('success');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existingOrder) {
        openExistingOrder(err.response.data.existingOrder);
        return;
      }

      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-bg transition-colors duration-500">
      
      {step === 'lang' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary text-white">
          <div className="absolute top-5 right-5">
            <ThemeToggle />
          </div>
          <div className="text-center space-y-4 mb-12">
            <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center mx-auto text-4xl font-black shadow-2xl text-indigo-950">N</div>
            <h1 className="text-5xl font-black tracking-tighter font-display uppercase">Ngamia</h1>
            <p className="text-white/70 font-bold uppercase tracking-widest text-sm">{t('select_lang')}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            <button onClick={() => { i18n.changeLanguage('en'); setStep('login'); }} className="btn-secondary border-none py-6">English</button>
            <button onClick={() => { i18n.changeLanguage('rw'); setStep('login'); }} className="btn-secondary border-none py-6">Kinyarwanda</button>
            <button onClick={() => { i18n.changeLanguage('fr'); setStep('login'); }} className="btn-secondary border-none py-6">Français</button>
          </div>
        </div>
      )}

      {step === 'login' && (
        <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setStep('lang')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <ThemeToggle />
          </div>
          <div className="card-serious p-12 space-y-12">
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-text-main font-display">{t('login_title')}</h1>
              <p className="text-text-muted font-bold">{t('welcome')}</p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-black text-text-muted flex items-center gap-2 uppercase tracking-widest">
                  <User size={18} className="text-primary" /> {t('name')}
                </label>
                <input 
                  className="input-serious"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  placeholder="Ex: Jean"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-black text-text-muted flex items-center gap-2 uppercase tracking-widest">
                  <Phone size={18} className="text-primary" /> {t('phone')}
                </label>
                <input 
                  className="input-serious"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="07..."
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                disabled={!customer.name || !customer.phone || loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');
                    const params = new URLSearchParams({
                      name: customer.name.trim(),
                    });
                    const res = await axios.get(
                      `${API_URL}/orders/check/${encodeURIComponent(customer.phone)}?${params.toString()}`
                    );
                    if (res.data) {
                      // Has existing active order — load it for viewing/editing
                      openExistingOrder(res.data);
                    } else {
                      setStep('products');
                    }
                  } catch {
                    setStep('products');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn-primary w-full disabled:opacity-30"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <>{t('start_button')} <ArrowRight /></>}
              </button>
            </div>

            <div className="border-t-4 border-border-main pt-8 text-center">
              <Link to="/admin" className="text-text-muted flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs hover:text-primary transition-all">
                <Lock size={14}/> {t('admin_portal')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {step === 'products' && (
        <div className="min-h-screen bg-bg pb-40 transition-colors duration-500">
          <header className="p-10 bg-card border-b-4 border-border-main sticky top-0 flex justify-between items-center z-10 shadow-sm">
            <button onClick={() => setStep('login')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-black text-text-main font-display leading-tight">{t('products_title')}</h1>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-xs mt-1">{t('available_today')}</p>
            </div>
            <ThemeToggle />
          </header>
          
          <div className="p-8 grid grid-cols-1 gap-8 max-w-2xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-6">
                <Loader2 className="animate-spin text-primary" size={80} />
                <p className="font-black text-text-muted uppercase tracking-widest">{t('loading_products')}</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="card-serious flex items-center justify-between p-8 hover:scale-[1.03] transition-all border-l-[12px] border-l-primary gap-6">
                  <div className="flex items-center gap-8">
                    {p.image_url ? (
                      <img src={p.image_url} className="w-28 h-28 object-cover rounded-[2rem] border-4 border-white dark:border-slate-700 shadow-xl" alt="" />
                    ) : (
                      <div className="w-28 h-28 bg-bg rounded-[2rem] flex items-center justify-center text-text-muted shadow-inner border-4 border-dashed border-border-main">
                        <ShoppingBag size={48} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-text-main font-display leading-tight">{p.name}</h3>
                      {p.description && (
                        <p className="text-text-muted text-sm font-medium">{p.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-primary tracking-tighter font-display">{p.price} RWF</span>
                        <span className="text-border-main font-bold">|</span>
                        <span className="text-text-muted font-black uppercase tracking-widest text-xs">{t('stock')}: {p.stock_quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 bg-bg p-3 rounded-[2rem] border-4 border-border-main shadow-inner">
                    <button onClick={() => removeFromCart(p.id)} className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center shadow-lg text-text-muted active:scale-75 transition-all"><Minus size={28} /></button>
                    <span className="text-3xl font-black w-12 text-center text-text-main font-display">{cart[p.id] || 0}</span>
                    <button onClick={() => addToCart(p.id)} className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl text-white active:scale-75 transition-all"><Plus size={28} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalItems > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-10 bg-card/80 backdrop-blur-xl border-t-8 border-border-main z-20">
              <button onClick={() => setStep('confirm')} className="btn-accent w-full max-w-2xl mx-auto shadow-accent/40 py-6 text-2xl uppercase tracking-widest">
                <ShoppingBag size={32} /> {t('confirm_order')} ({totalItems}) <ArrowRight />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="min-h-screen bg-bg flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
            <button onClick={() => setStep('products')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-text-main font-display">{t('confirm_order')}</h1>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">{t('review_your_order')}</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-3 pb-40">

            {/* Cart items — editable */}
            {products.filter(p => cart[p.id]).map(p => (
              <div key={p.id} className="card-serious p-4 flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} className="w-14 h-14 object-cover rounded-2xl flex-shrink-0 border border-border-main" alt={p.name} />
                ) : (
                  <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-text-main font-display truncate">{p.name}</p>
                  <p className="text-primary font-black text-sm font-display">{(p.price * cart[p.id]).toLocaleString()} RWF</p>
                  <p className="text-text-muted text-xs">{p.price.toLocaleString()} RWF × {cart[p.id]}</p>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => removeFromCart(p.id)}
                    className="w-9 h-9 rounded-xl bg-bg border border-border-main flex items-center justify-center text-text-muted active:scale-75 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-7 text-center font-black text-lg text-text-main font-display">{cart[p.id]}</span>
                  <button
                    onClick={() => addToCart(p.id)}
                    disabled={(cart[p.id] || 0) >= p.max_per_customer}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white active:scale-75 transition-all disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                  {/* Remove item entirely */}
                  <button
                    onClick={() => setCart(prev => { const u = {...prev}; delete u[p.id]; return u; })}
                    className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 active:scale-75 transition-all ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty cart state */}
            {Object.keys(cart).length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm uppercase tracking-widest">{t('cart_empty')}</p>
              </div>
            )}

            {/* Total */}
            {Object.keys(cart).length > 0 && (
              <div className="card-serious p-4 flex justify-between items-center border-l-4 border-l-accent">
                <span className="font-black text-text-muted uppercase tracking-widest text-xs">{t('total')}</span>
                <span className="text-3xl font-black text-primary font-display">
                  {products.filter(p => cart[p.id]).reduce((acc, p) => acc + (p.price * cart[p.id]), 0).toLocaleString()} RWF
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={18} /> {error}
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border-main p-4 space-y-2">
            <div className="max-w-lg mx-auto flex gap-3">
              {/* Clear all */}
              <button
                onClick={() => setCart({})}
                className="flex-shrink-0 px-4 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <Trash2 size={18} /> {t('clear_all')}
              </button>
              {/* Send order */}
              <button
                onClick={handleOrder}
                disabled={loading || Object.keys(cart).length === 0}
                className="flex-1 btn-primary py-4 disabled:opacity-30"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle size={22} /> {t('send_order')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'existing_order' && existingOrder && (
        <div className="min-h-screen bg-bg flex flex-col">
          <div className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
            <button onClick={() => setStep('login')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-text-main font-display">{t('your_order')}</h1>
              <p className="text-accent text-xs font-black uppercase tracking-widest">{t('order_active')}</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4 pb-40">
            {/* Queue number display */}
            <div className="card-serious p-6 text-center border-t-4 border-t-accent">
              <p className="text-text-muted font-black uppercase tracking-widest text-xs mb-1">{t('queue_no')}</p>
              <p className="text-7xl font-black text-primary font-display leading-none">#{existingOrder.queue_number}</p>
              <p className="text-text-muted text-sm mt-2">{t('pickup_time')}: <span className="font-black text-text-main">{new Date(existingOrder.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
            </div>

            {/* Current items */}
            <p className="font-black text-text-muted uppercase tracking-widest text-xs px-1">{t('items')} — {t('edit_to_change')}</p>
            {existingOrder.OrderItems.map(item => (
              <div key={item.id} className="card-serious p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-text-main font-display truncate">{item.Product.name}</p>
                  <p className="text-primary font-black text-sm">{item.price_at_time} RWF × {item.quantity}</p>
                </div>
                <p className="font-black text-text-main font-display flex-shrink-0">{(item.price_at_time * item.quantity).toLocaleString()} RWF</p>
              </div>
            ))}

            <div className="card-serious p-4 flex justify-between items-center border-l-4 border-l-accent">
              <span className="font-black text-text-muted uppercase tracking-widest text-xs">{t('total')}</span>
              <span className="text-2xl font-black text-primary font-display">{parseFloat(existingOrder.total_price).toLocaleString()} RWF</span>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={18} /> {error}
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border-main p-4">
            <div className="max-w-lg mx-auto">
              <button
                onClick={() => {
                  // Load products then go to edit mode
                  fetchProducts();
                  setStep('edit_order');
                }}
                className="btn-accent w-full py-4"
              >
                {t('edit_order')} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'edit_order' && existingOrder && (
        <div className="min-h-screen bg-bg pb-40">
          <header className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
            <button onClick={() => setStep('existing_order')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-text-main font-display">{t('edit_order')}</h1>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-xs">{t('available_today')}</p>
            </div>
            <ThemeToggle />
          </header>

          <div className="px-4 pt-4 space-y-3 max-w-lg mx-auto">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={48} /></div>
            ) : products.map(p => (
              <div key={p.id} className="card-serious p-4 flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-border-main" alt={p.name} />
                ) : (
                  <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                    <ShoppingBag size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-text-main font-display truncate">{p.name}</p>
                  <p className="text-primary font-black text-sm">{p.price} RWF</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => removeFromCart(p.id)} className="w-9 h-9 rounded-xl bg-bg border border-border-main flex items-center justify-center text-text-muted active:scale-75 transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="w-7 text-center font-black text-lg text-text-main font-display">{cart[p.id] || 0}</span>
                  <button onClick={() => addToCart(p.id)} disabled={(cart[p.id] || 0) >= p.max_per_customer}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white active:scale-75 transition-all disabled:opacity-30">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(cart).length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-xl border-t border-border-main z-20">
              <div className="max-w-lg mx-auto flex gap-3">
                <button onClick={() => setCart({})} className="flex-shrink-0 px-4 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      const items = Object.entries(cart).map(([id, qty]) => ({ product_id: parseInt(id), quantity: qty }));
                      const res = await axios.put(`${API_URL}/orders/${existingOrder.id}/items`, { items });
                      setExistingOrder(res.data);
                      setStep('existing_order');
                    } catch (err) {
                      setError(err.response?.data?.error || 'Failed to update order');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 btn-primary py-4 disabled:opacity-30"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle size={22} /> {t('save_changes')}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'success' && orderResult && (
        <SuccessScreen
          orderResult={orderResult}
          t={t}
          onDone={() => {
            sessionStorage.clear();
            setStepRaw('login');
            setCustomerRaw({ name: '', phone: '' });
            setCartRaw({});
            setOrderResult(null);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
