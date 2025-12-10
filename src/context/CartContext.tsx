import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Product, CartItem } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Add item to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        toast({
          title: "Cart Updated",
          description: `${product.name} quantity increased to ${existing.quantity + quantity}`,
        });
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      });

      const newItem: CartItem = {
        productId: product.id,
        title: product.name,
        price: product.price,
        imageUrl: product.image,
        quantity,
      };

      return [...prev, newItem];
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.productId === productId);
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.title} has been removed`,
          variant: "destructive",
        });
      }
      return prev.filter(item => item.productId !== productId);
    });
  }, []);

  // Update quantity of an item
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  }, []);

  // Totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook for consuming the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
