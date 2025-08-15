import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiMapPin, FiX, FiCheck, FiTruck, FiPackage, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchOrderDetails = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${orderId}` } });
      return;
    }

    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [isAuthenticated, navigate, orderId, fetchOrderDetails]);

  const cancelOrder = async (orderId, reason) => {
    try {
      const response = await axios.patch(`${API_URL}/orders/${orderId}/cancel`, 
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.data.success) {
        fetchOrderDetails(orderId);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <FiCheck className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <FiPackage className="h-5 w-5 text-orange-500" />;
      case 'ready':
        return <FiCheck className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery':
        return <FiTruck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <FiCheck className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <FiX className="h-5 w-5 text-red-500" />;
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [address.street, address.city, address.state, address.zipCode];
    return parts.filter(Boolean).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchOrderDetails(orderId)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">📦</div>
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Order Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.statusDisplay || order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Restaurant</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{order.restaurant.name}</h3>
              <p className="text-gray-600 text-sm">{formatAddress(order.restaurant.address)}</p>
              {order.restaurant.phone && (
                <p className="text-gray-600 text-sm">Phone: {order.restaurant.phone}</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-600 italic">Note: {item.specialInstructions}</p>
                    )}
                    {item.customizations?.addons && item.customizations.addons.length > 0 && (
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">Add-ons:</p>
                        <ul className="text-sm text-gray-500 ml-4">
                          {item.customizations.addons.map((addon, addonIndex) => (
                            <li key={addonIndex}>• {addon.name} (+{formatPrice(addon.price)})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</p>
                    <p className="text-sm text-gray-600">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delivery Details</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.deliveryDetails.firstName} {order.deliveryDetails.lastName}
                  </p>
                  <p className="text-gray-600">{order.deliveryDetails.phone}</p>
                  <p className="text-gray-600">{order.deliveryDetails.email}</p>
                  <p className="text-gray-600 mt-1">
                    {order.deliveryDetails.address}, {order.deliveryDetails.city}, {order.deliveryDetails.state} {order.deliveryDetails.zipCode}
                  </p>
                  {order.deliveryDetails.deliveryInstructions && (
                    <p className="text-gray-600 mt-1 italic">
                      Instructions: {order.deliveryDetails.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.orderSummary.subtotal)}</span>
                </div>
                {order.orderSummary.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">{formatPrice(order.orderSummary.deliveryFee)}</span>
                  </div>
                )}
                {order.orderSummary.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatPrice(order.orderSummary.tax)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">{formatPrice(order.orderSummary.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Order Button */}
          {order.status === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for cancellation:');
                  if (reason) {
                    cancelOrder(order._id, reason);
                  }
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
