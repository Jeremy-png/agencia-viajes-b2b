import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null); // 1 habitación a la vez

  function addToCart(item) {
    setCart(item);
  }

  function clearCart() {
    setCart(null);
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
