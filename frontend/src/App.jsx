import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import api, { API_URL } from './api';
import AdminDashboard from './AdminDashboard';
import { ThemeProvider } from './ThemeContext';

// Components
import LanguageSelection from './components/Customer/LanguageSelection';
import LoginScreen from './components/Customer/LoginScreen';
import ProductList from './components/Customer/ProductList';
import OrderConfirmation from './components/Customer/OrderConfirmation';
import ActiveOrder from './components/Customer/ActiveOrder';
import EditOrder from './components/Customer/EditOrder';
import SuccessScreen from './components/SuccessScreen';

// Error boundary — catches render crashes and shows a message instead of blank page
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <pre style={{ color: 'red', fontSize: 12, textAlign: 'left', background: '#fee', padding: 16, borderRadius: 8 }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 24px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Closed screen shown to customers when admin has closed the platform ─────────
function ClosedScreen({ message, t }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="card-serious p-10 max-w-sm w-full space-y-6">
        <div className="text-6xl">🔒</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text-main font-display">{t('platform_closed')}</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            {message || t('platform_closed_msg')}
          </p>
        </div>
      </div>
    </div>
  );
}

function CustomerApp() {
  const { t, i18n } = useTranslation();

  const [step, setStepRaw] = useState(() => sessionStorage.getItem('ngamia_step') || 'lang');
  const [customer, setCustomerRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_customer')) || { name: '', phone: '' }; }
    catch { return { name: '', phone: '' }; }
  });
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_products_cache')) || []; }
    catch { return []; }
  });
  const [cart, setCartRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_cart')) || {}; }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [error, setError] = useState('');

  // Platform open/close state
  const [platformOpen, setPlatformOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');
  const [statusChecked, setStatusChecked] = useState(false);

  // Check platform status once on mount, then every 30s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/settings/status');
        setPlatformOpen(res.data.is_open);
        setClosedMessage(res.data.closed_message || '');
      } catch {
        setPlatformOpen(true); // fail open — don't block customers on network error
      } finally {
        setStatusChecked(true);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setStep = (s) => { sessionStorage.setItem('ngamia_step', s); setStepRaw(s); };
  const setCustomer = (c) => { sessionStorage.setItem('ngamia_customer', JSON.stringify(c)); setCustomerRaw(c); };
  const setCart = (fn) => {
    setCartRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      sessionStorage.setItem('ngamia_cart', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (step === 'products' || step === 'edit_order') {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    try {
      if (products.length === 0) setLoading(true);
      const res = await api.get(`/products`);
      setProducts(res.data);
      sessionStorage.setItem('ngamia_products_cache', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExistingOrder = (order) => {
    setExistingOrder(order);
    const savedCart = {};
    order.OrderItems.forEach((item) => {
      savedCart[item.product_id] = item.quantity;
    });
    setCart(savedCart);
    setError('');
    setStep('existing_order');
  };

  const addToCart = (id) => {
    const p = products.find(prod => prod.id === id);
    if (!p || (cart[id] || 0) >= p.max_per_customer) return;
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    if (!cart[id]) return;
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] === 1) delete updated[id];
      else updated[id] -= 1;
      return updated;
    });
  };

  const clearCart = (id) => {
    if (id) {
      setCart(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } else {
      setCart({});
    }
  };

  const handleOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const items = Object.entries(cart).map(([id, qty]) => ({
        product_id: parseInt(id),
        quantity: qty
      }));

      const res = await api.post(`/orders`, {
        customer_name: customer.name,
        customer_phone: customer.phone,
        items,
        language: i18n.language
      });
      setOrderResult(res.data);
      sessionStorage.removeItem('ngamia_step');
      sessionStorage.removeItem('ngamia_cart');
      sessionStorage.removeItem('ngamia_customer');
      setStep('success');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existingOrder) {
        openExistingOrder(err.response.data.existingOrder);
        return;
      }
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const items = Object.entries(cart).map(([id, qty]) => ({
        product_id: parseInt(id),
        quantity: qty
      }));
      const res = await api.put(`/orders/${existingOrder.id}/items`, { items });
      setExistingOrder(res.data);
      setStep('existing_order');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      setError('');
      await api.delete(`/orders/${existingOrder.id}/cancel`);
      setExistingOrder(null);
      setCart({});
      sessionStorage.removeItem('ngamia_cart');
      setStep('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ name: customer.name.trim() });
      const res = await api.get(`/orders/check/${encodeURIComponent(customer.phone)}?${params.toString()}`);
      if (res.data) {
        openExistingOrder(res.data);
      } else {
        setStep('products');
      }
    } catch {
      setStep('products');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until we know the platform status (avoids flash)
  if (!statusChecked) return null;

  // Platform closed — show closed screen to customers
  if (!platformOpen) return <ClosedScreen message={closedMessage} t={t} />;

  switch (step) {
    case 'lang':
      return <LanguageSelection t={t} i18n={i18n} onSelect={() => setStep('login')} />;
    
    case 'login':
      return (
        <LoginScreen 
          customer={customer} 
          setCustomer={setCustomer} 
          onBack={() => setStep('lang')} 
          onStart={checkExistingOrder}
          loading={loading}
          t={t}
        />
      );

    case 'products':
      return (
        <ProductList 
          products={products}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          loading={loading}
          onBack={() => setStep('login')}
          onConfirm={() => setStep('confirm')}
          t={t}
        />
      );

    case 'confirm':
      return (
        <OrderConfirmation 
          products={products}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          onBack={() => setStep('products')}
          onOrder={handleOrder}
          loading={loading}
          error={error}
          t={t}
        />
      );

    case 'existing_order':
      return (
        <ActiveOrder 
          order={existingOrder}
          onBack={() => setStep('login')}
          onEdit={() => setStep('edit_order')}
          onCancel={handleCancelOrder}
          error={error}
          t={t}
        />
      );

    case 'edit_order':
      return (
        <EditOrder 
          products={products}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          onBack={() => setStep('existing_order')}
          onSave={handleUpdateOrder}
          loading={loading}
          t={t}
        />
      );

    case 'success':
      return (
        <SuccessScreen 
          orderResult={orderResult}
          t={t}
          onDone={() => {
            sessionStorage.clear();
            setStepRaw('login');
            setCustomerRaw({ name: '', phone: '' });
            setCartRaw({});
            setOrderResult(null);
          }}
        />
      );

    default:
      return null;
  }
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<CustomerApp />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
