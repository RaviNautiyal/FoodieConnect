// find-ip.js - Run this to find your computer's IP address
const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`Network Interface: ${name}`);
        console.log(`IP Address: ${interface.address}`);
        console.log(`Netmask: ${interface.netmask}`);
        console.log(`---`);
      }
    }
  }
  
  console.log('\n📱 To access from mobile devices:');
  console.log('1. Make sure your phone is on the same WiFi network');
  console.log('2. Use the IP address above instead of localhost');
  console.log('3. Update the BACKEND_IP in frontend/src/config/config.js');
  console.log('4. Restart both frontend and backend servers');
}

getLocalIPAddress();
