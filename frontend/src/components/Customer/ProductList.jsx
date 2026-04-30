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
      case 'Amabaro':   return '👔';
      case 'Ibiribwa':  return '🍲';
      case 'Ibinyobwa': return '🥤';
      case 'Electronic':return '🔌';
      case 'General':   return '📦';
      default:          return '🏷️';
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
    <div className="min-h-screen bg-bg pb-36 transition-colors duration-500">

      {/* ── Sticky header ── */}
      <header className="px-4 pt-4 pb-3 bg-card border-b-2 border-border-main sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors bg-bg border border-border-main flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center flex-1 px-2">
            <h1 className="text-lg font-black text-text-main font-display leading-tight">{t('products_title')}</h1>
            <p className="text-primary font-black uppercase tracking-widest text-[9px] mt-0.5">{t('available_today')}</p>
          </div>

          <ThemeToggle />
        </div>

        {/* Category pills — horizontal scroll, no overflow on page */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-2 ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-bg text-text-muted border-border-main'
              }`}
            >
              {cat === 'All' ? `✨ ${t('all_categories')}` : `${getCategoryIcon(cat)} ${cat}`}
            </button>
          ))}
        </div>
      </header>

      {/* ── Product list ── */}
      <div className="px-3 py-3 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          <>
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Tag size={40} className="mx-auto mb-3 text-text-muted opacity-20" />
            <p className="font-black text-text-muted uppercase tracking-widest text-sm">{t('no_products_category')}</p>
          </div>
        ) : (
          filteredProducts.map(p => {
            const qty = cart[p.id] || 0;
            const atMax = qty >= p.max_per_customer;

            return (
              <div
                key={p.id}
                className="card-serious border-l-4 border-l-primary overflow-hidden"
              >
                {/* ── Top row: image + info + controls ── */}
                <div className="flex items-center gap-3 p-3">

                  {/* Image */}
                  {p.image_url ? (
                    <img
                      src={getFullImageUrl(p.image_url)}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl flex-shrink-0 border-2 border-border-main shadow"
                      alt={p.name}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bg rounded-2xl flex items-center justify-center text-text-muted flex-shrink-0 border-2 border-dashed border-border-main">
                      <ShoppingBag size={24} />
                    </div>
                  )}

                  {/* Info — takes remaining space, truncates if needed */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-text-main font-display text-base leading-tight truncate">
                        {p.name}
                      </h3>
                      <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase flex-shrink-0">
                        {p.category}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-text-muted text-xs line-clamp-1">{p.description}</p>
                    )}
                    <p className="text-primary font-black font-display text-base leading-none">
                      {parseFloat(p.price).toLocaleString()} <span className="text-xs font-bold text-text-muted">RWF</span>
                    </p>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      {t('stock')}: {p.stock_quantity}
                    </p>
                  </div>

                  {/* Quantity controls — always visible, never pushed off screen */}
                  <div className="flex items-center gap-2 flex-shrink-0 bg-bg rounded-2xl border-2 border-border-main p-1.5">
                    <button
                      onClick={() => removeFromCart(p.id)}
                      disabled={qty === 0}
                      className="w-9 h-9 bg-card rounded-xl flex items-center justify-center text-text-muted active:scale-75 transition-all border border-border-main disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-base font-black w-5 text-center text-text-main font-display">
                      {qty}
                    </span>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={atMax}
                      className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white active:scale-75 transition-all disabled:opacity-30 shadow"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Max reached hint */}
                {atMax && (
                  <div className="px-3 pb-2">
                    <p className="text-[10px] font-black text-accent uppercase tracking-wider text-right">
                      Max {p.max_per_customer} per customer
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Sticky confirm bar ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-card/90 backdrop-blur-xl border-t-2 border-border-main z-40">
          <button
            onClick={onConfirm}
            className="btn-accent w-full max-w-2xl mx-auto py-4 text-base uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <ShoppingBag size={20} />
            {t('confirm_order')} ({totalItems})
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
