// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
// const { auth } = require('../middleware/auth');

// Temporarily remove auth middleware to test server
router.post('/', async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    const menuItems = await MenuItem.find({ _id: { $in: items.map(item => item.id) } });
    const totalAmount = items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.id);
      return total + (menuItem.price * item.quantity);
    }, 0);
    const order = new Order({
      userId: req.user?._id || 'temp_user_id', // Temporary user ID
      items,
      totalAmount,
      deliveryAddress,
      status: 'Pending',
    });
    await order.save();

    res.status(201).json({ orderId: order._id });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;