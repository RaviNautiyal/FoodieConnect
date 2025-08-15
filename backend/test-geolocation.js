const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testGeolocationEndpoints() {
  console.log('Testing Geolocation Endpoints...\n');

  try {
    // Test 1: Geocoding an address
    console.log('1. Testing address geocoding...');
    const geocodeResponse = await axios.get(`${API_URL}/search/geocode`, {
      params: { address: 'New York, NY' }
    });
    console.log('✅ Geocoding response:', geocodeResponse.data);

    // Test 2: Location suggestions
    console.log('\n2. Testing location suggestions...');
    const suggestionsResponse = await axios.get(`${API_URL}/search/location-suggestions`, {
      params: { query: 'New York' }
    });
    console.log('✅ Location suggestions response:', suggestionsResponse.data);

    // Test 3: Geolocation search with coordinates
    console.log('\n3. Testing geolocation search...');
    const geolocationResponse = await axios.get(`${API_URL}/search/geolocation`, {
      params: { 
        latitude: 40.7128, 
        longitude: -74.0060,
        radius: 10000 
      }
    });
    console.log('✅ Geolocation search response:', geolocationResponse.data);

    console.log('\n🎉 All geolocation endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Error testing geolocation endpoints:', error.response?.data || error.message);
  }
}

// Run the test
testGeolocationEndpoints();


