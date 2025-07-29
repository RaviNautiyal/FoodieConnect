const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'FoodieConnect Backend is running!' });
});

// Simple auth test route
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Mock response without database
  res.status(201).json({ 
    message: 'User registered successfully (mock response)',
    user: { firstName, lastName, email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Mock response without database
  res.json({
    message: 'Login successful (mock response)',
    accessToken: 'mock_jwt_token',
    refreshToken: 'mock_refresh_token',
    user: {
      id: 'mock_user_id',
      firstName: 'John',
      lastName: 'Doe',
      email: email,
      fullName: 'John Doe'
    }
  });
});

app.listen(port, () => {
  console.log(`Simple server running on port ${port}`);
  console.log('Environment variables loaded:', {
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set'
  });
}); 