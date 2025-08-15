import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RestaurantOrders from './RestaurantOrders';
// Material-UI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Format address helper function
  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    // If address is a string, return it as is
    if (typeof address === 'string') return address;
    
    // If address is an object, format its parts
    const { street, city, state, zipCode } = address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  };

  // Fetch restaurant data
  const fetchRestaurantData = useCallback(async () => {
    console.log('Fetching restaurant data...');
    if (!user?.id) {
      console.log('No user ID, skipping fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Making API calls...');
      console.log('Current user ID:', user.id);
      
      // First, get the list of restaurants for the current user
      console.log('Calling /restaurants/dashboard endpoint...');
      const restaurantsResponse = await api.get('/restaurants/dashboard');
      console.log('Restaurants response:', restaurantsResponse);
      
      // The backend returns an array of restaurants, take the first one
      const userRestaurants = restaurantsResponse.data || [];
      console.log('User restaurants array:', userRestaurants);
      console.log('First restaurant:', userRestaurants[0]);
      
      if (userRestaurants.length === 0) {
        console.log('No restaurants found for user');
        setError('No restaurants found. Please create a restaurant first.');
        setRestaurants([]);
        return;
      }
      
      setRestaurants(userRestaurants);
      console.log('Restaurants state set:', userRestaurants);
      
    } catch (err) {
      console.error('Error in fetchRestaurantData:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch restaurant data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" style={{ padding: '20px' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" style={{ padding: '20px' }}>
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography color="textSecondary" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={fetchRestaurantData}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  // No restaurants state
  if (restaurants.length === 0) {
    return (
      <Container maxWidth="lg" style={{ padding: '20px' }}>
        <Box textAlign="center" my={4}>
          <Typography variant="h6" gutterBottom>
            No Restaurants Found
          </Typography>
          <Typography color="textSecondary" paragraph>
            You haven't created a restaurant yet. Get started by adding your restaurant details.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/restaurant/new')}
          >
            Add Your Restaurant
          </Button>
        </Box>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" style={{ padding: '20px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Restaurant Dashboard</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/restaurant/new')}
        >
          Add Another Restaurant
        </Button>
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Restaurant Info" />
          <Tab label="Order Management" />
          <Tab label="Menu Management" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box sx={{ width: '100%' }}>
          {restaurants.map((restaurant) => (
            <Card 
              key={restaurant._id}
              sx={{ 
                width: '100%',
                height: 200,
                display: 'flex',
                flexDirection: 'row',
                mb: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ 
                width: '100%',
                flex: 1, 
                display: 'flex', 
                flexDirection: 'row',
                alignItems: 'center',
                p: 3,
                gap: 3
              }}>
                {/* Left side - Restaurant Info */}
                <Box sx={{ flex: 1 }}>
                  {/* Restaurant Name */}
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mb: 2
                    }}
                  >
                    {restaurant.name}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                  >
                    {restaurant.description || 'No description available'}
                  </Typography>

                  {/* Address and Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      📍 {formatAddress(restaurant.address)}
                    </Typography>
                    
                    {restaurant.cuisine && (
                      <Typography variant="body2" color="text.secondary">
                        🍽️ {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
                      </Typography>
                    )}
                    
                    {restaurant.openingHours && (
                      <Typography variant="body2" color="text.secondary">
                        🕒 {restaurant.openingHours}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Right side - Action Buttons */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 120
                }}>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    size="medium"
                    onClick={() => navigate(`/restaurant/${restaurant._id}/edit`)}
                    fullWidth
                  >
                    Edit Restaurant
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="medium"
                    onClick={() => navigate(`/restaurant/${restaurant._id}/menu`)}
                    fullWidth
                  >
                    Manage Menu
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {currentTab === 1 && (
        <>
          {restaurants.length > 0 ? (
            <>
              <Typography variant="h6" gutterBottom>
                Orders for {restaurants[0].name}
              </Typography>
              <RestaurantOrders restaurantId={restaurants[0]._id} />
            </>
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="h6" color="text.secondary">
                No restaurants found. Please create a restaurant first.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/restaurant/new')}
                sx={{ mt: 2 }}
              >
                Add Restaurant
              </Button>
            </Box>
          )}
        </>
      )}

      {currentTab === 2 && (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" gutterBottom>
            Menu Management
          </Typography>
          <Typography color="textSecondary" paragraph>
            Manage your menu items here.
          </Typography>
          {restaurants.length > 0 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/restaurant/${restaurants[0]._id}/menu`)}
            >
              Go to Menu Management
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default RestaurantDashboard;
