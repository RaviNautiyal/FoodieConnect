// backend/routes/restaurants.js
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Get all restaurants (public)
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurants owned by current user
router.get('/dashboard', auth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby restaurants by user location
router.get('/nearby', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 5000,
      cuisine,
      priceRange,
      minRating,
      maxDeliveryTime,
      isOpenNow,
      sortBy = 'distance',
      page = 1,
      limit = 10
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const match = {};
    if (cuisine) match.cuisine = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
    if (priceRange) match.priceRange = { $in: Array.isArray(priceRange) ? priceRange : [priceRange] };
    if (minRating) match.rating = { $gte: parseFloat(minRating) };
    if (maxDeliveryTime) match.estimatedDeliveryTime = { $lte: parseInt(maxDeliveryTime) };
    if (isOpenNow === 'true') match.isOpen = true;

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: 'distanceMeters',
          maxDistance: parseInt(radius),
          spherical: true
        }
      },
      { $match: match },
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
          distance: { $divide: ['$distanceMeters', 1609.34] },
          distanceMiles: { $divide: ['$distanceMeters', 1609.34] },
          distanceKm: { $divide: ['$distanceMeters', 1000] }
        }
      }
    ];

    let sortOptions = {};
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
    pipeline.push({ $sort: sortOptions });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const restaurants = await Restaurant.aggregate(pipeline);
    res.json(restaurants);
  } catch (error) {
    if (error.code === 2 || error.name === 'MongoError') {
      return res.status(500).json({ message: 'Geospatial query failed. Ensure all restaurants have a valid address.location GeoJSON Point and a 2dsphere index.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single restaurant
router.get('/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Check if user owns this restaurant or if it's a public restaurant
    const isOwner = restaurant.owner.toString() === req.user._id.toString();
    
    // If user is not the owner, only return public information
    if (!isOwner) {
      const publicRestaurant = {
        _id: restaurant._id,
        name: restaurant.name,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        rating: restaurant.rating,
        isOpen: restaurant.isOpen,
        deliveryFee: restaurant.deliveryFee,
        minimumOrder: restaurant.minimumOrder
      };
      return res.json(publicRestaurant);
    }
    
    // If user is the owner, return full restaurant data
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    console.log(`Fetching menu for restaurant ID: ${req.params.id}`);
    
    // First, verify the restaurant exists
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      console.log(`Restaurant with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Then find menu items for this restaurant
    const menuItems = await MenuItem.find({ restaurantId: req.params.id });
    console.log(`Found ${menuItems.length} menu items for restaurant ${req.params.id}`);
    
    res.json(menuItems);
  } catch (error) {
    console.error('Error in /:id/menu route:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query
    });
    res.status(500).json({ 
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Create menu item for a restaurant
router.post('/:id/menu', auth, async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, isVegetarian, isVegan, isGlutenFree } = req.body;
    
    // Verify the restaurant exists and user owns it
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this restaurant' });
    }
    
    // Map the frontend category to the model's expected values
    const categoryMap = {
      'Appetizers': 'appetizer',
      'Main Course': 'main',
      'Desserts': 'dessert',
      'Beverages': 'beverage',
      'Sides': 'main',
      'Salads': 'appetizer',
      'Soups': 'appetizer'
    };
    
    const mappedCategory = categoryMap[category] || 'main';
    
    const menuItem = new MenuItem({
      name,
      description,
      price: Math.min(price, 10000), // Ensure price doesn't exceed max
      category: mappedCategory,
      restaurant: req.params.id, // Use 'restaurant' field, not 'restaurantId'
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isVeg: isVegetarian || false, // Use 'isVeg' field as per model
      isVegan: isVegan || false,
      isGlutenFree: isGlutenFree || false
    });
    
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item for a restaurant
router.put('/:id/menu/:itemId', auth, async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, isVegetarian, isVegan, isGlutenFree } = req.body;
    
    // Verify the restaurant exists and user owns it
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this restaurant' });
    }
    
    // Map the frontend category to the model's expected values
    const categoryMap = {
      'Appetizers': 'appetizer',
      'Main Course': 'main',
      'Desserts': 'dessert',
      'Beverages': 'beverage',
      'Sides': 'main',
      'Salads': 'appetizer',
      'Soups': 'appetizer'
    };
    
    const mappedCategory = categoryMap[category] || 'main';
    
    // Find and update the menu item
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.itemId, restaurant: req.params.id }, // Use 'restaurant' field
      {
        name,
        description,
        price: Math.min(price, 10000), // Ensure price doesn't exceed max
        category: mappedCategory,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isVeg: isVegetarian || false, // Use 'isVeg' field
        isVegan: isVegan || false,
        isGlutenFree: isGlutenFree || false
      },
      { new: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item from a restaurant
router.delete('/:id/menu/:itemId', auth, async (req, res) => {
  try {
    // Verify the restaurant exists and user owns it
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this restaurant' });
    }
    
    // Find and delete the menu item
    const menuItem = await MenuItem.findOneAndDelete({ 
      _id: req.params.itemId, 
      restaurant: req.params.id // Use 'restaurant' field
    });
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create restaurant
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('cuisine', 'At least one cuisine type is required').isArray({ min: 1 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, cuisine, address, phone, email, openingHours } = req.body;
    
    // Create new restaurant
    const restaurant = new Restaurant({
      name,
      description,
      cuisine,
      address,
      phone,
      email,
      openingHours,
      owner: req.user._id
    });

    await restaurant.save();

    // Create default categories for the restaurant
    const defaultCategories = [
      { name: 'Appetizers', description: 'Delicious starters to begin your meal' },
      { name: 'Main Course', description: 'Hearty and satisfying main dishes' },
      { name: 'Desserts', description: 'Sweet treats to end your meal' },
      { name: 'Beverages', description: 'Refreshing drinks to complement your meal' }
    ];

    const createdCategories = await Category.insertMany(
      defaultCategories.map(category => ({
        ...category,
        restaurant: restaurant._id,
        isActive: true
      }))
    );

    // Add categories to the restaurant
    restaurant.categories = createdCategories.map(cat => cat._id);
    await restaurant.save();

    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ 
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    });
  }
});

// Update restaurant
router.put('/:id', [auth, 
  check('name', 'Name is required').not().isEmpty(),
  check('cuisine', 'Cuisine is required').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Make sure user owns the restaurant
    console.log('Backend authorization check:', {
      currentUserId: req.user._id,
      restaurantOwnerId: restaurant.owner,
      userIdType: typeof req.user._id,
      ownerIdType: typeof restaurant.owner,
      isEqual: restaurant.owner.toString() === req.user._id.toString()
    });
    
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update restaurant fields
    restaurant.name = req.body.name;
    restaurant.address = req.body.address;
    restaurant.cuisine = req.body.cuisine;
    restaurant.description = req.body.description;

    await restaurant.save();
    
    console.log('Restaurant updated successfully:', restaurant._id);
    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete restaurant
router.delete('/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    // Make sure user owns the restaurant
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete menu items first
    await MenuItem.deleteMany({ restaurant: req.params.id });
    
    // Delete restaurant using deleteOne()
    await Restaurant.deleteOne({ _id: restaurant._id });
    
    res.json({ message: 'Restaurant removed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;