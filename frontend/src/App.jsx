import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  Plus, 
  Minus, 
  Globe,
  Loader2,
  Lock,
  ShoppingBag,
  Sun,
  Moon
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import { ThemeProvider, useTheme } from './ThemeContext';

const API_URL = 'http://localhost:5000/api';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <button 
        onClick={toggleTheme}
        className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-90 transition-all cursor-pointer"
      >
        {isDark ? <Sun size={28} /> : <Moon size={28} />}
      </button>
    </div>
  );
};

function CustomerApp() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState('lang'); 
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');

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

  const addToCart = (id) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    if ((cart[id] || 0) >= p.max_per_customer) {
       alert(t('max_per_cust') + ': ' + p.max_per_customer);
       return;
    }
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
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-bg transition-colors duration-500">
      <ThemeToggle />
      
      {step === 'lang' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary text-white">
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
                disabled={!customer.name || !customer.phone}
                onClick={() => setStep('products')} 
                className="btn-primary w-full disabled:opacity-30 shadow-primary/40"
              >
                {t('start_button')} <ArrowRight />
              </button>
              <button onClick={() => setStep('lang')} className="text-text-muted w-full text-center font-bold underline hover:text-primary transition-colors">{t('back')}</button>
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
            <div>
              <h1 className="text-4xl font-black text-text-main font-display leading-tight">{t('products_title')}</h1>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-xs mt-1">{t('available_today')}</p>
            </div>
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
        <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center">
          <div className="card-serious p-12 space-y-10 border-t-[16px] border-t-accent">
            <h1 className="text-4xl font-black text-text-main text-center font-display uppercase tracking-tight">{t('confirm_order')}</h1>
            
            <div className="space-y-6 border-y-4 border-border-main py-8">
              {products.filter(p => cart[p.id]).map(p => (
                <div key={p.id} className="flex justify-between items-center text-2xl">
                  <span className="font-bold text-text-muted">{cart[p.id]}x <span className="text-text-main font-black">{p.name}</span></span>
                  <span className="font-black text-text-main font-display">{p.price * cart[p.id]} RWF</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
               <span className="text-text-muted font-black uppercase tracking-[0.2em] text-sm">{t('total')}</span>
               <span className="text-5xl font-black text-primary tracking-tighter font-display">
                  {products.filter(p => cart[p.id]).reduce((acc, p) => acc + (p.price * cart[p.id]), 0)} RWF
               </span>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-[2rem] font-black text-center border-4 border-red-100 dark:border-red-900/30 uppercase tracking-widest text-xs">{error}</div>}
            
            <div className="space-y-4 pt-4">
              <button onClick={handleOrder} disabled={loading} className="btn-primary w-full shadow-primary/40">
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={32} /> {t('confirm_order')}</>}
              </button>
              <button onClick={() => setStep('products')} className="text-text-muted w-full text-center font-black uppercase tracking-widest text-xs hover:text-primary transition-colors">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && orderResult && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-primary text-white">
          <div className="card-serious w-full max-w-sm p-12 space-y-10 animate-in zoom-in duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 border-8 border-white dark:border-slate-800 shadow-2xl">
              <CheckCircle size={80} className="text-green-600" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-text-main font-display uppercase tracking-tight">{t('order_success')}</h1>
              <p className="text-text-muted font-bold italic text-sm">{t('keep_screen')}</p>
            </div>
            
            <div className="space-y-8">
              <div className="bg-bg p-8 rounded-[3rem] border-4 border-border-main shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-accent opacity-50"></div>
                <p className="text-text-muted font-black uppercase tracking-[0.3em] text-[10px] mb-2">{t('queue_no')}</p>
                <p className="text-[7rem] font-black text-primary tracking-tighter leading-none font-display">#{orderResult.queue_number}</p>
              </div>
              <div className="flex justify-between items-center px-4">
                <div className="text-left space-y-1">
                  <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">{t('pickup_time')}</p>
                  <p className="text-2xl font-black text-text-main font-display">{new Date(orderResult.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">{t('total')}</p>
                  <p className="text-2xl font-black text-text-main font-display">{orderResult.total_price} RWF</p>
                </div>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="btn-primary w-full shadow-primary/60 py-6 uppercase tracking-[0.2em] font-black">
              {t('done')}
            </button>
          </div>
        </div>
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
