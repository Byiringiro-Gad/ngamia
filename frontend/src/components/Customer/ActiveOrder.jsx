import React from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, X } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

function ActiveOrder({ order, onBack, onEdit, onCancel, error, t }) {
  const handleCancel = () => {
    if (window.confirm(t('confirm_cancel_order') || 'Are you sure you want to cancel this order?')) {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-card border-b border-border-main px-5 py-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-text-main font-display">{t('your_order')}</h1>
          <p className="text-accent text-xs font-black uppercase tracking-widest">{t('order_active')}</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4 pb-40">
        <div className="card-serious p-6 text-center border-t-4 border-t-accent">
          <p className="text-text-muted font-black uppercase tracking-widest text-xs mb-1">{t('queue_no')}</p>
          <p className="text-7xl font-black text-primary font-display leading-none">#{order.queue_number}</p>
          <p className="text-text-muted text-sm mt-2">{t('pickup_time')}: <span className="font-black text-text-main">{new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>

        <p className="font-black text-text-muted uppercase tracking-widest text-xs px-1">{t('items')} — {t('edit_to_change')}</p>
        {order.OrderItems.map(item => (
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
          <span className="text-2xl font-black text-primary font-display">{parseFloat(order.total_price).toLocaleString()} RWF</span>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} /> {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border-main p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {order.status === 'pending' && (
            <button onClick={handleCancel} className="flex-shrink-0 w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-800 active:scale-95 transition-all">
              <X size={22} />
            </button>
          )}
          <button onClick={onEdit} className="btn-accent flex-1 py-4">
            {t('edit_order')} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveOrder;
