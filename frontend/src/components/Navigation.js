import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isRestaurant, isCustomer } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              FoodieConnect
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/restaurants" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Restaurants
            </Link>
            
            {isAuthenticated ? (
              <>
                {isRestaurant && (
                  <>
                    <Link
                      to="/dashboard"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/restaurant/new"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Add Restaurant
                    </Link>
                  </>
                )}
                
                {isCustomer && (
                  <Link
                    to="/cart"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    My Cart
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
