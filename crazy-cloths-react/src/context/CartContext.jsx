import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Rehydrate from localStorage on mount
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart items from localStorage:', e);
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage on every items change
  useEffect(() => {
    try {
      localStorage.setItem('cc_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart items to localStorage:', e);
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  // Add item: if exact variant (id, color, size) exists, increment quantity
  const addItem = (item) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.id === item.id && i.color === item.color && i.size === item.size
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += item.quantity || 1;
        return updated;
      }

      return [...prevItems, { ...item, quantity: item.quantity || 1 }];
    });
  };

  // Remove item by matching id, color, and size
  const removeItem = (id, color, size) => {
    setItems((prevItems) => 
      prevItems.filter((i) => !(i.id === id && i.color === color && i.size === size))
    );
  };

  // Update item quantity; if quantity <= 0, remove item
  const updateQuantity = (id, color, size, quantity) => {
    if (quantity <= 0) {
      removeItem(id, color, size);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === id && i.color === color && i.size === size
          ? { ...i, quantity }
          : i
      )
    );
  };

  // Clear all items in the cart
  const clearCart = () => {
    setItems([]);
  };

  // Computed values
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    count,
    isOpen,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
