import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

const MenuItemForm = ({ menuItem = null, onSuccess, onClose }) => {
  const { id } = useParams();
  const [formDataState, setFormDataState] = useState({
    name: menuItem?.name || '',
    description: menuItem?.description || '',
    price: menuItem?.price || '',
    category: menuItem?.category || 'main',
    isVegetarian: menuItem?.isVegetarian || false,
    isVegan: menuItem?.isVegan || false,
    isGlutenFree: menuItem?.isGlutenFree || false,
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormDataState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', formDataState.name);
    formData.append('description', formDataState.description);
    formData.append('price', formDataState.price);
    formData.append('category', formDataState.category);
    formData.append('isVeg', formDataState.isVegetarian);
    formData.append('isVegan', formDataState.isVegan);
    formData.append('isGlutenFree', formDataState.isGlutenFree);
    
    if (image) {
      formData.append('image', image);
    }

    try {
      const endpoint = menuItem 
        ? `/management/restaurants/${id}/menu/${menuItem._id}`
        : `/management/restaurants/${id}/menu`;
      
      const method = menuItem ? 'put' : 'post';
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await api({
        method,
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      setNotification({
        open: true,
        message: menuItem ? 'Menu item updated successfully!' : 'Menu item added successfully!',
        severity: 'success',
      });
      
      if (onSuccess) {
        await onSuccess();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to save menu item. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {menuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            name="name"
            value={formDataState.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formDataState.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price *</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="price"
                value={formDataState.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              name="category"
              value={formDataState.category}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="appetizer">Appetizer</option>
              <option value="main">Main Course</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVegetarian"
              name="isVegetarian"
              checked={formDataState.isVegetarian}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isVegetarian" className="ml-2 block text-sm text-gray-700">
              Vegetarian
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVegan"
              name="isVegan"
              checked={formDataState.isVegan}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isVegan" className="ml-2 block text-sm text-gray-700">
              Vegan
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isGlutenFree"
              name="isGlutenFree"
              checked={formDataState.isGlutenFree}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isGlutenFree" className="ml-2 block text-sm text-gray-700">
              Gluten Free
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Menu Item'}
          </button>
        </div>
      </form>
      
      {notification.open && (
        <div className={`mt-4 p-4 rounded-md ${notification.severity === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.severity === 'error' ? (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${notification.severity === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={handleCloseNotification}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.severity === 'error' 
                      ? 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600' 
                      : 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemForm;
