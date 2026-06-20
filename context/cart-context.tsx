'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CartItem = {
  key: string;
  slug: string;
  name: string;
  price: number; // in cents
  image: string;
  color: string; // color name
  size: string; // size code (e.g. M, L)
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number; // in cents
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Deterministically generates a unique key for a product variant line item.
 */
export function getCartItemKey(slug: string, color: string, size: string): string {
  return `${slug}_${color.toLowerCase().replace(/\s+/g, '-')}_${size.toLowerCase()}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('staple_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[Staple] Error reading cart from localStorage:', error);
      // Fallback: clear bad storage
      localStorage.removeItem('staple_cart');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Sync to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('staple_cart', JSON.stringify(items));
      } catch (error) {
        console.error('[Staple] Error writing cart to localStorage:', error);
      }
    }
  }, [items, isHydrated]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (newItem: Omit<CartItem, 'key' | 'quantity'>, quantity = 1) => {
    const key = getCartItemKey(newItem.slug, newItem.color, newItem.size);

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === key);

      if (existingIndex > -1) {
        // Increment quantity of existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { ...newItem, key, quantity }];
      }
    });

    // Default behavior: Auto-open the cart drawer when an item is added
    openCart();
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.key !== key);
      }
      return prev.map((item) => (item.key === key ? { ...item, quantity } : item));
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  // Computations
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isHydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        subtotal,
        cartCount,
      }}
    >
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
