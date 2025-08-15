import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const RestaurantForm = ({ restaurant = null, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      location: {
        type: 'Point',
        coordinates: ['', ''] // longitude, latitude
      }
    },
    cuisine: [],
    description: ''
  });
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Determine if we're in edit mode
  useEffect(() => {
    if (id && id !== 'new') {
      // Check if user is logged in and has restaurant role
      if (!user || user.role !== 'restaurant') {
        console.log('User not logged in or not a restaurant owner, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }
      
      setIsEditing(true);
      fetchRestaurantData();
    }
  }, [id, user, navigate]);

  const fetchRestaurantData = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      console.log('Fetching restaurant data for ID:', id);
      const response = await api.get(`/restaurants/${id}`);
      const restaurantData = response.data;
      
      console.log('Fetched restaurant data:', restaurantData);
      console.log('Restaurant owner ID:', restaurantData.owner);
      console.log('Current user ID:', user._id);
      
      if (restaurantData) {
        // Check if the current user owns this restaurant
        console.log('Authorization check:', {
          currentUserId: user._id,
          restaurantOwnerId: restaurantData.owner,
          userIdType: typeof user._id,
          ownerIdType: typeof restaurantData.owner,
          isEqual: restaurantData.owner === user._id
        });
        
        if (restaurantData.owner.toString() !== user._id.toString()) {
          console.log('User not authorized to edit this restaurant, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        setFormData({
          name: restaurantData.name || '',
          address: {
            street: restaurantData.address?.street || '',
            city: restaurantData.address?.city || '',
            state: restaurantData.address?.state || '',
            zipCode: restaurantData.address?.zipCode || '',
            location: {
              type: 'Point',
              coordinates: [
                restaurantData.address?.location?.coordinates?.[0] || '', // longitude
                restaurantData.address?.location?.coordinates?.[1] || ''  // latitude
              ]
            }
          },
          cuisine: restaurantData.cuisine ? [...restaurantData.cuisine] : [],
          description: restaurantData.description || ''
        });
      }
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.response?.data?.message || 'Failed to fetch restaurant data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name.startsWith('address.')) {
      const addressField = e.target.name.split('.')[1];
      if (addressField === 'longitude' || addressField === 'latitude') {
        const isLongitude = addressField === 'longitude';
        const value = e.target.value;
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            location: {
              ...prev.address.location,
              coordinates: [
                isLongitude ? value : prev.address.location.coordinates[0],
                !isLongitude ? value : prev.address.location.coordinates[1]
              ]
            }
          }
        }));
      } else {
        setFormData({
          ...formData,
          address: {
            ...formData.address,
            [addressField]: e.target.value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleCuisineAdd = () => {
    if (selectedCuisine && !formData.cuisine.includes(selectedCuisine)) {
      setFormData({
        ...formData,
        cuisine: [...formData.cuisine, selectedCuisine]
      });
      setSelectedCuisine('');
    }
  };
  
  const handleCuisineRemove = (cuisineToRemove) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine.filter(cuisine => cuisine !== cuisineToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    const [lng, lat] = formData.address.location.coordinates;
    if (!formData.name || !formData.address.street || formData.cuisine.length === 0 || !lat || !lng) {
      setError('Please fill in all required fields, including latitude and longitude');
      setLoading(false);
      return;
    }

    try {
      const restaurantData = {
        name: formData.name,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
          location: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        },
        cuisine: formData.cuisine,
        description: formData.description,
        owner: user._id // Ensure the owner ID is set from the logged-in user
      };

      console.log('Submitting restaurant data:', JSON.stringify(restaurantData, null, 2));

      let response;
      if (isEditing) {
        // Update existing restaurant
        console.log('Updating restaurant with ID:', id);
        response = await api.put(`/restaurants/${id}`, restaurantData);
        console.log('Restaurant update response:', response.data);
      } else {
        // Create new restaurant
        console.log('Creating new restaurant...');
        response = await api.post('/restaurants', restaurantData);
        console.log('Restaurant creation response:', response.data);
        
        // Verify the response contains the created restaurant with an ID
        if (!response.data || !response.data._id) {
          throw new Error('Invalid response from server: Missing restaurant ID');
        }
      }
      
      // Trigger the success callback if provided
      if (onSuccess) {
        console.log('Calling onSuccess callback...');
        await onSuccess();
      }
      
      // Dispatch event to notify dashboard of the new restaurant
      console.log('Dispatching restaurantCreated event...');
      window.dispatchEvent(new CustomEvent('restaurantCreated'));
      
      // Small delay before navigation to ensure state updates
      console.log('Navigating to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Failed to save restaurant');
      setLoading(false);
    }
  };

  const cuisines = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'American', 
    'Japanese', 'Thai', 'Mediterranean', 'French', 'Korean', 
    'Vietnamese', 'Greek', 'Spanish', 'Lebanese', 'Turkish', 'Other'
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
      </h2>
      
      {initialLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Loading restaurant data...
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Restaurant Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Address *</label>
          <div className="mt-1 space-y-2">
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="Street Address"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="City"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="State"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="ZIP Code"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <input
              type="text"
              name="address.longitude"
              value={formData.address.location.coordinates[0]}
              onChange={handleChange}
              placeholder="Longitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mt-2"
              required
            />
            <input
              type="text"
              name="address.latitude"
              value={formData.address.location.coordinates[1]}
              onChange={handleChange}
              placeholder="Latitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mt-2"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Cuisine *</label>
          <div className="mt-1 flex space-x-2">
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a cuisine</option>
              {cuisines.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCuisineAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>
          
          {formData.cuisine.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.cuisine.map((cuisine) => (
                <span
                  key={cuisine}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {cuisine}
                  <button
                    type="button"
                    onClick={() => handleCuisineRemove(cuisine)}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                  >
                    <span className="sr-only">Remove {cuisine}</span>
                    <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M4 3.293l2.146-2.147a.5.5 0 01.708.708L4.707 4l2.147 2.146a.5.5 0 01-.708.708L4 4.707l-2.146 2.147a.5.5 0 01-.708-.708L3.293 4 1.146 1.854a.5.5 0 01.708-.708L4 3.293z" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
};


export default RestaurantForm;
