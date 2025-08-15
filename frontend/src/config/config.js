// frontend/src/config/config.js

// Backend configuration for mobile access
export const config = {
  // Get the backend URL dynamically based on current location
  getBackendUrl: () => {
    // If running on localhost, use computer's IP address
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Try to get the computer's IP from the current network
      // You can manually set this to your computer's IP address
      return 'http://192.168.1.11:5000'; // Replace with your actual IP
    }
    
    // If already on a network IP, use the same network for backend
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    const backendPort = '5000';
    
    // Extract IP from current hostname (e.g., 192.168.1.11 from 192.168.1.11:3000)
    if (currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${currentHost}:${backendPort}`;
    }
    
    // Fallback to localhost
    return 'http://localhost:5000';
  },
  
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
