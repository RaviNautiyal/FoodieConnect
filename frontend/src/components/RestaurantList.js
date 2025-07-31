
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Clock, ChefHat, Search, Filter, ArrowRight } from 'lucide-react';
import axios from 'axios';
const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
 


  useEffect(() => {
    // Simulate API call
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        // Replace this with your actual axios call:
        const response = await axios.get('http://localhost:5000/api/restaurants');
        setRestaurants(response.data);
        
       
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []); // mockRestaurants is now outside component, so no dependency needed

  // Filter restaurants based on search and cuisine
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || 
                          (restaurant.cuisine && restaurant.cuisine.toLowerCase() === selectedCuisine.toLowerCase());
    return matchesSearch && matchesCuisine;
  });

  // Get unique cuisines for filter
  const cuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];

  const handleRestaurantClick = (restaurantId) => {
    // Replace with your actual navigation:
    // navigate(`/restaurants/${restaurantId}`);
    alert(`Navigate to restaurant ${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading delicious restaurants...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <ChefHat className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
              Discover Amazing Restaurants
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Explore the finest dining experiences in your area. From cozy cafes to elegant fine dining.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-orange-100">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search restaurants or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
              
              {/* Cuisine Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white min-w-[180px]"
                >
                  <option value="all">All Cuisines</option>
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-600 text-lg">
            Found <span className="font-semibold text-orange-600">{filteredRestaurants.length}</span> amazing restaurants
          </p>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((restaurant, index) => (
            <div
              key={restaurant._id}
              onClick={() => handleRestaurantClick(restaurant._id)}
              className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 100}ms both`
              }}
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-orange-200">
                {/* Restaurant Image */}
                <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-white/80" />
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-800">
                      {restaurant.rating}
                    </span>
                  </div>

                  {/* Delivery Time Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white rounded-full px-3 py-1 text-sm font-medium">
                    {restaurant.deliveryTime} min
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-200 mb-2">
                      {restaurant.name}
                    </h3>
                    <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      {restaurant.cuisine}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                      <span className="text-sm">{restaurant.address}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-orange-500" />
                      <span className="text-sm">Delivery in {restaurant.deliveryTime} mins</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl text-center font-semibold group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2">
                      View Menu
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredRestaurants.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No restaurants found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantList;