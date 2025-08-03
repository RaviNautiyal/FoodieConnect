const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');

// @route   GET /api/restaurants/:restaurantId/categories
// @desc    Get all categories for a restaurant
// @access  Public
router.get('/:restaurantId/categories', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Get active categories for the restaurant
    const categories = await Category.find({
      restaurant: restaurantId,
      isActive: true
    }).select('-__v');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    });
  }
});

// @route   POST /api/restaurants/:restaurantId/categories
// @desc    Create a new category
// @access  Private (Restaurant Owner/Admin)
router.post(
  '/:restaurantId/categories',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { name, description } = req.body;
      
      // Check if restaurant exists and user is the owner
      const restaurant = await Restaurant.findOne({
        _id: restaurantId,
        owner: req.user.id
      });
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
      }
      
      // Check if category with same name already exists for this restaurant
      let category = await Category.findOne({
        restaurant: restaurantId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
      
      if (category) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      
      // Create new category
      category = new Category({
        name,
        description,
        restaurant: restaurantId
      });
      
      await category.save();
      
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ 
        message: 'Server error',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message 
        })
      });
    }
  }
);

module.exports = router;
