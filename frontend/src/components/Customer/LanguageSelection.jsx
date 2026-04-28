import React from 'react';
import ThemeToggle from '../ThemeToggle';

function LanguageSelection({ t, i18n, onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary text-white">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-4 mb-12">
        <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center mx-auto text-4xl font-black shadow-2xl text-indigo-950">N</div>
        <h1 className="text-5xl font-black tracking-tighter font-display uppercase">Ngamia</h1>
        <p className="text-white/70 font-bold uppercase tracking-widest text-sm">{t('select_lang')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <button onClick={() => { i18n.changeLanguage('en'); onSelect(); }} className="btn-secondary border-none py-6">English</button>
        <button onClick={() => { i18n.changeLanguage('rw'); onSelect(); }} className="btn-secondary border-none py-6">Kinyarwanda</button>
        <button onClick={() => { i18n.changeLanguage('fr'); onSelect(); }} className="btn-secondary border-none py-6">Français</button>
      </div>
    </div>
  );
}

export default LanguageSelection;
