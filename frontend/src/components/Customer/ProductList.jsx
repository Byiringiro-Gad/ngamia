import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, ArrowRight, Tag } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { SkeletonProduct } from '../Skeletons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

function ProductList({ products, cart, addToCart, removeFromCart, loading, onBack, onConfirm, t }) {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
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
    <div className="min-h-screen bg-bg pb-40 transition-colors duration-500">
      <header className="p-8 bg-card border-b-4 border-border-main sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors bg-bg border border-border-main">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-black text-text-main font-display leading-tight">{t('products_title')}</h1>
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mt-1">{t('available_today')}</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Category Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                activeCategory === cat 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-bg text-text-muted border-border-main hover:border-primary/50'
              }`}
            >
              {cat === 'All' ? `✨ ${t('all_categories')}` : `${getCategoryIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </header>
      
      <div className="p-6 grid grid-cols-1 gap-6 max-w-2xl mx-auto">
        {loading ? (
          <>
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Tag size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
            <p className="font-black text-text-muted uppercase tracking-widest">{t('no_products_category')}</p>
          </div>
        ) : (
          filteredProducts.map(p => (
            <div key={p.id} className="card-serious flex items-center justify-between p-6 hover:scale-[1.02] transition-all border-l-[10px] border-l-primary gap-4">
              <div className="flex items-center gap-6">
                {p.image_url ? (
                  <img src={getFullImageUrl(p.image_url)} className="w-24 h-24 object-cover rounded-[1.5rem] border-4 border-white dark:border-slate-700 shadow-lg" alt="" />
                ) : (
                  <div className="w-24 h-24 bg-bg rounded-[1.5rem] flex items-center justify-center text-text-muted shadow-inner border-2 border-dashed border-border-main">
                    <ShoppingBag size={32} />
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-text-main font-display leading-tight">{p.name}</h3>
                    <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">{p.category}</span>
                  </div>
                  {p.description && (
                    <p className="text-text-muted text-xs font-medium line-clamp-1">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-primary tracking-tighter font-display">{parseFloat(p.price).toLocaleString()} RWF</span>
                    <span className="text-text-muted font-black uppercase tracking-widest text-[10px] opacity-50">{t('stock')}: {p.stock_quantity}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-bg p-2 rounded-2xl border-2 border-border-main shadow-inner">
                <button onClick={() => removeFromCart(p.id)} className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shadow-md text-text-muted active:scale-75 transition-all border border-border-main"><Minus size={20} /></button>
                <span className="text-xl font-black w-6 text-center text-text-main font-display">{cart[p.id] || 0}</span>
                <button onClick={() => addToCart(p.id)} disabled={(cart[p.id] || 0) >= p.max_per_customer} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg text-white active:scale-75 transition-all disabled:opacity-30"><Plus size={20} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-card/80 backdrop-blur-xl border-t-8 border-border-main z-40">
          <button onClick={onConfirm} className="btn-accent w-full max-w-2xl mx-auto shadow-accent/40 py-5 text-xl uppercase tracking-widest flex items-center justify-center gap-3">
            <ShoppingBag size={24} /> {t('confirm_order')} ({totalItems}) <ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
