const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads/restaurants');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// CORS configuration for mobile access - more permissive
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow all local network origins for development
    const isLocalNetwork = origin.includes('localhost') || 
                          origin.includes('127.0.0.1') ||
                          origin.includes('192.168.') ||
                          origin.includes('10.') ||
                          origin.includes('172.16.') ||
                          origin.includes('172.17.') ||
                          origin.includes('172.18.') ||
                          origin.includes('172.19.') ||
                          origin.includes('172.20.') ||
                          origin.includes('172.21.') ||
                          origin.includes('172.22.') ||
                          origin.includes('172.23.') ||
                          origin.includes('172.24.') ||
                          origin.includes('172.25.') ||
                          origin.includes('172.26.') ||
                          origin.includes('172.27.') ||
                          origin.includes('172.28.') ||
                          origin.includes('172.29.') ||
                          origin.includes('172.30.') ||
                          origin.includes('172.31.');
    
    if (isLocalNetwork) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodOrdering', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas successfully!');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/restaurants', require('./routes/restaurants'));
// Mount restaurant management routes under /api/management/restaurants
app.use('/api/management/restaurants', require('./routes/restaurant-management'));
// Mount restaurant dashboard routes under /api/dashboard
app.use('/api/dashboard', require('./routes/restaurantDashboard'));
// Search and discovery routes
app.use('/api/search', require('./routes/search'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Bind to all network interfaces for mobile access
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible from any network interface`);
  console.log(`Mobile devices can access: http://YOUR_IP:${port}`);
});
