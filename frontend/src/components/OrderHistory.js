// frontend/src/components/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiMapPin, FiDollarSign, FiEye, FiX, FiCheck, FiTruck, FiPackage } from 'react-icons/fi';
import axios from 'axios';

const OrderHistory = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      fetchOrders();
    }
  }, [isAuthenticated, navigate, orderId, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders/my-orders?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        // Refresh orders or order details
        if (selectedOrder) {
          fetchOrderDetails(orderId);
        } else {
          fetchOrders();
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    // If address is a string, return it as is
    if (typeof address === 'string') return address;
    
    // If address is an object, format its parts
    const { street, city, state, zipCode, location } = address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.join(', ') || location || 'Address not available';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <FiCheck className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <FiPackage className="h-5 w-5 text-orange-500" />;
      case 'ready':
        return <FiCheck className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery':
        return <FiTruck className="h-5 w-5 text-blue-600" />;
      case 'delivered':
        return <FiCheck className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <FiX className="h-5 w-5 text-red-500" />;
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelOrder = (order) => {
    const nonCancellableStatuses = ['delivered', 'cancelled', 'out_for_delivery'];
    return !nonCancellableStatuses.includes(order.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Individual Order Details View
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Orders
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Order Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h1>
                  <p className="text-gray-600 mt-1">Placed on {formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedOrder.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.statusDisplay || selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Restaurant</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{selectedOrder.restaurant.name}</h3>
                <p className="text-gray-600 text-sm">{formatAddress(selectedOrder.restaurant.address)}</p>
                {selectedOrder.restaurant.phone && (
                  <p className="text-gray-600 text-sm">Phone: {selectedOrder.restaurant.phone}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
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
                      {selectedOrder.deliveryDetails.firstName} {selectedOrder.deliveryDetails.lastName}
                    </p>
                    <p className="text-gray-600">{selectedOrder.deliveryDetails.phone}</p>
                    <p className="text-gray-600">{selectedOrder.deliveryDetails.email}</p>
                    <p className="text-gray-600 mt-1">
                      {selectedOrder.deliveryDetails.address}, {selectedOrder.deliveryDetails.city}, {selectedOrder.deliveryDetails.state} {selectedOrder.deliveryDetails.zipCode}
                    </p>
                    {selectedOrder.deliveryDetails.deliveryInstructions && (
                      <p className="text-gray-600 mt-1 italic">
                        Instructions: {selectedOrder.deliveryDetails.deliveryInstructions}
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
                    <span className="text-gray-900">{formatPrice(selectedOrder.orderSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">{formatPrice(selectedOrder.orderSummary.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatPrice(selectedOrder.orderSummary.tax)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.orderSummary.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                  {selectedOrder.cardDetails && (
                    <span className="text-gray-600">
                      ending in {selectedOrder.cardDetails.last4}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canCancelOrder(selectedOrder) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      cancelOrder(selectedOrder._id, 'Customer cancellation');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Orders List View
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-2">Track your orders and view past purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FiPackage className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h2>
                    <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.statusDisplay || order.status}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <FiEye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{order.restaurant.name}</h3>
                    <p className="text-gray-600 text-sm">{order.totalItems} items</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="font-semibold text-gray-900">{formatPrice(order.orderSummary.total)}</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this order?')) {
                            cancelOrder(order._id, 'Customer cancellation');
                          }
                        }}
                        className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 bg-blue-600 text-white rounded-md">
                  {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
