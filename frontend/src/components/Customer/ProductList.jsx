import React from 'react';
import { ArrowLeft, Loader2, ShoppingBag, Minus, Plus, ArrowRight } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

function ProductList({ products, cart, addToCart, removeFromCart, loading, onBack, onConfirm, t }) {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-bg pb-40 transition-colors duration-500">
      <header className="p-10 bg-card border-b-4 border-border-main sticky top-0 flex justify-between items-center z-10 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
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
                <button onClick={() => addToCart(p.id)} disabled={(cart[p.id] || 0) >= p.max_per_customer} className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl text-white active:scale-75 transition-all disabled:opacity-30"><Plus size={28} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-10 bg-card/80 backdrop-blur-xl border-t-8 border-border-main z-20">
          <button onClick={onConfirm} className="btn-accent w-full max-w-2xl mx-auto shadow-accent/40 py-6 text-2xl uppercase tracking-widest">
            <ShoppingBag size={32} /> {t('confirm_order')} ({totalItems}) <ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
