// backend/models/MenuItem.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price seems too high']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant reference is required'],
    index: true
  },
  image: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  isVeg: {
    type: Boolean,
    default: false,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  isChefSpecial: {
    type: Boolean,
    default: false
  },
  preparationTime: {
    type: Number,
    min: 0,
    max: 240,
    default: 15
  },
  calories: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  numberOfRatings: {
    type: Number,
    default: 0
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);