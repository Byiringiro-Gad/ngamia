import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

function SuccessScreen({ orderResult, t, onDone }) {
  const [countdown, setCountdown] = useState(30);
  const [screenshotTaken, setScreenshotTaken] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) { onDone(); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const takeScreenshot = () => {
    setScreenshotTaken(true);
    window.print();
  };

  return (
    <>
      {/* Print styles — only the receipt shows when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary">
        <div id="receipt" className="card-serious w-full max-w-sm p-8 space-y-6 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto border-4 border-white dark:border-card shadow-xl">
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-text-main font-display uppercase">{t('order_success')}</h1>
            <p className="text-text-muted text-sm mt-1">{t('keep_screen')}</p>
          </div>

          {/* Queue number — big and clear */}
          <div className="bg-bg rounded-3xl p-6 border-4 border-border-main relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
            <p className="text-text-muted font-black uppercase tracking-widest text-xs mb-1">{t('queue_no')}</p>
            <p className="text-8xl font-black text-primary font-display leading-none">#{orderResult.queue_number}</p>
          </div>

          {/* Details */}
          <div className="flex justify-between text-left bg-bg rounded-2xl p-4 border border-border-main">
            <div>
              <p className="text-text-muted font-black uppercase tracking-widest text-xs">{t('pickup_time')}</p>
              <p className="text-xl font-black text-text-main font-display">
                {new Date(orderResult.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-text-muted font-black uppercase tracking-widest text-xs">{t('total')}</p>
              <p className="text-xl font-black text-text-main font-display">{parseFloat(orderResult.total_price).toLocaleString()} RWF</p>
            </div>
          </div>

          {/* Screenshot button */}
          <button
            onClick={takeScreenshot}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              screenshotTaken
                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                : 'bg-accent text-white shadow-lg'
            }`}
          >
            {screenshotTaken ? '✓ Screenshot saved' : '📸 Take Screenshot'}
          </button>

          {/* Done + countdown */}
          <button
            onClick={onDone}
            className="btn-primary w-full py-4"
          >
            {t('done')} ({countdown}s)
          </button>
        </div>
      </div>
    </>
  );
}

export default SuccessScreen;
