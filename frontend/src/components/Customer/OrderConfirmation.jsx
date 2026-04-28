import React from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, X, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

function OrderConfirmation({ products, cart, addToCart, removeFromCart, clearCart, onBack, onOrder, loading, error, t }) {
  const cartItems = products.filter(p => cart[p.id]);
  const totalPrice = cartItems.reduce((acc, p) => acc + (p.price * cart[p.id]), 0);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-text-main font-display">{t('confirm_order')}</h1>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">{t('review_your_order')}</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-3 pb-40">
        {cartItems.map(p => (
          <div key={p.id} className="card-serious p-4 flex items-center gap-4">
            {p.image_url ? (
              <img src={getFullImageUrl(p.image_url)} className="w-14 h-14 object-cover rounded-2xl flex-shrink-0 border border-border-main" alt={p.name} />
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => removeFromCart(p.id)} className="w-9 h-9 rounded-xl bg-bg border border-border-main flex items-center justify-center text-text-muted active:scale-75 transition-all">
                <Minus size={16} />
              </button>
              <span className="w-7 text-center font-black text-lg text-text-main font-display">{cart[p.id]}</span>
              <button onClick={() => addToCart(p.id)} disabled={(cart[p.id] || 0) >= p.max_per_customer} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white active:scale-75 transition-all disabled:opacity-30">
                <Plus size={16} />
              </button>
              <button onClick={() => clearCart(p.id)} className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 active:scale-75 transition-all ml-1">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        {cartItems.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm uppercase tracking-widest">{t('cart_empty')}</p>
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="card-serious p-4 flex justify-between items-center border-l-4 border-l-accent">
            <span className="font-black text-text-muted uppercase tracking-widest text-xs">{t('total')}</span>
            <span className="text-3xl font-black text-primary font-display">{totalPrice.toLocaleString()} RWF</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border-main p-4 space-y-2">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={() => clearCart()} className="flex-shrink-0 px-4 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
            <Trash2 size={18} /> {t('clear_all')}
          </button>
          <button onClick={onOrder} disabled={loading || cartItems.length === 0} className="flex-1 btn-primary py-4 disabled:opacity-30">
            {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle size={22} /> {t('send_order')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
