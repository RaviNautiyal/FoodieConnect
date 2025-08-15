// frontend/src/components/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiClock, FiCreditCard, FiUser, FiPhone, FiMail, FiCheck, FiX } from 'react-icons/fi';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, deliveryFee, getCartFinalTotal, clearCart, getRestaurantId } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryInstructions: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    console.log('Checkout useEffect - cart:', cart, 'length:', cart.length);
    console.log('Checkout useEffect - cartTotal:', cartTotal);
    console.log('Checkout useEffect - isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    // Give the cart context time to load
    const checkCart = setTimeout(() => {
      console.log('Checking cart after timeout - cart length:', cart.length);
      console.log('Full cart contents:', cart);
      console.log('cartTotal:', cartTotal);
      console.log('deliveryFee:', deliveryFee);
      setIsCartLoading(false);
      
      if (cart.length === 0) {
        console.log('Cart is empty, redirecting to home');
        // Temporarily disable redirect to debug
        // navigate('/');
        // return;
      }
    }, 1000); // Increased timeout to 1000ms

    // Calculate order summary
    const subtotal = cartTotal;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;
    
    console.log('Order summary calculation:', { subtotal, deliveryFee, tax, total });
    
    setOrderSummary({
      subtotal,
      deliveryFee,
      tax,
      total
    });

    return () => clearTimeout(checkCart);
  }, [cart, cartTotal, deliveryFee, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Limit length
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) return; // Limit length
    }

    // Format CVV (numbers only)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return; // Limit length
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const validateForm = () => {
    console.log('Validating form with data:', deliveryDetails);
    
    const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'address', 'city', 'state', 'zipCode'];
    
    for (const field of requiredFields) {
      if (!deliveryDetails[field] || !deliveryDetails[field].trim()) {
        console.log(`Validation failed for field: ${field}`);
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(deliveryDetails.email)) {
      console.log('Email validation failed:', deliveryDetails.email);
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation (flexible format) - make it more lenient
    if (deliveryDetails.phone.trim().length < 7) {
      console.log('Phone validation failed:', deliveryDetails.phone);
      setError('Please enter a valid phone number (at least 7 digits)');
      return false;
    }

    // ZIP code validation (flexible format) - make it more lenient
    if (deliveryDetails.zipCode.trim().length < 3) {
      console.log('ZIP code validation failed:', deliveryDetails.zipCode);
      setError('Please enter a valid ZIP/postal code (at least 3 characters)');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
        setError('Please fill in all card details');
        return false;
      }

      // Card number validation (basic length check)
      const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        setError('Please enter a valid card number');
        return false;
      }

      // Expiry date validation (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(cardDetails.expiryDate)) {
        setError('Please enter expiry date in MM/YY format');
        return false;
      }

      // Check if card is not expired
      const [month, year] = cardDetails.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        setError('Card has expired');
        return false;
      }

      // CVV validation
      if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
        setError('Please enter a valid CVV (3-4 digits)');
        return false;
      }

      // Cardholder name validation
      if (cardDetails.cardholderName.trim().length < 2) {
        setError('Please enter the cardholder name');
        return false;
      }
    }

    return true;
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    console.log('Starting order placement...');
    console.log('Current delivery details:', deliveryDetails);
    console.log('Current payment method:', paymentMethod);
    console.log('Current card details:', paymentMethod === 'card' ? cardDetails : 'N/A');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    // Check if restaurant ID is available
    const currentRestaurantId = getRestaurantId();
    console.log('Restaurant ID:', currentRestaurantId);
    if (!currentRestaurantId) {
      setError('Restaurant information is missing. Please try adding items to cart again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const orderData = {
        restaurantId: currentRestaurantId,
        items: cart.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations,
          specialInstructions: item.specialInstructions
        })),
        deliveryDetails: {
          ...deliveryDetails
        },
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? cardDetails : null,
        orderSummary: {
          subtotal: orderSummary.subtotal,
          deliveryFee: orderSummary.deliveryFee,
          tax: orderSummary.tax,
          total: orderSummary.total
        }
      };

      console.log('Sending order data:', orderData);
      console.log('Restaurant ID from cart:', getRestaurantId());
      console.log('Cart items:', cart);

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        clearCart();
        
        // Redirect to order confirmation after 3 seconds
        setTimeout(() => {
          navigate(`/orders/${response.data.order._id}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors[0].msg || validationErrors[0].message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We'll send you updates on your delivery status.
          </p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">Redirecting to order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading checkout...</h2>
          <p className="text-gray-600">Please wait while we prepare your order details.</p>
        </div>
      </div>
    );
  }

  // Debug display - show even if cart is empty
  if (cart.length === 0 && !isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout Debug Info</h2>
            <div className="text-left bg-gray-100 p-4 rounded-lg">
              <p><strong>Cart Length:</strong> {cart.length}</p>
              <p><strong>Cart Contents:</strong> {JSON.stringify(cart, null, 2)}</p>
              <p><strong>Cart Total:</strong> {cartTotal}</p>
              <p><strong>Delivery Fee:</strong> {deliveryFee}</p>
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/cart')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
              >
                Back to Cart
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order and get ready for delicious food!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="h-5 w-5 mr-2 text-blue-600" />
                Delivery Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={deliveryDetails.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={deliveryDetails.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={deliveryDetails.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={deliveryDetails.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={deliveryDetails.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryDetails.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={deliveryDetails.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={deliveryDetails.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
                  <textarea
                    name="deliveryInstructions"
                    value={deliveryDetails.deliveryInstructions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Any special delivery instructions (e.g., leave at door, call when arriving)"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiCreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Payment Method
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="card" className="text-sm font-medium text-gray-700">
                    Credit/Debit Card
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="cash" className="text-sm font-medium text-gray-700">
                    Cash on Delivery
                  </label>
                </div>
              </div>

              {/* Card Details */}
              {paymentMethod === 'card' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleCardInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleCardInputChange}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
      <input
        type="text"
                      name="cardholderName"
                      value={cardDetails.cardholderName}
                      onChange={handleCardInputChange}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cart.map((item, index) => (
                  <div key={`${item._id}-${index}`} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </p>
                      {item.customizations?.addons?.length > 0 && (
                        <p className="text-xs text-gray-600">
                          +{item.customizations.addons.map(addon => addon.name).join(', ')}
                        </p>
                      )}
                    </div>
                                         <span className="text-sm font-medium text-gray-900">
                       {formatPrice((item.price + (item.customizations?.addons && Array.isArray(item.customizations.addons) ? item.customizations.addons.reduce((sum, addon) => sum + (addon.price || 0), 0) : 0)) * item.quantity)}
                     </span>
                  </div>
                ))}
              </div>
              
              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(orderSummary.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">{formatPrice(orderSummary.deliveryFee)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(orderSummary.tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(orderSummary.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : `Place Order - ${formatPrice(orderSummary.total)}`}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;