// frontend/src/config/config.js
export const config = {
  getBackendUrl: () => {
    if (process.env.NODE_ENV === 'production') {
      // Always point to Render backend in production
      return 'https://foodieconnect.onrender.com/api';
    }

    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://192.168.1.11:5000/api'; // Replace with your local backend IP
    }

    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${hostname}:5000/api`;
    }

    return 'http://localhost:5000/api';
  }
,
  
  // Get the frontend URL dynamically
  getFrontendUrl: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://192.168.1.11:3000'; // Replace with your actual IP
    }
    
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    if (currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${currentHost}:${currentPort}`;
    }
    
    return 'http://localhost:3000';
  },
  
  // Static configuration (for reference)
  BACKEND_PORT: 5000,
  FRONTEND_PORT: 3000
};

export default config;
