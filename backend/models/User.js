// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  role: { type: String, enum: ['customer', 'restaurant', 'admin'], default: 'customer' },
  // Restaurant-specific fields
  restaurantName: { type: String },
  restaurantDescription: { type: String },
  restaurantAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  restaurantPhone: { type: String },
  restaurantImage: { type: String },
  restaurantVerified: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  refreshToken: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  profilePicture: { type: String },
  phoneNumber: { type: String },
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    isDefault: { type: Boolean, default: false }
  }],
  dietaryPreferences: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  }],
  allergens: [{
    type: String,
    enum: ['peanuts', 'tree-nuts', 'milk', 'eggs', 'soy', 'wheat', 'fish', 'shellfish']
  }],
  loyaltyPoints: { type: Number, default: 0 },
  favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user has password (for OAuth users)
userSchema.methods.hasPassword = function() {
  return !!this.password;
};

// Method to get user's default address
userSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

module.exports = mongoose.model('User', userSchema);