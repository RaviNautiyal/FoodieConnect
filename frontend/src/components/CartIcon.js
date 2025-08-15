import React from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const CartIcon = ({ onClick, className = '', showCount = true, size = 'md' }) => {
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  const countSizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
    xl: 'h-7 w-7 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-700 hover:text-gray-900 transition-colors ${className}`}
      title="View Cart"
    >
      <FiShoppingCart className={sizeClasses[size]} />
      
      {showCount && cartCount > 0 && (
        <span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ${countSizeClasses[size]}`}>
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;


