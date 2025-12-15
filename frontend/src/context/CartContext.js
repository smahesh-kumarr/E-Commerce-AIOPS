import React, { createContext, useState, useEffect } from 'react';
import { cartAPI } from '../utils/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const response = await cartAPI.addToCart({ productId, quantity });
      setCart(response.data.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add to cart';
      setError(message);
      throw message;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      const response = await cartAPI.removeFromCart(productId);
      setCart(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from cart');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      setLoading(true);
      const response = await cartAPI.updateCartItem(productId, { quantity });
      setCart(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update cart');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartAPI.clearCart();
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartCount: cart?.totalItems || 0
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
