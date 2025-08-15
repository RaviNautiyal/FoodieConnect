import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTrash2, FiEdit3 } from 'react-icons/fi';

const ShoppingCart = ({ isOpen, onClose, onProceedToCheckout }) => {
  const {
    cart,
    cartTotal,
    deliveryFee,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartFinalTotal,
    isCartEmpty
  } = useCart();

  const [isEditing, setIsEditing] = useState(false);

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const handleQuantityChange = (item, newQuantity) => {
    updateQuantity(
      item._id,
      newQuantity,
      item.customizations || null,
      item.specialInstructions || null
    );
  };

  const handleRemoveItem = (item) => {
    removeFromCart(
      item._id,
      item.customizations || null,
      item.specialInstructions || null
    );
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const getItemDisplayName = (item) => {
    let name = item.name;
    if (item.customizations?.addons?.length > 0) {
      const addonNames = item.customizations.addons.map(addon => addon.name).join(', ');
      name += ` (+${addonNames})`;
    }
    return name;
  };

  const getItemPrice = (item) => {
    let basePrice = item.price || 0;
    if (item.customizations?.addons && Array.isArray(item.customizations.addons)) {
      const addonsPrice = item.customizations.addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
      basePrice += addonsPrice;
    }
    return basePrice * item.quantity;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FiShoppingCart className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Cart</h2>
            {!isCartEmpty() && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {getCartItemCount()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCartEmpty() ? (
            <div className="text-center py-12">
              <FiShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item._id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{getItemDisplayName(item)}</h4>
                      {item.specialInstructions && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Note:</span> {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      title="Remove item"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Item Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiMinus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                      >
                        <FiPlus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatPrice(getItemPrice(item))}
                    </span>
                  </div>

                  {/* Customizations Summary */}
                  {item.customizations && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {item.customizations.options && Object.keys(item.customizations.options).length > 0 && (
                          <div className="mb-1">
                            <span className="font-medium">Options:</span> {Object.values(item.customizations.options).join(', ')}
                          </div>
                        )}
                        {item.customizations.addons && item.customizations.addons.length > 0 && (
                          <div>
                            <span className="font-medium">Add-ons:</span> {item.customizations.addons.map(addon => addon.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Order Summary */}
        {!isCartEmpty() && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatPrice(cartTotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-lg text-gray-900">{formatPrice(getCartFinalTotal())}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClearCart}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={onProceedToCheckout}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
