// backend/seed.js
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');

const seedData = async () => {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodOrdering');

    // Clear existing data
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});

    // Seed Users
    const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8')).map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 10), // Hash passwords
    }));
    const users = await User.insertMany(usersData);
    const userIds = users.map(user => user._id);

    // Seed Restaurants
    const restaurantsData = JSON.parse(fs.readFileSync('./data/restaurants.json', 'utf-8'));
    const restaurants = await Restaurant.insertMany(restaurantsData);
    const restaurantIds = restaurants.map(restaurant => restaurant._id);

    // Seed MenuItems with restaurantId
    const menuItemsData = JSON.parse(fs.readFileSync('./data/menuItems.json', 'utf-8')).map((item, index) => ({
      ...item,
      restaurantId: restaurantIds[index % restaurantIds.length], // Assign restaurantId cyclically
    }));
    const menuItems = await MenuItem.insertMany(menuItemsData);
    const menuItemIds = menuItems.map(item => item._id);

    // Seed Orders with userId and menuItemId
    const ordersData = JSON.parse(fs.readFileSync('./data/orders.json', 'utf-8')).map((order, index) => ({
      ...order,
      userId: userIds[index % userIds.length], // Assign userId cyclically
      items: order.items.map((item, i) => ({
        ...item,
        menuItemId: menuItemIds[i % menuItemIds.length], // Assign menuItemId cyclically
      })),
    }));
    await Order.insertMany(ordersData);

    console.log('Data seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();