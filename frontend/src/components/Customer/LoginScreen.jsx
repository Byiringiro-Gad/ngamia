import React, { useState } from 'react';
import { User, Phone, ArrowLeft, ArrowRight, Loader2, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

// Rwandan phone: 10 digits, starts with 072 / 073 / 078 / 079
const RW_PHONE_RE = /^07[2389]\d{7}$/;

function validatePhone(value) {
  const digits = value.replace(/\s/g, '');
  if (!digits) return null;                          // empty — no message yet
  if (digits.length < 10) return 'short';           // still typing
  if (!RW_PHONE_RE.test(digits)) return 'invalid';  // wrong format
  return 'valid';
}

function PhoneHint({ status, t }) {
  if (!status) return null;
  if (status === 'short') return (
    <p className="text-xs font-bold text-text-muted flex items-center gap-1 mt-1">
      <Phone size={11} /> {t('phone_hint_short')}
    </p>
  );
  if (status === 'invalid') return (
    <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
      <XCircle size={11} /> {t('phone_hint_invalid')}
    </p>
  );
  return (
    <p className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1">
      <CheckCircle2 size={11} /> {t('phone_hint_valid')}
    </p>
  );
}

function LoginScreen({ customer, setCustomer, onBack, onStart, loading, t }) {
  const [touched, setTouched] = useState({ name: false, phone: false });

  const phoneStatus = validatePhone(customer.phone);
  const nameOk = customer.name.trim().length >= 2;
  const phoneOk = phoneStatus === 'valid';
  const canSubmit = nameOk && phoneOk && !loading;

  const handlePhoneChange = (e) => {
    // Only allow digits and strip everything else as they type
    const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
    setCustomer({ ...customer, phone: raw });
  };

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col justify-center">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <ThemeToggle />
      </div>

      <div className="card-serious p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main font-display">{t('login_title')}</h1>
          <p className="text-text-muted font-bold text-sm">{t('welcome')}</p>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-black text-text-muted flex items-center gap-2 uppercase tracking-widest">
              <User size={14} className="text-primary" /> {t('name')}
            </label>
            <input
              className={`input-serious transition-all ${
                touched.name && !nameOk
                  ? 'border-red-400 focus:border-red-500'
                  : touched.name && nameOk
                  ? 'border-green-400 focus:border-green-500'
                  : ''
              }`}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              onBlur={() => setTouched(p => ({ ...p, name: true }))}
              placeholder={t('name_placeholder')}
              autoComplete="name"
            />
            {touched.name && !nameOk && (
              <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                <XCircle size={11} /> {t('name_hint_short')}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-black text-text-muted flex items-center gap-2 uppercase tracking-widest">
              <Phone size={14} className="text-primary" /> {t('phone')}
            </label>
            <input
              className={`input-serious transition-all ${
                touched.phone && phoneStatus === 'invalid'
                  ? 'border-red-400 focus:border-red-500'
                  : phoneStatus === 'valid'
                  ? 'border-green-400 focus:border-green-500'
                  : ''
              }`}
              value={customer.phone}
              onChange={handlePhoneChange}
              onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              placeholder={t('phone_placeholder')}
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
            {/* Show hint as soon as they start typing phone */}
            {customer.phone.length > 0 && (
              <PhoneHint status={phoneStatus} t={t} />
            )}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            disabled={!canSubmit}
            onClick={onStart}
            className="btn-primary w-full disabled:opacity-30"
          >
            {loading
              ? <Loader2 className="animate-spin" size={22} />
              : <>{t('start_button')} <ArrowRight size={20} /></>
            }
          </button>
        </div>

        <div className="border-t-2 border-border-main pt-5 text-center">
          <Link
            to="/admin"
            className="text-text-muted flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs hover:text-primary transition-all"
          >
            <Lock size={12} /> {t('admin_portal')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
