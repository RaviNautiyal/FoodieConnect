const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { check, validationResult } = require('express-validator');

// Import auth middleware
const { auth } = require('../middleware/auth');

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

// Add menu item to restaurant
router.post('/:restaurantId/menu', [
  auth,
  upload.single('image'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('price', 'Please include a valid price').isNumeric(),
    check('category', 'Category is required').isIn(['appetizer', 'main', 'dessert', 'beverage']),
    check('isVeg', 'isVeg must be a boolean').optional().isBoolean(),
    check('isVegan', 'isVegan must be a boolean').optional().isBoolean(),
    check('isGlutenFree', 'isGlutenFree must be a boolean').optional().isBoolean()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      console.log('Restaurant not found:', req.params.restaurantId);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user owns the restaurant
    if (restaurant.owner.toString() !== req.user.id) {
      console.log('Unauthorized access attempt by user:', req.user.id);
      return res.status(401).json({ message: 'Not authorized to add items to this restaurant' });
    }

    // Parse boolean values from string to boolean
    const isVeg = req.body.isVeg === 'true' || req.body.isVeg === true;
    const isVegan = req.body.isVegan === 'true' || req.body.isVegan === true;
    const isGlutenFree = req.body.isGlutenFree === 'true' || req.body.isGlutenFree === true;
    
    const menuItemFields = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      restaurant: req.params.restaurantId,
      isVeg,
      isVegan,
      isGlutenFree,
      isAvailable: true
    };

    console.log('Creating menu item with fields:', menuItemFields);

    // Handle image upload if present
    if (req.file) {
      const imagePath = `/uploads/restaurants/${req.file.filename}`;
      menuItemFields.image = imagePath;
      console.log('Image uploaded:', imagePath);
    }

    // Create and save the menu item
    const menuItem = new MenuItem(menuItemFields);
    await menuItem.save();
    console.log('Menu item created:', menuItem);

    // Initialize menu array if it doesn't exist
    if (!restaurant.menu) {
      restaurant.menu = [];
    }
    
    // Add menu item to restaurant's menu
    restaurant.menu.push(menuItem._id);
    await restaurant.save();
    console.log('Restaurant menu updated:', restaurant.menu);

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error adding menu item:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params,
      file: req.file
    });
    
    // Clean up uploaded file if there was an error after file upload
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'restaurants', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    }
    
    res.status(500).json({ 
      message: 'Server error adding menu item',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

module.exports = router;
