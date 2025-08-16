// frontend/src/components/RestaurantOrders.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { FiClock, FiCheck, FiX, FiTruck, FiPackage, FiRefreshCw, FiPhone, FiMapPin } from 'react-icons/fi';
import axios from 'axios';

const RestaurantOrders = ({ restaurantId }) => {
  const { isAuthenticated, user } = useAuth();
  const { isRestaurant } = useRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-blue-100 text-blue-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' }
  ];

  const nextStatusMap = {
    'pending': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': 'out_for_delivery',
    'out_for_delivery': 'delivered'
  };

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      console.log('RestaurantOrders: Fetching orders for restaurantId:', restaurantId);
      console.log('RestaurantOrders: isAuthenticated:', isAuthenticated);
      console.log('RestaurantOrders: isRestaurant:', isRestaurant);
      console.log('RestaurantOrders: user:', user);
      console.log('RestaurantOrders: user role:', user?.role);
      console.log('RestaurantOrders: user id:', user?.id || user?._id);
      console.log('RestaurantOrders: Token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      console.log('RestaurantOrders: Full token:', localStorage.getItem('accessToken'));
      
      if (!restaurantId) {
        throw new Error('No restaurant ID provided');
      }
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const url = `${API_URL}/api/orders/restaurant/${restaurantId}?${params}`;
      console.log('RestaurantOrders: Making request to:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('RestaurantOrders: Response:', response.data);

      if (response.data.success) {
        setOrders(response.data.data);
        setError('');
      }
    } catch (error) {
      console.error('RestaurantOrders: Error fetching orders:', error);
      console.error('RestaurantOrders: Error response:', error.response?.data);
      console.error('RestaurantOrders: Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load orders. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (!silent) {
        setError(errorMessage);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [restaurantId, statusFilter, API_URL, isAuthenticated, isRestaurant, user]);

  useEffect(() => {
    if (isAuthenticated && isRestaurant && restaurantId) {
      fetchOrders();
    }
  }, [isAuthenticated, isRestaurant, restaurantId, statusFilter, fetchOrders]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus, reason = '') => {
    try {
      setUpdating(orderId);
      setError(''); // Clear any previous errors
      
      console.log('Updating order status:', { orderId, newStatus, reason });
      console.log('API URL:', `${API_URL}/api/orders/${orderId}/status`);
      console.log('Token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      
      const response = await axios.patch(`${API_URL}/api/orders/${orderId}/status`, 
        { status: newStatus, reason },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      console.log('Status update response:', response.data);

      if (response.data.success) {
        // Update the order in the list
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        ));
        
        // Show success message
        console.log(`Order ${orderId} status updated to ${newStatus} successfully`);
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to update order status. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = 'You are not authorized to update this order. Please contact support.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Order not found. Please refresh the page.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return statusOptions.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const canUpdateStatus = (status) => {
    return nextStatusMap[status] !== undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={() => fetchOrders()}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <FiPackage className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? "You don't have any orders yet." 
              : `No ${statusFilter} orders found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.createdAt)} • {getTimeAgo(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.statusDisplay || order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(order.orderSummary.total)}</p>
                    <p className="text-sm text-gray-600">{order.totalItems} items</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.deliveryDetails.firstName} {order.deliveryDetails.lastName}
                    </p>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <FiPhone className="h-4 w-4" />
                      <span>{order.deliveryDetails.phone}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start space-x-1 text-gray-600">
                      <FiMapPin className="h-4 w-4 mt-0.5" />
                      <div className="text-sm">
                        <p>{order.deliveryDetails.address}</p>
                        <p>{order.deliveryDetails.city}, {order.deliveryDetails.state} {order.deliveryDetails.zipCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {order.deliveryDetails.deliveryInstructions && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <strong>Instructions:</strong> {order.deliveryDetails.deliveryInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {item.specialInstructions && (
                          <p className="text-sm text-gray-600 italic">Note: {item.specialInstructions}</p>
                        )}
                        {item.customizations?.addons && item.customizations.addons.length > 0 && (
                          <div className="text-sm text-gray-500">
                            Add-ons: {item.customizations.addons.map(addon => addon.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Payment: <span className="capitalize font-medium">{order.paymentMethod}</span>
                  {order.estimatedDeliveryTime && (
                    <span className="ml-4">
                      ETA: {order.estimatedDeliveryTime} minutes
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {canUpdateStatus(order.status) && (
                    <button
                      onClick={() => updateOrderStatus(order._id, nextStatusMap[order.status])}
                      disabled={updating === order._id}
                      className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating === order._id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        `Mark as ${nextStatusMap[order.status].replace('_', ' ')}`
                      )}
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for cancellation:');
                        if (reason) {
                          updateOrderStatus(order._id, 'cancelled', reason);
                        }
                      }}
                      disabled={updating === order._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders;

