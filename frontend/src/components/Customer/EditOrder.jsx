import React from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

function EditOrder({ products, cart, addToCart, removeFromCart, clearCart, onBack, onSave, loading, t }) {
  return (
    <div className="min-h-screen bg-bg pb-40">
      <header className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
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
              <button onClick={() => addToCart(p.id)} disabled={(cart[p.id] || 0) >= p.max_per_customer} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white active:scale-75 transition-all disabled:opacity-30">
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-xl border-t border-border-main z-20">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={() => clearCart()} className="flex-shrink-0 px-4 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
              <Trash2 size={18} />
            </button>
            <button onClick={onSave} disabled={loading} className="flex-1 btn-primary py-4 disabled:opacity-30">
              {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle size={22} /> {t('save_changes')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditOrder;
