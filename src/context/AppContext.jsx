import { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext(null);

const CURRENT_PRODUCT_PRICES = { eclipse: 139, spy: 139 };

const safeStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {
      // Ignora erro se storage for bloqueado pelas políticas do navegador
    }
  }
};

export function AppProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = safeStorage.getItem('bleachco_cart');
      const items = JSON.parse(raw || '[]');
      return items.map((item) => ({
        ...item,
        price: CURRENT_PRODUCT_PRICES[item.id] || item.price || 139
      }));
    } catch (e) {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [selectedShipping, setSelectedShipping] = useState(null); // { id, name, company, price, deliveryRange }

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    safeStorage.setItem('bleachco_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2800);
  };

  const addToCart = (product) => {
    // product: { id, name, price, size, svgThumb }
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id && item.size === product.size);
      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx].qty += 1;
        return nextCart;
      } else {
        return [...prev, { ...product, qty: 1 }];
      }
    });
    setCartOpen(true);
    showToast(`${product.name} — Tam. ${product.size} adicionado ✦`);
  };

  const updateQty = (id, size, delta) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === id && item.size === size);
      if (idx === -1) return prev;

      const nextCart = [...prev];
      nextCart[idx].qty += delta;

      if (nextCart[idx].qty <= 0) {
        nextCart.splice(idx, 1);
      }
      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setSelectedShipping(null);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        cartOpen,
        setCartOpen,
        toast,
        showToast,
        addToCart,
        updateQty,
        clearCart,
        selectedShipping,
        setSelectedShipping,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
