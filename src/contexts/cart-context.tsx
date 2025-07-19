
'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode, useEffect } from 'react';
import type { Post as Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  lastViewedProductId: string | null;
  setLastViewedProductId: (productId: string | null) => void;
  purchasedProductIds: string[];
  addPurchasedProducts: (productIds: string[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [lastViewedProductId, setLastViewedProductId] = useState<string | null>(null);
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  
   useEffect(() => {
    try {
        const storedPurchased = window.localStorage.getItem('purchasedProductIds');
        if (storedPurchased) {
          setPurchasedProductIds(JSON.parse(storedPurchased));
        }
    } catch (error) {
        console.error("Failed to parse purchasedProductIds from localStorage", error);
    }
  }, []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({
        variant: 'destructive',
        title: 'Item removed',
        description: 'The item has been removed from your cart.',
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);
  
  const addPurchasedProducts = useCallback((productIds: string[]) => {
    setPurchasedProductIds(prevIds => {
        const newIds = Array.from(new Set([...prevIds, ...productIds]));
        try {
            window.localStorage.setItem('purchasedProductIds', JSON.stringify(newIds));
        } catch (error) {
            console.error("Failed to save purchasedProductIds to localStorage", error);
        }
        return newIds;
    });
  }, []);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);
  
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      // Extract the price from the content string, assuming it's the number at the end
      const priceMatch = item.product.content.match(/(\d+(\.\d+)?)$/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    lastViewedProductId,
    setLastViewedProductId,
    purchasedProductIds,
    addPurchasedProducts,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
