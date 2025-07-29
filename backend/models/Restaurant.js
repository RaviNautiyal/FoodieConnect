// backend/models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  cuisine: [{
    type: String,
    enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Japanese', 'Thai', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Lebanese', 'Turkish', 'Other']
  }],
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
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  phone: String,
  email: String,
  website: String,
  logo: String,
  coverImage: String,
  images: [String],
  acceptsCash: {
    type: Boolean,
    default: true
  },
  acceptsCard: {
    type: Boolean,
    default: true
  },
  acceptsOnlinePayment: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String,
    enum: ['Free Delivery', 'Fast Delivery', 'Vegetarian Options', 'Vegan Options', 'Gluten-Free Options', 'Halal', 'Kosher', 'Organic', 'Local Ingredients', 'Family Friendly', 'Romantic', 'Business Lunch', 'Late Night', 'Breakfast', 'Lunch', 'Dinner', 'Brunch', 'Desserts', 'Beverages', 'Catering', 'Takeout', 'Dine-in', 'Outdoor Seating', 'Wheelchair Accessible', 'Parking Available']
  }],
  dietaryOptions: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher']
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
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
restaurantSchema.index({ name: 'text', description: 'text' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ isOpen: 1 });
restaurantSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);