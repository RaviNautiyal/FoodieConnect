import React, { useState, useEffect } from 'react';
import { FiPlus, FiMinus, FiX, FiEdit3 } from 'react-icons/fi';

const FoodItemCustomization = ({ 
  item, 
  isOpen, 
  onClose, 
  onAddToCart, 
  currentQuantity = 0 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [totalPrice, setTotalPrice] = useState(item.price || 0);

  useEffect(() => {
    if (isOpen) {
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
      setTotalPrice(item.price || 0);
    }
  }, [isOpen, currentQuantity, item.price]);

  const handleOptionChange = (optionGroup, optionId, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionGroup]: value
    }));
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.find(a => a._id === addon._id);
      if (isSelected) {
        return prev.filter(a => a._id !== addon._id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const updateTotalPrice = () => {
    let basePrice = item.price || 0;
    let addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    setTotalPrice((basePrice + addonsPrice) * quantity);
  };

  useEffect(() => {
    updateTotalPrice();
  }, [selectedOptions, selectedAddons, quantity, item.price]);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    const customizations = {
      options: selectedOptions,
      addons: selectedAddons,
      totalPrice: totalPrice
    };

    onAddToCart(item, customizations, specialInstructions, quantity);
    onClose();
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Customize Your Order</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Quantity</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Customization Options */}
          {item.customizationOptions && item.customizationOptions.length > 0 && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Customization Options</h5>
              {item.customizationOptions.map((optionGroup) => (
                <div key={optionGroup._id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {optionGroup.name}
                    {optionGroup.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="space-y-2">
                    {optionGroup.options.map((option) => (
                      <label key={option._id} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={optionGroup._id}
                          value={option._id}
                          checked={selectedOptions[optionGroup._id] === option._id}
                          onChange={(e) => handleOptionChange(optionGroup._id, option._id, e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option.name}</span>
                        {option.price && (
                          <span className="text-sm text-gray-500 ml-auto">
                            +{formatPrice(option.price)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Add-ons</h5>
              <div className="space-y-2">
                {item.addons.map((addon) => (
                  <label key={addon._id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAddons.some(a => a._id === addon._id)}
                      onChange={() => handleAddonToggle(addon)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{addon.name}</span>
                    {addon.price && (
                      <span className="text-sm text-gray-500 ml-auto">
                        +{formatPrice(addon.price)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or dietary requirements?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Price Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Base Price</span>
              <span className="text-sm text-gray-900">{formatPrice(item.price)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Add-ons</span>
                <span className="text-sm text-gray-900">
                  +{formatPrice(selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0))}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Quantity</span>
              <span className="text-sm text-gray-900">× {quantity}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-semibold text-lg text-gray-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {currentQuantity > 0 ? 'Update Cart' : 'Add to Cart'} - {formatPrice(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCustomization;


