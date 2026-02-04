import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService } from '@/services/cartService';
import type { Cart, CartItem, Product, ProductVariant } from '@/types/shop';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant: ProductVariant, qtyCans?: number) => Promise<void>;
  updateQuantity: (itemId: string, qtyCans: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const emptyCart: Cart = { items: [], subtotalCents: 0, totalCans: 0, subtotal: 0, itemCount: 0 };

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshCart = async () => {
    try {
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  useEffect(() => {
    const loadCart = async () => {
      try {
        const loadedCart = await cartService.getCart();
        setCart(loadedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  const addToCart = async (product: Product, variant: ProductVariant, qtyCans: number = 1) => {
    try {
      const updatedCart = await cartService.addItem(product, variant, qtyCans);
      setCart(updatedCart);
      toast.success(`Added ${product.name} (${variant.strengthMg}mg) to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const updateQuantity = async (itemId: string, qtyCans: number) => {
    try {
      const updatedCart = await cartService.updateQuantity(itemId, qtyCans);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const updatedCart = await cartService.removeItem(itemId);
      setCart(updatedCart);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const empty = await cartService.clearCart();
      setCart(empty);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
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
