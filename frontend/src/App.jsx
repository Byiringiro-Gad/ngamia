import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CustomerApp() {
  const { t, i18n } = useTranslation();

  const [step, setStepRaw] = useState(() => sessionStorage.getItem('ngamia_step') || 'lang');
  const [customer, setCustomerRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_customer')) || { name: '', phone: '' }; }
    catch { return { name: '', phone: '' }; }
  });
  const [products, setProducts] = useState([]);
  const [cart, setCartRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ngamia_cart')) || {}; }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [existingOrder, setExistingOrder] = useState(null);
  const [error, setError] = useState('');

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
      setLoading(true);
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
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

      const res = await axios.post(`${API_URL}/orders`, {
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
      const res = await axios.put(`${API_URL}/orders/${existingOrder.id}/items`, { items });
      setExistingOrder(res.data);
      setStep('existing_order');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ name: customer.name.trim() });
      const res = await axios.get(`${API_URL}/orders/check/${encodeURIComponent(customer.phone)}?${params.toString()}`);
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
      <Router>
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
