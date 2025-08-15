// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Test endpoint to check if models are working
router.get('/test', async (req, res) => {
  try {
    // Test if models can be accessed
    const OrderModel = require('../models/Order');
    const RestaurantModel = require('../models/Restaurant');
    const UserModel = require('../models/User');
    
    res.json({ 
      success: true, 
      message: 'Orders route is working',
      models: {
        Order: !!OrderModel,
        Restaurant: !!RestaurantModel,
        User: !!UserModel
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Test failed',
      error: error.message 
    });
  }
});

// Debug endpoint to check user authentication
router.get('/debug-auth', auth, async (req, res) => {
  try {
    console.log('Debug auth endpoint hit');
    console.log('req.user:', req.user);
    
    // Get full user details from database
    const user = await User.findById(req.user.id);
    console.log('Full user from DB:', user);
    
    // Get restaurants owned by this user
    const restaurants = await Restaurant.find({ owner: req.user.id });
    console.log('Restaurants owned by user:', restaurants.map(r => ({ id: r._id, name: r.name })));
    
    res.json({
      success: true,
      message: 'User authentication debug info',
      user: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      },
      fullUser: user,
      ownedRestaurants: restaurants.map(r => ({ id: r._id, name: r.name, owner: r.owner }))
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in debug auth endpoint',
      error: error.message
    });
  }
});

// Test endpoint to check if order creation works
router.post('/test-create', async (req, res) => {
  try {
    console.log('Testing order creation...');
    console.log('Creating test order without coordinates...');
    
    // Test creating a simple order object
    const testOrder = new Order({
      customer: '507f1f77bcf86cd799439011', // Test ObjectId
      restaurant: '507f1f77bcf86cd799439012', // Test ObjectId
      items: [{
        menuItem: '507f1f77bcf86cd799439013', // Test ObjectId
        name: 'Test Item',
        price: 1000,
        quantity: 1,
        customizations: {},
        specialInstructions: '',
        totalPrice: 1000
      }],
      deliveryDetails: {
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        email: 'test@test.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        deliveryInstructions: ''
      },
      paymentMethod: 'cash',
      orderSummary: {
        subtotal: 1000,
        deliveryFee: 500,
        tax: 100,
        total: 1600
      },
      estimatedDeliveryTime: 45,
      status: 'pending'
    });
    
    console.log('Test order object created, attempting to save...');
    
    // Try to save (this should trigger the pre-save hook)
    await testOrder.save();
    
    console.log('Test order saved successfully!');
    
    // Clean up - delete the test order
    await Order.findByIdAndDelete(testOrder._id);
    
    res.json({ 
      success: true, 
      message: 'Order creation test passed',
      orderId: testOrder._id
    });
  } catch (error) {
    console.error('Order creation test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Order creation test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Create a new order
router.post('/', auth, [
  body('restaurantId').isMongoId().withMessage('Invalid restaurant ID'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItemId').isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryDetails.address').notEmpty().withMessage('Delivery address is required'),
  body('deliveryDetails.city').notEmpty().withMessage('City is required'),
  body('deliveryDetails.state').notEmpty().withMessage('State is required'),
  body('deliveryDetails.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('paymentMethod').isIn(['card', 'cash']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      restaurantId,
      items,
      deliveryDetails,
      paymentMethod,
      cardDetails,
      orderSummary
    } = req.body;

    // Verify restaurant exists
    console.log('Looking for restaurant with ID:', restaurantId);
    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? restaurant.name : 'Not found');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Verify restaurant is open
    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is currently closed'
      });
    }

    // Calculate delivery fee based on distance (simplified)
    let deliveryFee = restaurant.deliveryFee || 500; // Default $5.00
    
    // Calculate estimated delivery time (simplified)
    const estimatedDeliveryTime = restaurant.estimatedDeliveryTime || 45; // Default 45 minutes

    // Create order
    console.log('Creating order with data:', {
      customer: req.user.id,
      restaurant: restaurantId,
      paymentMethod,
      hasCardDetails: !!cardDetails,
      itemsCount: items.length
    });
    
    const order = new Order({
      customer: req.user.id,
      restaurant: restaurantId,
      items: items.map(item => {
        let addonsPrice = 0;
        if (item.customizations?.addons && Array.isArray(item.customizations.addons)) {
          addonsPrice = item.customizations.addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
        }
        
        return {
          menuItem: item.menuItemId || item._id, // Handle both menuItemId and _id
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations || {},
          specialInstructions: item.specialInstructions || '',
          totalPrice: (item.price + addonsPrice) * item.quantity
        };
      }),
      deliveryDetails: {
        ...deliveryDetails
        // coordinates will be set by geocoding service later
      },
      paymentMethod,
      cardDetails: paymentMethod === 'card' && cardDetails ? {
        last4: cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : '',
        brand: 'visa', // Simplified - in production, detect card brand
        expiryMonth: cardDetails.expiryDate ? cardDetails.expiryDate.split('/')[0] : '',
        expiryYear: cardDetails.expiryDate ? cardDetails.expiryDate.split('/')[1] : ''
      } : undefined,
      orderSummary: {
        subtotal: orderSummary.subtotal,
        deliveryFee: deliveryFee,
        tax: orderSummary.tax,
        total: orderSummary.total
      },
      estimatedDeliveryTime,
      status: 'pending'
    });

    // Save order
    console.log('Attempting to save order...');
    await order.save();
    console.log('Order saved successfully with ID:', order._id);

    // Update restaurant order count
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $inc: { totalOrders: 1 }
    });

    // Send notification to restaurant (in production, use real-time notifications)
    // For now, just log it
    console.log(`New order received for restaurant ${restaurant.name}: Order #${order.orderNumber}`);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        total: order.orderSummary.total
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user.id })
      .populate('restaurant', 'name image address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user.id });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get order by ID
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('restaurant', 'name image address phone')
      .populate('customer', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (order.customer._id.toString() !== req.user.id && 
        req.user.role !== 'admin' && 
        req.user.restaurant?.toString() !== order.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Update order status (restaurant/admin only)
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    console.log('Status update request:', {
      orderId: req.params.orderId,
      status,
      reason,
      userId: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email
    });
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found:', {
      orderId: order._id,
      restaurantId: order.restaurant,
      orderStatus: order.status
    });

    // Check if user is authorized to update this order
    // For restaurant users, check if they own the restaurant
    // For admin users, allow all updates
    let isAuthorized = false;
    
    if (req.user.role === 'admin') {
      isAuthorized = true;
      console.log('User is admin, authorized');
    } else if (req.user.role === 'restaurant') {
      // Find if the user owns the restaurant associated with this order
      const userRestaurant = await Restaurant.findOne({ owner: req.user._id });
      console.log('User restaurant lookup:', {
        userId: req.user._id,
        userRestaurant: userRestaurant ? {
          id: userRestaurant._id,
          name: userRestaurant.name
        } : null,
        orderRestaurantId: order.restaurant
      });
      
      if (userRestaurant && userRestaurant._id.toString() === order.restaurant.toString()) {
        isAuthorized = true;
        console.log('User owns the restaurant, authorized');
      } else {
        console.log('User does not own the restaurant');
      }
    }
    
    console.log('Authorization result:', { isAuthorized, userRole: req.user.role });
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update order status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      reason: reason || ''
    });

    await order.save();

    console.log('Order status updated successfully');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        _id: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Cancel order (customer only)
router.patch('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled', 'out_for_delivery'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: req.user.id,
      reason
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        _id: order._id,
        status: order.status,
        cancelledAt: order.cancelledAt
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// Get restaurant orders (restaurant owner only)
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    console.log('Restaurant orders request:');
    console.log('- restaurantId:', req.params.restaurantId);
    console.log('- userId:', req.user.id);
    console.log('- userRole:', req.user.role);

    // Check if user owns this restaurant
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      console.log('- Restaurant not found');
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    console.log('- Restaurant found:', restaurant.name);
    console.log('- Restaurant owner:', restaurant.owner.toString());
    console.log('- User ID:', req.user.id);
    console.log('- Owner match:', restaurant.owner.toString() === req.user.id);

    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('- Authorization failed');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view restaurant orders'
      });
    }

    console.log('- Authorization successful');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { restaurant: req.params.restaurantId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant orders',
      error: error.message
    });
  }
});

module.exports = router;