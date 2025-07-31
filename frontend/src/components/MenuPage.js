import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Button, Box, Tabs, Tab, Chip, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { Search as SearchIcon, ShoppingCart as CartIcon, Star as StarIcon } from '@mui/icons-material';

const MenuPage = () => {
  const { id: restaurantId } = useParams();
  
  // State
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [restaurantRes, menuRes, categoriesRes] = await Promise.all([
          axios.get(`/api/restaurants/${restaurantId}`),
          axios.get(`/api/restaurants/${restaurantId}/menu`),
          axios.get(`/api/restaurants/${restaurantId}/categories`)
        ]);
        
        setRestaurant(restaurantRes.data);
        setMenuItems(menuRes.data.menuItems || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (err) {
        setError('Failed to load menu. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category?._id === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
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
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" gutterBottom>{restaurant?.name}</Typography>
        <Typography color="textSecondary" paragraph>
          {restaurant?.cuisine} • {restaurant?.address}
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
            <Tab label="All" value="all" />
            {categories.map(category => (
              <Tab key={category._id} label={category.name} value={category._id} />
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
                  onClick={() => {}}
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
