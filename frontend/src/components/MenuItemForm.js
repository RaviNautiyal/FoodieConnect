import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const MenuItemForm = ({ menuItem = null }) => {
  const navigate = useNavigate();
  const { id, menuId } = useParams();
  const [formData, setFormData] = useState({
    name: menuItem?.name || '',
    price: menuItem?.price || '',
    description: menuItem?.description || ''
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
      if (menuItem) {
        // Update existing menu item
        await axios.put(`/api/restaurants/${id}/menu/${menuId}`, formData);
        navigate(`/restaurant/${id}/menu`);
      } else {
        // Create new menu item
        await axios.post(`/api/restaurants/${id}/menu`, formData);
        navigate(`/restaurant/${id}/menu`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="menu-item-form">
      <h2>{menuItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
      
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
          <label>Price:</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
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
          {loading ? 'Saving...' : menuItem ? 'Update Menu Item' : 'Add Menu Item'}
        </button>
      </form>

      {menuItem && (
        <button 
          className="btn btn-danger"
          onClick={() => navigate(`/restaurant/${id}/menu`)}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default MenuItemForm;
