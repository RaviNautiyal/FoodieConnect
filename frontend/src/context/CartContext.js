// frontend/src/context/CartContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [restaurantId, setRestaurantId] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('CartContext: Loading cart from localStorage...');
    const savedCart = localStorage.getItem('foodCart');
    console.log('CartContext: savedCart from localStorage:', savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('CartContext: parsedCart:', parsedCart);
        setCart(parsedCart.items || []);
        setRestaurantId(parsedCart.restaurantId || null);
        console.log('CartContext: Cart loaded, items count:', parsedCart.items?.length || 0);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    } else {
      console.log('CartContext: No saved cart found in localStorage');
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('foodCart', JSON.stringify({
      items: cart,
      restaurantId: restaurantId,
      timestamp: Date.now()
    }));
  }, [cart, restaurantId]);

  // Calculate cart total whenever cart changes
  useEffect(() => {
    const total = cart.reduce((sum, item) => {
      let addonsPrice = 0;
      if (item.customizations?.addons && Array.isArray(item.customizations.addons)) {
        addonsPrice = item.customizations.addons.reduce((cSum, c) => cSum + (c.price || 0), 0);
      }
      const itemTotal = (item.price + addonsPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);
    setCartTotal(total);
  }, [cart]);

  // Add item to cart with customization support
  const addToCart = useCallback((item, customizations = {}, specialInstructions = '') => {
    console.log('Adding item to cart:', item);
    console.log('Item restaurantId:', item.restaurantId);
    console.log('Current cart restaurantId:', restaurantId);
    
    // Ensure customizations has the correct structure
    const normalizedCustomizations = {
      options: customizations.options || {},
      addons: Array.isArray(customizations.addons) ? customizations.addons : []
    };

    setCart((prevCart) => {
      // Check if we're adding from a different restaurant
      if (restaurantId && restaurantId !== item.restaurantId) {
        console.log('Different restaurant detected, clearing cart');
        // Clear cart and set new restaurant
        setRestaurantId(item.restaurantId);
        return [{
          ...item,
          quantity: 1,
          customizations: normalizedCustomizations,
          specialInstructions,
          addedAt: Date.now()
        }];
      }

      // Set restaurant ID if not set
      if (!restaurantId) {
        console.log('Setting restaurant ID:', item.restaurantId);
        setRestaurantId(item.restaurantId);
      }

      const existingItem = prevCart.find((cartItem) => 
        cartItem._id === item._id && 
        JSON.stringify(cartItem.customizations) === JSON.stringify(normalizedCustomizations) &&
        cartItem.specialInstructions === specialInstructions
      );

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id && 
          JSON.stringify(cartItem.customizations) === JSON.stringify(normalizedCustomizations) &&
          cartItem.specialInstructions === specialInstructions
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          ...item,
          quantity: 1,
          customizations: normalizedCustomizations,
          specialInstructions,
          addedAt: Date.now()
        }];
      }
    });
  }, [restaurantId]);

  // Update item quantity
  const updateQuantity = useCallback((itemId, newQuantity, customizations = null, specialInstructions = null) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      setCart((prevCart) => prevCart.filter((item) => {
        if (item._id === itemId) {
          if (customizations !== null && specialInstructions !== null) {
            // Remove specific item with customizations
            const normalizedCustomizations = {
              options: customizations.options || {},
              addons: Array.isArray(customizations.addons) ? customizations.addons : []
            };
            return !(JSON.stringify(item.customizations) === JSON.stringify(normalizedCustomizations) &&
                     item.specialInstructions === specialInstructions);
          } else {
            // Remove item without customizations
            return !(!item.customizations && !item.specialInstructions);
          }
        }
        return true;
      }));
      return;
    }

    setCart((prevCart) => prevCart.map((item) => {
      if (item._id === itemId) {
        if (customizations !== null && specialInstructions !== null) {
          // Normalize customizations for comparison
          const normalizedCustomizations = {
            options: customizations.options || {},
            addons: Array.isArray(customizations.addons) ? customizations.addons : []
          };
          
          // Update specific item with customizations
          if (JSON.stringify(item.customizations) === JSON.stringify(normalizedCustomizations) &&
              item.specialInstructions === specialInstructions) {
            return { ...item, quantity: newQuantity };
          }
        } else {
          // Update item without customizations
          if (!item.customizations && !item.specialInstructions) {
            return { ...item, quantity: newQuantity };
          }
        }
      }
      return item;
    }));
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId, customizations = null, specialInstructions = null) => {
    setCart((prevCart) => prevCart.filter((item) => {
      if (item._id === itemId) {
        if (customizations !== null && specialInstructions !== null) {
          // Normalize customizations for comparison
          const normalizedCustomizations = {
            options: customizations.options || {},
            addons: Array.isArray(customizations.addons) ? customizations.addons : []
          };
          
          // Remove specific item with customizations
          return !(JSON.stringify(item.customizations) === JSON.stringify(normalizedCustomizations) &&
                   item.specialInstructions === specialInstructions);
        } else {
          // Remove item without customizations
          return !(!item.customizations && !item.specialInstructions);
        }
      }
      return true;
    }));
  }, []);

  // Clear cart completely
  const clearCart = useCallback(() => {
    setCart([]);
    setRestaurantId(null);
    setDeliveryFee(0);
    localStorage.removeItem('foodCart');
  }, []);

  // Get cart item count
  const getCartItemCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Get cart subtotal (before delivery fee)
  const getCartSubtotal = useCallback(() => {
    return cartTotal;
  }, [cartTotal]);

  // Get final total (including delivery fee)
  const getCartFinalTotal = useCallback(() => {
    return cartTotal + deliveryFee;
  }, [cartTotal, deliveryFee]);

  // Check if cart is empty
  const isCartEmpty = useCallback(() => {
    return cart.length === 0;
  }, [cart]);

  // Get unique items count (different customizations count as different items)
  const getUniqueItemCount = useCallback(() => {
    return cart.length;
  }, [cart]);

  // Update delivery fee
  const updateDeliveryFee = useCallback((fee) => {
    setDeliveryFee(fee);
  }, []);

  // Get restaurant ID from cart
  const getRestaurantId = useCallback(() => {
    console.log('Getting restaurant ID from cart:', restaurantId);
    return restaurantId;
  }, [restaurantId]);

  // Check if item is in cart
  const isItemInCart = useCallback((itemId, customizations = {}, specialInstructions = '') => {
    const normalizedCustomizations = {
      options: customizations.options || {},
      addons: Array.isArray(customizations.addons) ? customizations.addons : []
    };
    
    return cart.some((item) => 
      item._id === itemId && 
      JSON.stringify(item.customizations) === JSON.stringify(normalizedCustomizations) &&
      item.specialInstructions === specialInstructions
    );
  }, [cart]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((itemId, customizations = {}, specialInstructions = '') => {
    const normalizedCustomizations = {
      options: customizations.options || {},
      addons: Array.isArray(customizations.addons) ? customizations.addons : []
    };
    
    const item = cart.find((item) => 
      item._id === itemId && 
      JSON.stringify(item.customizations) === JSON.stringify(normalizedCustomizations) &&
      item.specialInstructions === specialInstructions
    );
    return item ? item.quantity : 0;
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      cartTotal,
      deliveryFee,
      restaurantId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartItemCount,
      getCartSubtotal,
      getCartFinalTotal,
      isCartEmpty,
      getUniqueItemCount,
      updateDeliveryFee,
      getRestaurantId,
      isItemInCart,
      getItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};