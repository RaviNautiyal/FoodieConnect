const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add a virtual for menu items in this category
categorySchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category'
});

// Index for faster querying
categorySchema.index({ restaurant: 1, name: 1 }, { unique: true });

// Middleware to update the updatedAt timestamp
categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to handle cascade delete
categorySchema.pre('remove', async function(next) {
  try {
    // Set all menu items in this category to inactive instead of deleting
    await mongoose.model('MenuItem').updateMany(
      { category: this._id },
      { $set: { isAvailable: false } }
    );
    next();
  } catch (err) {
    next(err);
  }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
