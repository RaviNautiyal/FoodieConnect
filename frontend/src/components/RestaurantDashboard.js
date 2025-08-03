import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import axios from 'axios';
// Material-UI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

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
  const fetchRestaurantData = async () => {
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
      const restaurantsResponse = await api.get('/restaurants/dashboard');
      console.log('Restaurants response:', restaurantsResponse);
      
      // The backend returns an array of restaurants, take the first one
      const userRestaurants = restaurantsResponse.data || [];
      console.log('User restaurants:', userRestaurants);
      
      const userRestaurant = userRestaurants[0] || null;
      console.log('Selected restaurant:', userRestaurant);
      
      let menuItems = [];
      
      // If we have a restaurant, fetch its menu items
      if (userRestaurant && userRestaurant._id) {
        try {
          const menuResponse = await api.get(`/restaurants/${userRestaurant._id}/menu`);
          menuItems = menuResponse.data || [];
          console.log('Menu items:', menuItems);
        } catch (menuErr) {
          console.error('Error fetching menu items:', menuErr);
          menuItems = [];
        }
      }
      
      console.log('Setting state with:', { restaurant: userRestaurant, menuItems });
      setRestaurant(userRestaurant);
      setMenuItems(menuItems);
      
    } catch (err) {
      console.error('Error in fetchRestaurantData:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch restaurant data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and event listener setup
  useEffect(() => {
    console.log('Setting up RestaurantDashboard...');
    
    // Function to refresh data
    const refreshData = async () => {
      console.log('Refreshing dashboard data...');
      await fetchRestaurantData();
    };
    
    // Initial fetch
    refreshData();
    
    // Event listener for restaurant creation
    const handleRestaurantCreated = () => {
      console.log('Restaurant created event received');
      // Add a small delay to ensure the server has processed the new restaurant
      setTimeout(refreshData, 500);
    };

    window.addEventListener('restaurantCreated', handleRestaurantCreated);
    
    // Cleanup
    return () => {
      console.log('Cleaning up RestaurantDashboard...');
      window.removeEventListener('restaurantCreated', handleRestaurantCreated);
    };
  }, [user?.id]);
  
  // Add a cleanup effect to clear any pending timeouts
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
      console.log('Cleaning up timeouts...');
    };
  }, []);

  // Handle menu item deletion
  const handleDeleteMenuItem = async (menuItemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await api.delete(`/menu-items/${menuItemId}`);
      
      // Refresh the data
      fetchRestaurantData();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      window.alert(err.response?.data?.message || 'Failed to delete menu item');
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" my={4}>
          <Typography color="error" variant="h6" gutterBottom>
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
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  // Render no restaurant state
  if (!restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" my={4}>
          <Typography variant="h5" gutterBottom>
            No Restaurant Found
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
          {restaurant ? 'Add Another Restaurant' : 'Create Restaurant'}
        </Button>
      </Box>

      {restaurant ? (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>{restaurant.name}</Typography>
              <Typography variant="body1" paragraph>{restaurant.description}</Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {formatAddress(restaurant.address)} • {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
              </Typography>
              {restaurant.openingHours && (
                <Typography variant="body2" color="textSecondary">
                  {restaurant.openingHours}
                </Typography>
              )}
            </Box>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => navigate(`/restaurant/edit/${restaurant._id}`)}
            >
              Edit Restaurant
            </Button>
          </Box>
          
          <Box mt={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Menu Items</Typography>
              <Button 
                variant="contained" 
                color="primary"
                size="small"
                onClick={() => navigate(`/restaurant/${restaurant._id}/menu/new`)}
              >
                Add Menu Item
              </Button>
            </Box>
            
            {menuItems.length > 0 ? (
              <Grid container spacing={3}>
                {menuItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="h6">{item.name}</Typography>
                          <Typography color="primary" fontWeight="bold">
                            ${item.price?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {item.category ? `Category: ${item.category}` : 'Uncategorized'}
                        </Typography>
                        
                        <Typography variant="body2" paragraph>
                          {item.description || 'No description available'}
                        </Typography>
                        
                        <Box display="flex" justifyContent="space-between" mt={2}>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/menu-item/edit/${item._id}`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteMenuItem(item._id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box 
                textAlign="center" 
                p={4} 
                border={1} 
                borderColor="divider" 
                borderRadius={1}
              >
                <Typography variant="body1" color="textSecondary" paragraph>
                  No menu items found. Add your first menu item to get started.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate(`/restaurant/${restaurant._id}/menu/new`)}
                  startIcon={<AddIcon />}
                >
                  Add Menu Item
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box 
          textAlign="center" 
          p={6} 
          border={1} 
          borderColor="divider" 
          borderRadius={1}
          mt={4}
        >
          <Typography variant="h6" gutterBottom>No Restaurant Found</Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            You don't have any restaurants yet. Create your first restaurant to get started.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/restaurant/new')}
            startIcon={<AddIcon />}
            size="large"
            sx={{ mt: 2 }}
          >
            Create Restaurant
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default RestaurantDashboard;
