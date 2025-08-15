// setup-mobile.js - Run this to set up mobile access
const os = require('os');
const fs = require('fs');
const path = require('path');

function setupMobileAccess() {
  console.log('🔧 Setting up Mobile Access for FoodieConnect\n');
  
  // Get network interfaces
  const interfaces = os.networkInterfaces();
  const localIPs = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        localIPs.push({
          name: name,
          address: interface.address,
          netmask: interface.netmask
        });
      }
    }
  }
  
  if (localIPs.length === 0) {
    console.log('❌ No local network interfaces found!');
    console.log('Make sure you are connected to a WiFi network.');
    return;
  }
  
  console.log('📱 Found these network interfaces:');
  localIPs.forEach((ip, index) => {
    console.log(`${index + 1}. ${ip.name}: ${ip.address}`);
  });
  
  // Recommend the first non-localhost IP
  const recommendedIP = localIPs.find(ip => !ip.address.startsWith('127.'));
  
  if (recommendedIP) {
    console.log(`\n✅ Recommended IP: ${recommendedIP.address}`);
    
    // Update the config file
    const configPath = path.join(__dirname, 'frontend', 'src', 'config', 'config.js');
    
    try {
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // Replace the IP address in the config
      const newIP = recommendedIP.address;
      configContent = configContent.replace(
        /return 'http:\/\/192\.168\.1\.11:5000'/g,
        `return 'http://${newIP}:5000'`
      );
      configContent = configContent.replace(
        /return 'http:\/\/192\.168\.1\.11:3000'/g,
        `return 'http://${newIP}:3000'`
      );
      
      fs.writeFileSync(configPath, configContent);
      
      console.log(`\n🔧 Updated config.js with IP: ${newIP}`);
      console.log('\n📋 Next steps:');
      console.log('1. Make sure your phone is on the same WiFi network');
      console.log('2. Restart the backend server:');
      console.log('   cd backend && npm start');
      console.log('3. Restart the frontend server:');
      console.log('   cd frontend && npm start');
      console.log('4. Access from mobile:');
      console.log(`   Frontend: http://${newIP}:3000`);
      console.log(`   Backend: http://${newIP}:5000`);
      
    } catch (error) {
      console.log('❌ Error updating config file:', error.message);
      console.log('Please manually update the IP address in frontend/src/config/config.js');
    }
    
  } else {
    console.log('\n❌ No suitable network IP found!');
    console.log('Please check your network connection.');
  }
}

setupMobileAccess();
