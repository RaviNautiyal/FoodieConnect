// frontend/src/components/RestaurantList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/restaurants');
        setRestaurants(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRestaurants();
  }, []);

  return (
    <div>
      <h2>Restaurants</h2>
      {restaurants.map((restaurant) => (
        <div key={restaurant._id}>
          <h3><Link to={`/restaurants/${restaurant._id}`}>{restaurant.name}</Link></h3>
          <p>{restaurant.address}</p>
        </div>
      ))}
    </div>
  );
};

export default RestaurantList;