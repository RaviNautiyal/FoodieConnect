const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/restaurants/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Create a new restaurant with image upload
router.post('/', [
  auth,
  upload.single('image'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('cuisine', 'Cuisine is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('openingHours', 'Opening hours are required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, address, cuisine, description, openingHours } = req.body;
    
    const restaurantData = {
      name,
      address,
      cuisine,
      description,
      openingHours,
      owner: req.user.id
    };

    if (req.file) {
      restaurantData.image = `/uploads/restaurants/${req.file.filename}`;
    }

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    
    res.status(201).json({ 
      message: 'Restaurant created successfully',
      restaurant 
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Server error during restaurant creation' });
  }
});

// Add Category
router.post('/:restaurantId/categories', [
  auth,
  [
    check('name', 'Category name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user owns the restaurant
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add categories to this restaurant' });
    }

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      restaurant: req.params.restaurantId
    });

    await category.save();
    res.status(201).json({ message: 'Category added successfully', category });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error adding category' });
  }
});

// Add Menu Item
router.post('/:restaurantId/menu', [
  auth,
  upload.single('image'),
  [
    check('name', 'Item name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('price', 'Valid price is required').isNumeric(),
    check('category', 'Category ID is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user owns the restaurant
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add menu items to this restaurant' });
    }

    const { name, description, price, category, isVeg, isAvailable = true } = req.body;
    
    const menuItemData = {
      name,
      description,
      price,
      category,
      restaurant: req.params.restaurantId,
      isVeg: isVeg === 'true',
      isAvailable: isAvailable === 'true'
    };

    if (req.file) {
      menuItemData.image = `/uploads/restaurants/menu/${req.file.filename}`;
    }

    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();

    res.status(201).json({ 
      message: 'Menu item added successfully',
      menuItem 
    });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Server error adding menu item' });
  }
});

// Update restaurant details with image upload
router.put('/:id', [
  auth,
  upload.single('image')
], async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Make sure user owns the restaurant
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, address, cuisine, description, openingHours, isActive } = req.body;
    
    // Update fields if they exist in the request
    if (name) restaurant.name = name;
    if (address) restaurant.address = address;
    if (cuisine) restaurant.cuisine = cuisine;
    if (description) restaurant.description = description;
    if (openingHours) restaurant.openingHours = openingHours;
    if (isActive !== undefined) restaurant.isActive = isActive;
    
    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (restaurant.image) {
        const oldImagePath = path.join(__dirname, '..', '..', restaurant.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      restaurant.image = `/uploads/restaurants/${req.file.filename}`;
    }
    restaurant.cuisine = req.body.cuisine || restaurant.cuisine;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Add menu item
router.post('/:id/menu', [auth, 
  check('name', 'Name is required').not().isEmpty(),
  check('price', 'Price is required').not().isEmpty()
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

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const menuItem = new MenuItem({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      restaurantId: req.params.id
    });

    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Update menu item
router.put('/:id/menu/:menuId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const menuItem = await MenuItem.findById(req.params.menuId);
    
    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    menuItem.name = req.body.name || menuItem.name;
    menuItem.price = req.body.price || menuItem.price;
    menuItem.description = req.body.description || menuItem.description;

    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Delete menu item
router.delete('/:id/menu/:menuId', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const menuItem = await MenuItem.findById(req.params.menuId);
    
    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    await menuItem.remove();
    res.json({ msg: 'Menu item removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
