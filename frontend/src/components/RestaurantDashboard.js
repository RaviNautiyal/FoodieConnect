import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  // Fetch restaurant data
  const fetchRestaurantData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch restaurant details and menu items
      const [restaurantRes, menuRes] = await Promise.all([
        axios.get('/api/restaurants/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/restaurants/dashboard/menu', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setRestaurant(restaurantRes.data.restaurant || null);
      setMenuItems(menuRes.data.menuItems || []);
      
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.response?.data?.message || 'Failed to fetch restaurant data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
  }, [user?.id]);

  // Handle menu item deletion
  const handleDeleteMenuItem = async (menuItemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await axios.delete(`/api/menu-items/${menuItemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
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
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" style={{ padding: '20px', textAlign: 'center' }}>
        <Typography color="error" variant="h6">Error: {error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          style={{ marginTop: '20px' }}
        >
          Retry
        </Button>
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
                {restaurant.address} • {restaurant.cuisine}
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
