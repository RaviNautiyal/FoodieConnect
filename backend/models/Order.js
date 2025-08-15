// backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    required: false // Will be set by pre-save hook
  },
  
  // Customer and restaurant references
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  // Order items
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    customizations: {
      options: {
        type: Map,
        of: String
      },
      addons: [{
        _id: String,
        name: String,
        price: {
          type: Number,
          default: 0
        }
      }]
    },
    specialInstructions: {
      type: String,
      trim: true
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Delivery details
  deliveryDetails: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    deliveryInstructions: {
      type: String,
      trim: true
    }
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['card', 'cash'],
    required: true
  },
  
  cardDetails: {
    last4: String,
    brand: String,
    expiryMonth: String,
    expiryYear: String
  },
  
  // Order summary
  orderSummary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Order status and tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  
  // Timing information
  estimatedDeliveryTime: {
    type: Number, // in minutes
    required: true,
    min: 0
  },
  
  confirmedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Cancellation details
  cancellationReason: String,
  
  // Restaurant notes
  restaurantNotes: String,
  
  // Customer feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  review: {
    type: String,
    trim: true
  },
  
  reviewedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  try {
    console.log('Pre-save hook triggered for order:', this._id ? 'existing' : 'new');
    console.log('Current orderNumber:', this.orderNumber);
    
    if (this.isNew && !this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Generate a simple order number with timestamp
      const timestamp = Date.now().toString().slice(-6);
      const orderNumber = `ORD${year}${month}${day}${timestamp}`;
      this.orderNumber = orderNumber;
      console.log('Generated order number:', orderNumber);
    }
    
    // Initialize status history if not present
    if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
      this.statusHistory = [{
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.customer
      }];
      console.log('Initialized status history');
    }
    
    console.log('Final orderNumber before save:', this.orderNumber);
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Virtual for order status display
orderSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Order Placed',
    'confirmed': 'Order Confirmed',
    'preparing': 'Preparing Your Food',
    'ready': 'Ready for Pickup',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for estimated delivery time display
orderSchema.virtual('estimatedDeliveryTimeDisplay').get(function() {
  if (!this.estimatedDeliveryTime) return 'TBD';
  
  const hours = Math.floor(this.estimatedDeliveryTime / 60);
  const minutes = this.estimatedDeliveryTime % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, updatedBy, reason = '') {
  this.status = newStatus;
  
  // Set timing fields based on status
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = new Date();
      break;
    case 'preparing':
      this.preparingAt = new Date();
      break;
    case 'ready':
      this.readyAt = new Date();
      break;
    case 'out_for_delivery':
      this.outForDeliveryAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    reason
  });
  
  return this.save();
};

// Method to calculate delivery time
orderSchema.methods.calculateDeliveryTime = function() {
  if (this.deliveredAt && this.confirmedAt) {
    return Math.round((this.deliveredAt - this.confirmedAt) / (1000 * 60)); // in minutes
  }
  return null;
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status, limit = 10) {
  return this.find({ status })
    .populate('customer', 'firstName lastName phone')
    .populate('restaurant', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get orders by date range
orderSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('customer', 'firstName lastName')
    .populate('restaurant', 'name');
};

module.exports = mongoose.model('Order', orderSchema);