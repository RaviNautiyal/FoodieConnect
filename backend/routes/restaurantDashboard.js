// backend/routes/restaurantDashboard.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// Middleware to check restaurant role
function requireRestaurant(req, res, next) {
  if (!req.user || req.user.role !== 'restaurant') {
    return res.status(403).json({ message: 'Access denied: Restaurant only' });
  }
  next();
}

// Get restaurant profile & menu
router.get('/dashboard', auth, requireRestaurant, async (req, res) => {
  try {
    const restaurant = await User.findById(req.user._id).select('-password -refreshToken');
    const menu = await MenuItem.find({ restaurantId: req.user._id });
    res.json({ restaurant, menu });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create menu item
router.post('/menu', auth, requireRestaurant, async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable, isVegetarian, isVegan, isGlutenFree, allergens, preparationTime, calories, tags } = req.body;
    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      restaurantId: req.user._id,
      image,
      isAvailable,
      isVegetarian,
      isVegan,
      isGlutenFree,
      allergens,
      preparationTime,
      calories,
      tags
    });
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item
router.put('/menu/:id', auth, requireRestaurant, async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user._id },
      req.body,
      { new: true }
    );
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item
router.delete('/menu/:id', auth, requireRestaurant, async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user._id });
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories for this restaurant
router.get('/categories', auth, requireRestaurant, async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category', { restaurantId: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ... (Image upload will be added next) ...

module.exports = router; 