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
    const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8')).map((user, idx) => {
      const email = user.email || `user${idx + 1}@example.com`;
      const local = email.split('@')[0];
      const [first, last] = local.includes('.') ? local.split('.') : [local, 'user'];
      return {
        firstName: user.firstName || (first.charAt(0).toUpperCase() + first.slice(1)),
        lastName: user.lastName || (last.charAt(0).toUpperCase() + last.slice(1)),
        email,
        password: bcrypt.hashSync(user.password || 'password123', 10),
      };
    });
    const users = await User.insertMany(usersData);
    const userIds = users.map(user => user._id);

    // Seed Restaurants (normalize minimal fields to satisfy schema)
    const rawRestaurants = JSON.parse(fs.readFileSync('./data/restaurants.json', 'utf-8'));
    const restaurantsPayload = rawRestaurants.map((r, idx) => {
      // Parse a simple address string like "123 Main St, City" if provided
      let street = '123 Main St';
      let city = 'City';
      if (typeof r.address === 'string') {
        const parts = r.address.split(',');
        street = (parts[0] || '123 Main St').trim();
        city = (parts[1] || 'City').trim();
      }
      const lng = -74.0060 + (Math.random() * 0.02 - 0.01);
      const lat = 40.7128 + (Math.random() * 0.02 - 0.01);
      return {
        name: r.name || `Restaurant ${idx + 1}`,
        description: r.description || 'Delicious food and great service.',
        address: {
          street,
          city,
          state: r.state || 'NY',
          zipCode: r.zipCode || '10001',
          location: { type: 'Point', coordinates: [lng, lat] },
          formattedAddress: `${street}, ${city}, NY 10001`
        },
        cuisine: r.cuisine && Array.isArray(r.cuisine) ? r.cuisine : ['Italian'],
        rating: r.rating || 4.2,
        deliveryFee: r.deliveryFee ?? 0,
        minimumOrder: r.minimumOrder ?? 0,
        estimatedDeliveryTime: r.estimatedDeliveryTime || Math.floor(20 + Math.random() * 25),
        isOpen: r.isOpen !== undefined ? r.isOpen : true,
        logo: r.logo || r.image || null,
        coverImage: r.coverImage || r.image || null,
        owner: userIds[idx % userIds.length]
      };
    });
    const restaurants = await Restaurant.insertMany(restaurantsPayload);
    const restaurantIds = restaurants.map(restaurant => restaurant._id);

    // Seed MenuItems with correct `restaurant` field and defaults
    const rawMenuItems = JSON.parse(fs.readFileSync('./data/menuItems.json', 'utf-8'));
    const menuItemsPayload = rawMenuItems.map((item, index) => ({
      name: item.name,
      description: item.description || 'Tasty dish you will love.',
      price: item.price || 9.99,
      category: item.category || 'main',
      restaurant: restaurantIds[index % restaurantIds.length],
      image: item.image || null,
      isAvailable: true
    }));
    const menuItems = await MenuItem.insertMany(menuItemsPayload);
    const menuItemIds = menuItems.map(item => item._id);

    // Optionally seed a few simple orders that match schema
    const sampleOrders = users.slice(0, 2).map((u, idx) => ({
      user: u._id,
      items: [
        {
          menuItem: menuItemIds[idx % menuItemIds.length],
          name: menuItems[idx % menuItems.length].name,
          price: menuItems[idx % menuItems.length].price,
          quantity: 1
        }
      ],
      totalAmount: menuItems[idx % menuItems.length].price,
      deliveryAddress: {
        street: '1 Seed St',
        city: 'City',
        state: 'NY',
        zipCode: '10001'
      },
      status: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: 'Cash on Delivery',
      restaurantId: restaurantIds[idx % restaurantIds.length]
    }));
    await Order.insertMany(sampleOrders);

    console.log('Data seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Utility: Fix all restaurants to ensure address.location is a valid GeoJSON Point
if (require.main === module && process.argv.includes('--fix-geo')) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodOrdering');
      const restaurants = await Restaurant.find();
      let updated = 0;
      for (const rest of restaurants) {
        if (!rest.address || !rest.address.location ||
            !Array.isArray(rest.address.location.coordinates) ||
            rest.address.location.coordinates.length !== 2 ||
            isNaN(rest.address.location.coordinates[0]) ||
            isNaN(rest.address.location.coordinates[1])) {
          // Set a default location (0,0) or you can randomize for testing
          rest.address = rest.address || {};
          rest.address.location = {
            type: 'Point',
            coordinates: [0, 0]
          };
          await rest.save();
          updated++;
          console.log(`Updated restaurant ${rest._id} with default location [0,0]`);
        }
      }
      console.log(`GeoJSON fix complete. Updated ${updated} restaurants.`);
      process.exit(0);
    } catch (err) {
      console.error('Error fixing restaurant geo data:', err);
      process.exit(1);
    }
  })();
}

seedData();