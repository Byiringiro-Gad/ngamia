import React from 'react';
import { User, Phone, ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

function LoginScreen({ customer, setCustomer, onBack, onStart, loading, t }) {
  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors">
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
            onClick={onStart}
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
  );
}

export default LoginScreen;
