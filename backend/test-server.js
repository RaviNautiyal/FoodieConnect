const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Auth test route
app.post('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth endpoint is working!' });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log('Environment variables:');
  console.log('PORT:', process.env.PORT);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set');
}); 