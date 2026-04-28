import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, Trash2, CheckCircle, Loader2, Tag } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { SkeletonProduct } from '../Skeletons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

function EditOrder({ products, cart, addToCart, removeFromCart, clearCart, onBack, onSave, loading, t }) {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', ...new Set(products.map(p => p.category))];
  
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

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="min-h-screen bg-bg pb-40">
      <header className="sticky top-0 z-30 bg-card border-b-4 border-border-main p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors bg-bg border border-border-main">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-text-main font-display uppercase">{t('edit_order')}</h1>
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">{t('available_today')}</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                activeCategory === cat 
                  ? 'bg-primary text-white border-primary shadow-lg' 
                  : 'bg-bg text-text-muted border-border-main'
              }`}
            >
              {cat === 'All' ? `✨ ${t('all_categories')}` : `${getCategoryIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 pt-6 space-y-4 max-w-lg mx-auto">
        {loading ? (
          <>
            <SkeletonProduct />
            <SkeletonProduct />
          </>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <Tag size={40} className="mx-auto mb-2" />
            <p className="text-xs font-black uppercase tracking-widest">{t('no_products_category')}</p>
          </div>
        ) : filteredProducts.map(p => (
          <div key={p.id} className="card-serious p-4 flex items-center gap-4">
            {p.image_url ? (
              <img src={getFullImageUrl(p.image_url)} className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-border-main shadow-sm" alt={p.name} />
            ) : (
              <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                <ShoppingBag size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-black text-text-main font-display truncate">{p.name}</p>
              <p className="text-primary font-black text-sm">{parseFloat(p.price).toLocaleString()} RWF</p>
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
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card/90 backdrop-blur-xl border-t border-border-main z-40 shadow-2xl">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={() => clearCart()} className="flex-shrink-0 px-5 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
              <Trash2 size={18} />
            </button>
            <button onClick={onSave} disabled={loading} className="flex-1 btn-primary py-4 disabled:opacity-30 shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle size={22} /> {t('save_changes')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditOrder;
