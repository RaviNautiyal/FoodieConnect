import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiMapPin, FiFilter, FiClock, FiStar, FiDollarSign, FiLoader, FiNavigation, FiX, FiShoppingCart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Default image for restaurants
const DEFAULT_RESTAURANT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1504674900247-087703934569?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';

const RestaurantSearch = () => {
  const { isAuthenticated } = useAuth();
  const { getCartItemCount, getRestaurantId } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState({
    cuisine: [],
    priceRange: [],
    minRating: 0,
    maxDeliveryTime: 60,
    sortBy: 'distance',
  });
  const [restaurants, setRestaurants] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const locationInputRef = useRef(null);
  
  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch nearby restaurants based on coordinates
  const fetchNearbyRestaurants = useCallback(async (coords, radius = 10000) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/search/geolocation`, {
        params: {
          latitude: coords.lat,
          longitude: coords.lng,
          radius: radius // Default 10km, can be overridden
        }
      });

      if (response.data.success) {
        setRestaurants(response.data.data.nearbyRestaurants);
        setPagination(prev => ({ 
          ...prev, 
          total: response.data.data.count, 
          pages: Math.ceil(response.data.data.count / prev.limit) 
        }));
      }
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      setError('Failed to fetch nearby restaurants');
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Get user's current location using browser geolocation
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return false;
    }

    setLoadingLocation(true);
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        // First attempt with shorter timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, 8000); // 8 seconds timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          { 
            enableHighAccuracy: false, // Start with lower accuracy for faster response
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const coords = { lat: latitude, lng: longitude };
      
      setUserLocation(coords);
      setLocationCoords(coords);
      setLocation('Current Location');
      
      // Fetch nearby restaurants
      await fetchNearbyRestaurants(coords);
      return true;
    } catch (error) {
      console.error('Geolocation error:', error);
      let errorMessage = 'Unable to get your location';
      let shouldRetry = false;
      
      if (error.message === 'TIMEOUT') {
        errorMessage = 'Location request timed out. This can happen due to slow GPS or network issues.';
        shouldRetry = true;
      } else {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again or enter your location manually.';
            shouldRetry = true;
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. This can happen due to slow GPS or network issues.';
            shouldRetry = true;
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
            shouldRetry = true;
        }
      }
      
      setLocationError(errorMessage);
      
      // If it's a timeout or retryable error, offer to retry with different settings
      if (shouldRetry) {
        setLocationError(prev => prev + ' Click "Try Again" to retry with different settings.');
      }
      
      return false;
    } finally {
      setLoadingLocation(false);
    }
  }, [fetchNearbyRestaurants]);

  // Retry geolocation with different settings
  const retryGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return false;
    }

    setLoadingLocation(true);
    setLocationError('Retrying with different settings...');

    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, 15000); // 15 seconds timeout for retry

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          { 
            enableHighAccuracy: true, // Try with high accuracy on retry
            timeout: 20000, // Longer timeout
            maximumAge: 600000 // 10 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const coords = { lat: latitude, lng: longitude };
      
      setUserLocation(coords);
      setLocationCoords(coords);
      setLocation('Current Location');
      setLocationError(''); // Clear any previous errors
      
      // Fetch nearby restaurants
      await fetchNearbyRestaurants(coords);
      return true;
    } catch (error) {
      console.error('Geolocation retry error:', error);
      let errorMessage = 'Still unable to get your location';
      
      if (error.message === 'TIMEOUT') {
        errorMessage = 'Location request timed out again. Please try entering your location manually or check your internet connection.';
      } else {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please check your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information still unavailable. Please enter your location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out again. Please try entering your location manually.';
            break;
          default:
            errorMessage = 'An error occurred during retry. Please enter your location manually.';
        }
      }
      
      setLocationError(errorMessage);
      return false;
    } finally {
      setLoadingLocation(false);
    }
  }, [fetchNearbyRestaurants]);

  // Get location suggestions for manual input
  const getLocationSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/search/location-suggestions`, {
        params: { query }
      });

      if (response.data.success) {
        setLocationSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error getting location suggestions:', error);
    }
  }, [API_URL]);

  // Handle manual location selection
  const handleManualLocationSelect = useCallback(async (selectedLocation) => {
    setManualLocation(selectedLocation.displayName);
    setLocation(selectedLocation.displayName);
    setShowLocationSuggestions(false);
    
    // Try to geocode the selected location
    try {
      const response = await axios.get(`${API_URL}/search/geocode`, {
        params: { address: selectedLocation.displayName }
      });

      if (response.data.success) {
        const coords = {
          lat: response.data.data.lat,
          lng: response.data.data.lng
        };
        setLocationCoords(coords);
        await fetchNearbyRestaurants(coords);
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      setLocationError('Unable to find coordinates for this location');
    }
  }, [API_URL, fetchNearbyRestaurants]);

  // Handle manual location input
  const handleManualLocationSubmit = useCallback(async () => {
    if (!manualLocation.trim()) {
      setLocationError('Please enter a location');
      return;
    }

    setLocationError('');
    setLocation(manualLocation);
    setShowLocationInput(false);

    try {
      const response = await axios.get(`${API_URL}/search/geocode`, {
        params: { address: manualLocation }
      });

      if (response.data.success) {
        const coords = {
          lat: response.data.data.lat,
          lng: response.data.data.lng
        };
        setLocationCoords(coords);
        await fetchNearbyRestaurants(coords);
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      setLocationError('Unable to find this location. Please try a different address.');
    }
  }, [manualLocation, API_URL, fetchNearbyRestaurants]);

  // Debounce function for search
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Fetch location suggestions
  const fetchLocationSuggestions = useCallback(debounce(async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/search/autocomplete?query=${encodeURIComponent(query)}`);
      setLocationSuggestions(response.data.data?.restaurants || []);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    }
  }, 300), [API_URL]);

  // Debounced location suggestions
  const debouncedLocationSuggestions = useCallback(
    debounce(getLocationSuggestions, 300),
    [getLocationSuggestions]
  );

  // Handle location input change
  const handleLocationInputChange = (value) => {
    setManualLocation(value);
    debouncedLocationSuggestions(value);
    setShowLocationSuggestions(value.length >= 2);
  };

  // Fetch restaurants from API
  const fetchRestaurants = useCallback(async (queryParams = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      let response;
      
      if (locationCoords) {
        // Use the new /restaurants/nearby endpoint
        const params = new URLSearchParams();
        params.append('latitude', locationCoords.lat);
        params.append('longitude', locationCoords.lng);
        params.append('radius', 5000); // 5km default, adjust as needed
        
        // Apply same filters to nearby endpoint for consistent UX
        if (filters.cuisine.length > 0) filters.cuisine.forEach(c => params.append('cuisine', c));
        if (filters.priceRange.length > 0) filters.priceRange.forEach(p => params.append('priceRange', p));
        if (filters.minRating > 0) params.append('minRating', filters.minRating);
        params.append('maxDeliveryTime', filters.maxDeliveryTime);
        
        const sortMap = {
          'recommended': 'recommended',
          'rating-desc': 'rating-desc',
          'delivery-asc': 'delivery-asc',
          'price-asc': 'price-asc',
          'price-desc': 'price-desc'
        };
        params.append('sortBy', sortMap[sortBy] || 'recommended');
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);
        
        response = await axios.get(`${API_URL}/restaurants/nearby?${params.toString()}`);
        const nearby = Array.isArray(response.data) ? response.data : [];
        setRestaurants(nearby);
        setPagination(prev => ({ ...prev, total: nearby.length || 0, pages: 1 }));

        // Fallback: if nearby returns empty, try generic search without geo to avoid blank results
        if (nearby.length === 0) {
          const fallback = new URLSearchParams();
          if (searchQuery) fallback.append('query', searchQuery);
          if (filters.cuisine.length > 0) {
            filters.cuisine.forEach(cuisine => fallback.append('cuisine', cuisine));
          }
          if (filters.priceRange.length > 0) {
            filters.priceRange.forEach(price => fallback.append('priceRange', price));
          }
          if (filters.minRating > 0) {
            fallback.append('minRating', filters.minRating);
          }
          fallback.append('maxDeliveryTime', filters.maxDeliveryTime);
          fallback.append('sortBy', sortMap[sortBy] || 'recommended');
          fallback.append('page', pagination.page);
          fallback.append('limit', pagination.limit);
          
          const fallbackResponse = await axios.get(`${API_URL}/search/restaurants?${fallback.toString()}`);
          if (fallbackResponse.data.success) {
            setRestaurants(fallbackResponse.data.data);
            setPagination(prev => ({ 
              ...prev, 
              total: fallbackResponse.data.total, 
              pages: fallbackResponse.data.pages 
            }));
          }
        }
      } else {
        // Generic search without location
        const params = new URLSearchParams();
        if (searchQuery) params.append('query', searchQuery);
        if (location) params.append('location', location);
        if (filters.cuisine.length > 0) {
          filters.cuisine.forEach(cuisine => params.append('cuisine', cuisine));
        }
        if (filters.priceRange.length > 0) {
          filters.priceRange.forEach(price => params.append('priceRange', price));
        }
        if (filters.minRating > 0) {
          params.append('minRating', filters.minRating);
        }
        params.append('maxDeliveryTime', filters.maxDeliveryTime);
        
        const sortMap = {
          'recommended': 'recommended',
          'rating-desc': 'rating-desc',
          'delivery-asc': 'delivery-asc',
          'price-asc': 'price-asc',
          'price-desc': 'price-desc'
        };
        params.append('sortBy', sortMap[sortBy] || 'recommended');
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);
        
        response = await axios.get(`${API_URL}/search/restaurants?${params.toString()}`);
        if (response.data.success) {
          setRestaurants(response.data.data);
          setPagination(prev => ({ 
            ...prev, 
            total: response.data.total, 
            pages: response.data.pages 
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants. Please try again later.');
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location, locationCoords, filters, sortBy, pagination.page, pagination.limit, API_URL]);

  // Create debounced version of fetchRestaurants
  const debouncedFetchRestaurants = useCallback(
    debounce(fetchRestaurants, 500),
    [fetchRestaurants]
  );

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axios.get(`${API_URL}/search/recommendations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      setRecommendations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, [isAuthenticated, API_URL]);

  // Handle location input change
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    
    if (value.length > 2) {
      fetchLocationSuggestions(value);
      setShowLocationSuggestions(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };
  
  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion) => {
    setLocation(suggestion.name || suggestion.formattedAddress);
    if (suggestion.location) {
      setLocationCoords({
        lat: suggestion.location.coordinates[1],
        lng: suggestion.location.coordinates[0]
      });
    }
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    
    // Fetch restaurants for the selected location
    debouncedFetchRestaurants();
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when performing a new search
    setPagination(prev => ({ ...prev, page: 1 }));
    debouncedFetchRestaurants();
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close filters and location suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterRef, locationInputRef]);

  // Fetch initial data when component mounts
  useEffect(() => {
    // Try to get user's location on initial load
    if (navigator.geolocation) {
      getCurrentLocation();
    }
  }, [getCurrentLocation]);

  // Auto-show manual location input if geolocation fails after initial attempt
  useEffect(() => {
    if (locationError && !locationCoords && !showLocationInput) {
      // Wait a bit before suggesting manual input to avoid being too aggressive
      const timer = setTimeout(() => {
        if (locationError && !locationCoords) {
          setShowLocationInput(true);
          setManualLocation('');
        }
      }, 3000); // 3 seconds delay

      return () => clearTimeout(timer);
    }
  }, [locationError, locationCoords, showLocationInput]);

  // Fetch restaurants when filters, location, or pagination changes
  useEffect(() => {
    if (location || locationCoords) {
      debouncedFetchRestaurants();
    }
  }, [location, locationCoords, filters, sortBy, pagination.page, debouncedFetchRestaurants]);

  // Format delivery time in minutes to a readable string
  const formatDeliveryTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'} w-4 h-4`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Render price range indicators
  const renderPriceRange = (priceRange) => {
    const priceLevels = priceRange?.length || 0;
    return (
      <div className="flex">
        {[1, 2, 3, 4].map((level) => (
          <FiDollarSign
            key={level}
            className={`${level <= priceLevels ? 'text-green-600' : 'text-gray-300'} w-3 h-3`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Location Services Tip */}
      {!locationCoords && !locationError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <FiMapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Enable Location Services</p>
              <p className="mt-1">
                Allow location access to find restaurants near you, or enter your address manually below.
                This helps us show you the most relevant results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {/* Cart Indicator */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Meal</h1>
          <div className="relative">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-3 text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg"
              title="View Cart"
            >
              <FiShoppingCart className="h-6 w-6" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for restaurants or cuisines"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative flex-1" ref={locationInputRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMapPin className="text-gray-400" />
            </div>
            
            {/* Location Input */}
            <div className="flex items-center">
              <input
                type="text"
                className="block w-full pl-10 pr-32 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter delivery address"
                value={showLocationInput ? manualLocation : location}
                onChange={(e) => showLocationInput ? handleLocationInputChange(e.target.value) : handleLocationChange(e)}
                onFocus={() => setShowLocationInput(true)}
              />
              
              {/* Action Buttons */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-2">
                {/* Current Location Button */}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap px-2 py-1 rounded hover:bg-blue-50"
                  disabled={loadingLocation}
                  title="Use my current location"
                >
                  {loadingLocation ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiNavigation className="w-4 h-4" />
                  )}
                </button>
                
                {/* Manual Location Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationInput(!showLocationInput);
                    if (!showLocationInput) {
                      setManualLocation(location);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded hover:bg-gray-50"
                  title={showLocationInput ? "Use saved location" : "Enter location manually"}
                >
                  {showLocationInput ? "Saved" : "Manual"}
                </button>
              </div>
            </div>
            
            {/* Location Error Display */}
            {locationError && (
              <div className="mt-1 text-sm text-red-600">
                <div className="flex items-center">
                  <FiX className="w-4 h-4 mr-1" />
                  {locationError}
                </div>
                {locationError.includes('Click "Try Again"') && (
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={retryGeolocation}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loadingLocation}
                    >
                      {loadingLocation ? (
                        <FiLoader className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        'Try Again'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationError('');
                        setShowLocationInput(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Enter Manually
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Manual Location Input */}
            {showLocationInput && (
              <div className="mt-2">
                <div className="mb-2 text-xs text-gray-600">
                  💡 Enter your city, state, or zip code to find restaurants in that area
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city, state, or zip code"
                    value={manualLocation}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleManualLocationSubmit}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Set Location
                  </button>
                </div>
                
                {/* Location Suggestions */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleManualLocationSelect(suggestion)}
                      >
                        <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                        <div className="text-sm text-gray-500">{suggestion.count} restaurants available</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Original Location Suggestions (for non-manual mode) */}
            {!showLocationInput && showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    <div className="font-medium">{suggestion.name || suggestion.formattedAddress}</div>
                    {suggestion.vicinity && (
                      <div className="text-sm text-gray-500">{suggestion.vicinity}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="mt-4">
        {/* Filters Toggle Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="h-5 w-5 mr-2 text-gray-400" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters Dropdown */}
        {showFilters && (
          <div ref={filterRef} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Filters</h3>
            
            {/* Cuisine Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cuisine</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'American', 'Thai', 'Mediterranean'].map((cuisine) => (
                  <label key={cuisine} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="cuisine"
                      value={cuisine}
                      checked={filters.cuisine.includes(cuisine)}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
              <div className="flex space-x-4">
                {['$', '$$', '$$$', '$$$$'].map((price) => (
                  <label key={price} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="priceRange"
                      value={price}
                      checked={filters.priceRange.includes(price)}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h4>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, minRating: star }))}
                    className={`p-1 ${filters.minRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FiStar className="h-5 w-5 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                </span>
              </div>
            </div>

            {/* Delivery Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Max Delivery Time</h4>
              <div className="flex items-center">
                <FiClock className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="range"
                  name="maxDeliveryTime"
                  min="15"
                  max="120"
                  step="15"
                  value={filters.maxDeliveryTime}
                  onChange={handleFilterChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Up to {filters.maxDeliveryTime} min
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Recommended For You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">{rec.dishName}:</span> {rec.reason}
                    </p>
                    {rec.restaurant && (
                      <p className="text-xs text-blue-600 mt-1">From {rec.restaurant}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Dishes */}
      {popularDishes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Dishes Near You</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {popularDishes.map((dish, index) => (
              <div 
                key={dish._id || index} 
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => {
                  // Navigate to restaurant page or scroll to the restaurant
                  const restaurant = restaurants.find(r => r._id === dish.restaurantId);
                  if (restaurant) {
                    const element = document.getElementById(`restaurant-${restaurant._id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      // Add highlight effect
                      element.classList.add('ring-2', 'ring-blue-500');
                      setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-blue-500');
                      }, 2000);
                    }
                  }
                }}
              >
                <div className="relative pt-[100%]">
                  <img 
                    src={dish.image || DEFAULT_DISH_IMAGE} 
                    alt={dish.name} 
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_DISH_IMAGE;
                    }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{dish.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {restaurants.find(r => r._id === dish.restaurantId)?.name || ''}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-900">${dish.price?.toFixed(2)}</span>
                    {dish.rating && (
                      <div className="flex items-center">
                        <FiStar className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                        <span className="text-xs text-gray-600">{dish.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurants List */}
      <div className="mt-8">
        {/* Location Status Indicator */}
        {locationCoords && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiMapPin className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Searching near: <span className="font-semibold">{location}</span>
                  </p>
                  <p className="text-xs text-blue-700">
                    {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={getCurrentLocation}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingLocation}
                >
                  {loadingLocation ? (
                    <FiLoader className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <FiNavigation className="w-3 h-3 mr-1" />
                  )}
                  Update Location
                </button>
                <button
                  onClick={() => setShowLocationInput(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Change Location
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            {restaurants.length > 0 ? 'Restaurants Near You' : 'No Restaurants Found'}
          </h2>
          
          {restaurants.length > 0 && (
            <div className="flex items-center w-full sm:w-auto">
              <label htmlFor="sort-by" className="text-sm text-gray-500 mr-2 whitespace-nowrap">Sort by:</label>
              <select 
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full sm:w-48 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="recommended">Recommended</option>
                <option value="rating-desc">Rating: High to Low</option>
                <option value="delivery-asc">Delivery Time</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant._id}
                id={`restaurant-${restaurant._id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                {restaurant.isTrending && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    Trending
                  </div>
                )}
                
                <div className="relative pt-[56.25%] bg-gray-100">
                  <img 
                    src={restaurant.image || DEFAULT_RESTAURANT_IMAGE}
                    alt={restaurant.name}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_RESTAURANT_IMAGE;
                    }}
                  />
                  {restaurant.isOpen === false && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-white text-red-600 text-sm font-medium px-3 py-1 rounded-full">
                        Closed Now
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                    {restaurant.rating && (
                      <div className="flex items-center bg-green-50 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                        <FiStar className="h-3 w-3 mr-1 fill-current" />
                        {restaurant.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <FiClock className="h-4 w-4 mr-1" />
                    {restaurant.estimatedDeliveryTime ? `${restaurant.estimatedDeliveryTime} min` : 'N/A'}
                    {restaurant.distance && (
                      <span className="ml-2 flex items-center">
                        <FiMapPin className="h-3 w-3 mr-1" />
                        {restaurant.distanceKm ? `${restaurant.distanceKm.toFixed(1)} km` : 
                         restaurant.distanceMiles ? `${restaurant.distanceMiles.toFixed(1)} mi` : 
                         restaurant.distance ? `${(restaurant.distance / 1000).toFixed(1)} km` : 'N/A'}
                      </span>
                    )}
                  </div>
                  
                  {restaurant.cuisines?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {restaurant.cuisines.slice(0, 3).map((cuisine, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {cuisine}
                        </span>
                      ))}
                      {restaurant.cuisines.length > 3 && (
                        <span className="text-xs text-gray-500">+{restaurant.cuisines.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {restaurant.priceRange && (
                          <span className="text-sm text-gray-900">
                            {Array(restaurant.priceRange.length).fill('$').join('')}
                          </span>
                        )}
                        {restaurant.priceRange && restaurant.deliveryFee !== undefined && (
                          <span className="mx-2 text-gray-300">•</span>
                        )}
                        {restaurant.deliveryFee !== undefined && (
                          <span className="text-sm text-gray-600">
                            {restaurant.deliveryFee === 0 ? 'Free delivery' : `${restaurant.deliveryFee.toFixed(2)} delivery`}
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        View Menu
                      </button>
                    </div>
                  </div>
                  
                  {restaurant.popularItems?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Popular Items:</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.popularItems.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No restaurants found nearby</h3>
            <p className="mt-1 text-sm text-gray-500">
              {locationCoords 
                ? `No restaurants found within 10km of your location. Try expanding your search area or changing your location.`
                : 'No restaurants found for your search criteria. Try adjusting your search or location.'
              }
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {locationCoords && (
                <>
                  <button
                    onClick={() => {
                      // Expand search radius
                      fetchNearbyRestaurants(locationCoords, 25000); // 25km
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiMapPin className="w-4 h-4 mr-2" />
                    Expand Search Area
                  </button>
                  <button
                    onClick={() => setShowLocationInput(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <FiMapPin className="w-4 h-4 mr-2" />
                    Change Location
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    cuisine: [],
                    priceRange: [],
                    minRating: 0,
                    maxDeliveryTime: 60
                  });
                  debouncedFetchRestaurants();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      pagination.page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSearch;