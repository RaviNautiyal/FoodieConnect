const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// ===== Ensure uploads directory exists =====
const uploadsDir = path.join(__dirname, 'uploads/restaurants');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}



// Allow all origins
app.use(cors({
  origin: "*",   // any domain can access
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // allowed methods
  allowedHeaders: ["Content-Type", "Authorization"],   // allowed headers
}));


// ===== Middleware =====
app.use(express.json());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodOrdering')
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((error) => console.error('MongoDB connection error:', error));

// ===== Routes =====
app.get("/", (req, res) => {
  res.send("🍽️ FoodieConnect Backend is running!");
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/management/restaurants', require('./routes/restaurant-management'));
app.use('/api/dashboard', require('./routes/restaurantDashboard'));
app.use('/api/search', require('./routes/search'));

// ===== Error handling =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ===== 404 handler =====
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ===== Start server =====
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible from any network interface`);
  console.log(`Mobile devices can access: http://YOUR_IP:${port}`);
});
