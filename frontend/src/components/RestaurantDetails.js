// frontend/src/components/RestaurantDetails.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { FaUtensils, FaMapMarkerAlt, FaInfoCircle, FaStar, FaClock, FaPhone, FaShoppingCart } from 'react-icons/fa';

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useContext(CartContext);

  // Format address helper function
  const formatAddress = (address) => {
    if (!address) return 'No address available';
    if (typeof address === 'string') return address;
    
    const { street, city, state, zipCode } = address;
    const parts = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zipCode) parts.push(zipCode);
    
    return parts.join(', ') || 'Address not available';
  };

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  // Filter menu items by active category
  const filteredMenuItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError('');
        const [resResponse, menuResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/restaurants/${id}`),
          axios.get(`http://localhost:5000/api/restaurants/${id}/menu`)
        ]);
        setRestaurant(resResponse.data);
        setMenuItems(menuResponse.data);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError('Failed to load restaurant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Restaurant Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {formatAddress(restaurant.address)}
                </div>
                {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <FaUtensils className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {restaurant.cuisine.join(', ')}
                  </div>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FaStar className="flex-shrink-0 mr-1.5 h-5 w-5 text-yellow-400" />
                  4.5 (120 reviews)
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaPhone className="-ml-1 mr-2 h-5 w-5" />
                Call Restaurant
              </button>
            </div>
          </div>
          
          {restaurant.description && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-900">About</h2>
              <div className="mt-1 max-w-3xl text-sm text-gray-700">
                <p>{restaurant.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Our Menu
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0">
            <div className="inline-flex rounded-md shadow-sm">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 text-sm font-medium ${activeCategory === category 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 ${category === 'all' ? 'rounded-l-md' : ''} ${category === categories[categories.length - 1] ? 'rounded-r-md' : 'border-r-0'}`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          {filteredMenuItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenuItems.map((item) => (
                <div key={item._id} className="bg-white overflow-hidden shadow rounded-lg">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <FaUtensils className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        {item.isVeg && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Veg
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                            Vegan
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Gluten Free
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaShoppingCart className="-ml-1 mr-1 h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaUtensils className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeCategory === 'all' 
                  ? 'This restaurant has not added any menu items yet.'
                  : `No ${activeCategory} items available.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;