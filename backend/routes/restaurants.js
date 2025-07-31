// backend/routes/restaurants.js
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
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
    const restaurants = await Restaurant.find({ owner: req.user.id });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single restaurant
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.id });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create restaurant
router.post('/', [auth, 
  check('name', 'Name is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('cuisine', 'Cuisine is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const restaurant = new Restaurant({
      name: req.body.name,
      address: req.body.address,
      cuisine: req.body.cuisine,
      description: req.body.description,
      owner: req.user.id
    });

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Update restaurant
router.put('/:id', [auth, 
  check('name', 'Name is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('cuisine', 'Cuisine is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    // Make sure user owns the restaurant
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    restaurant.name = req.body.name;
    restaurant.address = req.body.address;
    restaurant.cuisine = req.body.cuisine;
    restaurant.description = req.body.description;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
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
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete menu items first
    await MenuItem.deleteMany({ restaurantId: req.params.id });
    
    // Delete restaurant using deleteOne()
    await Restaurant.deleteOne({ _id: restaurant._id });
    
    res.json({ message: 'Restaurant removed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;