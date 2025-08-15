const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

console.log('Search routes loaded');
console.log('Auth middleware:', {
  auth: typeof auth.auth,
  optionalAuth: typeof auth.optionalAuth
});

/**
 * @route   GET /api/search/restaurants
 * @desc    Search restaurants with filters
 * @access  Public
 */
router.get('/restaurants', async (req, res) => {
  try {
    const {
      query = '',
      location,
      latitude,
      longitude,
      maxDistance = 10000, // Default 10km
      cuisine,
      priceRange,
      minRating = 0,
      maxDeliveryTime,
      isOpenNow,
      sortBy = 'distance',
      page = 1,
      limit = 10
    } = req.query;

    // Build the query
    const queryConditions = {};
    const aggregatePipeline = [];

    // Location-based search - handle this first since it requires special handling with geoNear
    if (latitude && longitude) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      
      // Start with a match stage for text search if query exists
      if (query) {
        aggregatePipeline.push({
          $match: { $text: { $search: query } }
        });
      }
      
      // Add geoNear as the next stage
      aggregatePipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: coordinates
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: {} // We'll handle other query conditions separately
        }
      });
    } else if (location) {
      // If no coordinates but have location text, search by location text
      queryConditions['address.city'] = new RegExp(location, 'i');
    }
    
    // Text search (only if we're not doing geoNear, since we handle that case above)
    if (query && !(latitude && longitude)) {
      queryConditions.$text = { $search: query };
    }

    // Additional filters
    if (cuisine) {
      queryConditions.cuisine = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
    }

    if (priceRange) {
      queryConditions.priceRange = { $in: Array.isArray(priceRange) ? priceRange : [priceRange] };
    }

    if (minRating) {
      queryConditions.rating = { $gte: parseFloat(minRating) };
    }

    // Filter by maximum estimated delivery time (in minutes)
    if (maxDeliveryTime) {
      queryConditions.estimatedDeliveryTime = { $lte: parseInt(maxDeliveryTime) };
    }

    if (isOpenNow === 'true') {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.getHours() * 100 + now.getMinutes();
      
      queryConditions[`operatingHours.${day}.open`] = { $exists: true };
      queryConditions[`operatingHours.${day}.close`] = { $exists: true };
      
      // This is a simplified check - in production, you'd need to handle time parsing better
      queryConditions[`operatingHours.${day}.open`] = { $lte: currentTime };
      queryConditions[`operatingHours.${day}.close`] = { $gte: currentTime };
      queryConditions.isOpen = true;
    }

    // If we didn't add geoNear stage, add a $match stage
    if (!(latitude && longitude)) {
      aggregatePipeline.unshift({ $match: queryConditions });
    }

    // Add projection
    aggregatePipeline.push({
      $project: {
        name: 1,
        description: 1,
        'address.street': 1,
        'address.city': 1,
        'address.state': 1,
        'address.zipCode': 1,
        'address.formattedAddress': 1,
        'address.location': 1,
        cuisine: 1,
        // expose both canonical and friendly aliases
        cuisines: '$cuisine',
        rating: 1,
        priceRange: 1,
        estimatedDeliveryTime: 1,
        deliveryTime: '$estimatedDeliveryTime',
        deliveryFee: 1,
        minimumOrder: 1,
        isOpen: 1,
        logo: 1,
        coverImage: 1,
        // Convert raw distance (meters) to miles for UI convenience
        distance: {
          $ifNull: [
            {
              $divide: [
                { $ifNull: ['$distance', 0] },
                1609.34
              ]
            },
            0
          ]
        },
        // Also provide distance in km
        distanceMiles: {
          $ifNull: [
            {
              $divide: [
                { $ifNull: ['$distance', 0] },
                1609.34 // Convert meters to miles
              ]
            },
            0
          ]
        },
        distanceKm: {
          $ifNull: [
            {
              $divide: [
                { $ifNull: ['$distance', 0] },
                1000 // Convert meters to km
              ]
            },
            0
          ]
        }
      }
    });

    // Sorting
    let sortOptions = {};
    // Accept both backend-native and frontend-friendly sort keys
    switch (sortBy) {
      case 'rating':
      case 'rating-desc':
        sortOptions = { rating: -1 };
        break;
      case 'deliveryTime':
      case 'delivery-asc':
        sortOptions = { estimatedDeliveryTime: 1 };
        break;
      case 'priceLowToHigh':
      case 'price-asc':
        sortOptions = { priceRange: 1 };
        break;
      case 'priceHighToLow':
      case 'price-desc':
        sortOptions = { priceRange: -1 };
        break;
      case 'distance':
      case 'recommended':
      default:
        sortOptions = { distance: 1 };
    }
    aggregatePipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    aggregatePipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Execute the aggregation
    const restaurants = await Restaurant.aggregate(aggregatePipeline);

    // Get total count for pagination
    const countPipeline = [...aggregatePipeline];
    // Remove $skip and $limit stages from count pipeline
    countPipeline.pop(); // Remove $limit
    countPipeline.pop(); // Remove $skip
    countPipeline.push({ $count: 'total' });
    
    const countResult = await Restaurant.aggregate(countPipeline);
    const total = countResult[0] ? countResult[0].total : 0;

    res.json({
      success: true,
      count: restaurants.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: restaurants
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/autocomplete
 * @desc    Get autocomplete suggestions for search
 * @access  Public
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          restaurants: [],
          dishes: []
        }
      });
    }

    // Search for restaurants
    const restaurants = await Restaurant.find(
      { name: { $regex: query, $options: 'i' } },
      { name: 1, 'address.city': 1, 'address.state': 1, logo: 1 }
    ).limit(5);

    // In a real app, you would also search for dishes here
    // const dishes = await MenuItem.find(
    //   { name: { $regex: query, $options: 'i' } },
    //   { name: 1, restaurant: 1, price: 1 }
    // ).populate('restaurant', 'name').limit(5);

    res.json({
      success: true,
      data: {
        restaurants,
        dishes: [] // Placeholder for dishes
      }
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting autocomplete suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/geocode
 * @desc    Geocode an address to get coordinates
 * @access  Public
 */
// Geocode: supports both address (forward) and latlng (reverse)
router.get('/geocode', async (req, res) => {
  const { latlng, address } = req.query;
  if (latlng) {
    try {
      console.log('Received latlng:', latlng);
      const parts = latlng.split(',');
      console.log('Split parts:', parts);
      if (parts.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'latlng must be in the format lat,lng (two comma-separated numbers)'
        });
      }
      const [lat, lng] = parts.map(Number);
      console.log('Parsed lat:', lat, 'lng:', lng);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latlng format. Use lat,lng with valid numbers.'
        });
      }
      // Mock reverse geocode result
      const mockReverseGeocode = {
        lat,
        lng,
        formattedAddress: `Mock Address for (${lat}, ${lng})`,
        placeId: `mock-place-id-${Date.now()}`
      };
      return res.json({
        success: true,
        data: mockReverseGeocode
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error in reverse geocoding',
        error: error.message
      });
    }
  } else if (address) {
    try {
      // Mock geocode result
      const mockGeocode = {
        lat: 40.7128 + (Math.random() * 0.02 - 0.01),
        lng: -74.0060 + (Math.random() * 0.02 - 0.01),
        formattedAddress: `${address}, New York, NY, USA`,
        placeId: `mock-place-id-${Date.now()}`
      };
      return res.json({
        success: true,
        data: mockGeocode
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error in geocoding',
        error: error.message
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either latlng or address query parameter is required.'
    });
  }
});

/**
 * @route   GET /api/search/geolocation
 * @desc    Get user's current location and nearby restaurants
 * @access  Public
 */
router.get('/geolocation', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10000 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    
    // Find restaurants within the specified radius
    const nearbyRestaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: coordinates
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
          query: { isOpen: true } // Only show open restaurants
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          'address.street': 1,
          'address.city': 1,
          'address.state': 1,
          'address.zipCode': 1,
          'address.formattedAddress': 1,
          'address.location': 1,
          cuisine: 1,
          rating: 1,
          priceRange: 1,
          estimatedDeliveryTime: 1,
          deliveryFee: 1,
          minimumOrder: 1,
          isOpen: 1,
          logo: 1,
          coverImage: 1,
          distance: {
            $divide: ['$distance', 1000] // Convert to km
          },
          distanceMiles: {
            $divide: ['$distance', 1609.34] // Convert to miles
          }
        }
      },
      {
        $sort: { distance: 1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json({
      success: true,
      data: {
        userLocation: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        nearbyRestaurants,
        count: nearbyRestaurants.length,
        radius: parseInt(radius)
      }
    });
  } catch (error) {
    console.error('Geolocation search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for nearby restaurants',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/location-suggestions
 * @desc    Get location suggestions based on user input
 * @access  Public
 */
router.get('/location-suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Search for restaurants in cities/states that match the query
    const suggestions = await Restaurant.aggregate([
      {
        $match: {
          $or: [
            { 'address.city': { $regex: query, $options: 'i' } },
            { 'address.state': { $regex: query, $options: 'i' } },
            { 'address.zipCode': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: {
            city: '$address.city',
            state: '$address.state',
            zipCode: '$address.zipCode'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          state: '$_id.state',
          zipCode: '$_id.zipCode',
          count: 1,
          displayName: {
            $concat: [
              '$_id.city',
              ', ',
              '$_id.state',
              ' ',
              '$_id.zipCode'
            ]
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Location suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting location suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/recommendations
 * @desc    Get AI-based food recommendations
 * @access  Private
 */
router.get('/recommendations', auth.auth, async (req, res) => {
  try {
    const { userId } = req;
    
    // In a real app, you would use an AI service to generate recommendations
    // based on the user's order history, preferences, etc.
    // This is a mock implementation
    
    const mockRecommendations = [
      {
        type: 'dish',
        id: 'dish-1',
        name: 'Margherita Pizza',
        restaurant: 'Tasty Bites',
        image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        reason: 'Popular in your area',
        score: 0.92
      },
      {
        type: 'restaurant',
        id: 'rest-1',
        name: 'Sushi House',
        cuisine: ['Japanese', 'Sushi'],
        rating: 4.7,
        deliveryTime: '25-35 min',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        reason: 'Highly rated Japanese cuisine',
        score: 0.88
      }
    ];

    res.json({
      success: true,
      data: mockRecommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message
    });
  }
});

module.exports = router;
