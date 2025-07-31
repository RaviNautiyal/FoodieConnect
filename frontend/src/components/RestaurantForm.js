import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const RestaurantForm = ({ restaurant = null }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    address: restaurant?.address || '',
    cuisine: restaurant?.cuisine || '',
    description: restaurant?.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (restaurant) {
        // Update existing restaurant
        await axios.put(`/api/restaurants/${id}`, formData);
        navigate('/dashboard');
      } else {
        // Create new restaurant
        await axios.post('/api/restaurants', {
          ...formData,
          owner: user.id
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="restaurant-form">
      <h2>{restaurant ? 'Edit Restaurant' : 'Create New Restaurant'}</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Cuisine:</label>
          <input
            type="text"
            name="cuisine"
            value={formData.cuisine}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
        </button>
      </form>

      {restaurant && (
        <button 
          className="btn btn-danger"
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default RestaurantForm;
