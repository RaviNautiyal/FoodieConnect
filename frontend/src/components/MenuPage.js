import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Button, Box, Tabs, Tab, Chip, TextField, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Search as SearchIcon, ShoppingCart as CartIcon, Star as StarIcon } from '@mui/icons-material';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';

const MenuPage = () => {
  const { id: restaurantId } = useParams();
  const { addToCart } = useContext(CartContext);
  
  // State
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  // Helper function to format address (handles both string and object formats)
  const formatAddress = (address) => {
    if (!address) return 'No address available';
    
    if (typeof address === 'string') {
      return address;
    }
    
    // Handle address object
    const { street, city, state, zipCode } = address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.join(', ');
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch restaurant data
        const restaurantRes = await api.get(`/restaurants/${restaurantId}`);
        setRestaurant(restaurantRes.data);
        
        // Fetch menu items
        const menuRes = await api.get(`/restaurants/${restaurantId}/menu`);
        setMenuItems(menuRes.data || []);
        
        // Extract unique categories from menu items
        const uniqueCategories = ['All', ...new Set(menuRes.data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu. Please try again later.');
        setSnackbar({
          open: true,
          message: 'Failed to load menu. Please try again.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (item.isAvailable !== false);
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Error Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" gutterBottom>{restaurant?.name}</Typography>
        <Typography color="textSecondary" paragraph>
          {restaurant?.cuisine} • {formatAddress(restaurant?.address)}
        </Typography>
        
        {/* Search */}
        <Box maxWidth={600} mx="auto" mb={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon />
            }}
          />
        </Box>
        
        {/* Categories */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
          <Tabs
            value={activeCategory}
            onChange={(e, newValue) => setActiveCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map(category => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        </Box>
      </Box>
      
      {/* Menu Items */}
      <Grid container spacing={3}>
        {filteredItems.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {item.image && (
                <CardMedia
                  component="img"
                  height="180"
                  image={item.image}
                  alt={item.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography color="primary">${item.price.toFixed(2)}</Typography>
                </Box>
                
                <Box display="flex" gap={1} mb={2}>
                  {item.isVeg && <Chip label="Veg" size="small" color="success" />}
                  {item.isPopular && <Chip label="Popular" size="small" color="secondary" />}
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  {item.description}
                </Typography>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<CartIcon />}
                  onClick={() => addToCart({ ...item, restaurantId })}
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MenuPage;
