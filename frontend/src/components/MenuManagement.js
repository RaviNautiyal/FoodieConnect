import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import fetchMenuItems from './MenuManagement';
const MenuManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get(`/api/restaurants/${id}/menu`);
        setMenuItems(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch menu items');
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/restaurants/${id}/menu`, newMenuItem);
      setNewMenuItem({ name: '', price: '', description: '' });
      // Refresh menu items
      const response = await axios.get(`/api/restaurants/${id}/menu`);
      setMenuItems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleUpdate = async (itemId, updatedItem) => {
    try {
      await axios.put(`/api/restaurants/${id}/menu/${itemId}`, updatedItem);
      // Refresh menu items
      const response = await axios.get(`/api/restaurants/${id}/menu`);
      setMenuItems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update menu item');
    }
  };

  const handleDeleteMenuItem = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/api/restaurants/${id}/menu/${menuId}`);
      // Refresh menu items
      const response = await axios.get(`/api/restaurants/${id}/menu`);
      setMenuItems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchMenuItems();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="menu-management">
      <h2>Menu Management</h2>
      
      <div className="menu-actions">
        <button 
          className="btn btn-primary"
          onClick={() => navigate(`/restaurant/${id}/menu/new`)}
        >
          Add New Menu Item
        </button>
      </div>

      <div className="menu-items">
        {menuItems.length === 0 ? (
          <div className="no-items">
            <p>No menu items yet. Add your first menu item!</p>
          </div>
        ) : (
          menuItems.map(item => (
            <div key={item._id} className="menu-item-card">
              <h3>{item.name}</h3>
              <p>Price: ${item.price}</p>
              <p>Description: {item.description}</p>
              <div className="actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/restaurant/${id}/menu/${item._id}/edit`)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteMenuItem(item._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MenuManagement;
