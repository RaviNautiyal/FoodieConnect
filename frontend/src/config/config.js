// frontend/src/config/config.js

export const config = {
  // Static backend URL (used directly in AuthContext, CartContext, etc.)
  BACKEND_URL:
    process.env.NODE_ENV === 'production'
      ? 'https://foodieconnect.onrender.com' // Render backend for production
      : (window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1')
        ? 'http://192.168.1.11:5000/api' // Replace with your local backend IP
        : window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
          ? `http://${window.location.hostname}:5000/api`
          : 'http://localhost:5000/api',

  // Function to dynamically get backend URL (optional, for flexible usage)
  getBackendUrl: () => {
    return config.BACKEND_URL;
  },

  // Get the frontend URL dynamically
  getFrontendUrl: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://192.168.1.11:3000'; // Replace with your actual IP if testing on phone
    }

    const currentHost = window.location.hostname;
    const currentPort = window.location.port;

    if (currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${currentHost}:${currentPort}`;
    }

    return 'http://localhost:3000';
  },

  // Static reference ports
  BACKEND_PORT: 5000,
  FRONTEND_PORT: 3000
};

export default config;
