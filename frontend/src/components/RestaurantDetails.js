// frontend/src/components/RestaurantDetails.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const RestaurantDetails = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const resResponse = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
        const menuResponse = await axios.get(`http://localhost:5000/api/restaurants/${id}/menu`);
        setRestaurant(resResponse.data);
        setMenuItems(menuResponse.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (!restaurant) return <div>Loading...</div>;

  return (
    <div>
      <h2>{restaurant.name}</h2>
      <p>{restaurant.address}</p>
      <h3>Menu</h3>
      {menuItems.map((item) => (
        <div key={item._id}>
          <h4>{item.name}</h4>
          <p>{item.description}</p>
          <p>${item.price}</p>
          <button onClick={() => addToCart(item)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};

export default RestaurantDetails;