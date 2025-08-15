import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiFileText } from 'react-icons/fi';

const MenuManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Main Course',
    isAvailable: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    'Appetizers',
    'Main Course', 
    'Desserts',
    'Beverages',
    'Sides',
    'Salads',
    'Soups'
  ];

  useEffect(() => {
    fetchMenuItems();
  }, [id]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use only the dashboard endpoint that should already be working
      const response = await api.get('/dashboard/menu');
      console.log('Dashboard menu response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setMenuItems(response.data);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err.response?.data?.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      const menuItemData = {
        ...newMenuItem,
        price: parseFloat(newMenuItem.price) // Don't multiply by 100, send original price
      };
      
      console.log('Creating menu item:', menuItemData);
      
      // Use only the dashboard endpoint
      await api.post('/dashboard/menu', menuItemData);
      
      setNewMenuItem({
        name: '',
        price: '',
        description: '',
        category: 'Main Course',
        isAvailable: true
      });
      setShowAddForm(false);
      
      // Refresh menu items
      fetchMenuItems();
    } catch (err) {
      console.error('Error creating menu item:', err);
      setError(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleUpdate = async (itemId, updatedItem) => {
    try {
      setError(null);
      
      const updateData = {
        ...updatedItem,
        price: parseFloat(updatedItem.price) // Don't multiply by 100, send original price
      };
      
      console.log('Updating menu item:', updateData);
      
      // Use only the dashboard endpoint
      await api.put(`/dashboard/menu/${itemId}`, updateData);
      
      // Refresh menu items
      fetchMenuItems();
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err.response?.data?.message || 'Failed to update menu item');
    }
  };

  const handleDeleteMenuItem = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Deleting menu item:', menuId);
      
      // Use only the dashboard endpoint
      await api.delete(`/dashboard/menu/${menuId}`);
      
      // Refresh menu items
      fetchMenuItems();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err.response?.data?.message || 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600 mt-2">Manage your restaurant's menu items</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiPackage className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Menu Item Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Menu Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newMenuItem.category}
                  onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMenuItem.isAvailable}
                    onChange={(e) => setNewMenuItem({...newMenuItem, isAvailable: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu Items List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Menu Items ({menuItems.length})</h2>
          </div>
          
          {menuItems.length === 0 ? (
            <div className="p-8 text-center">
              <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
              <p className="text-gray-600">Add your first menu item to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {menuItems.map(item => (
                <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FiDollarSign className="h-4 w-4 mr-1" />
                          {formatPrice(item.price)}
                        </span>
                        <span className="flex items-center">
                          <FiFileText className="h-4 w-4 mr-1" />
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdate(item._id, { ...item, isAvailable: !item.isAvailable })}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          item.isAvailable
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {item.isAvailable ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => navigate(`/restaurant/${id}/menu/${item._id}/edit`)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item._id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
