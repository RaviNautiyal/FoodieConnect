import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ShoppingCart from './ShoppingCart';
import '../styles/Navigation.css';

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const proceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">FoodieConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-menu">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
              Restaurants
            </Link>
            {!isAuthenticated && (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link">
                  Sign Up
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>
                My Orders
              </Link>
            )}
            {isAuthenticated && user?.role === 'restaurant' && (
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="nav-actions">
            {/* Cart Icon */}
            <button onClick={openCart} className="nav-cart">
              <span className="cart-icon">🛒</span>
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="user-menu">
                <button className="user-button" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <div className="user-avatar">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} />
                    ) : (
                      <span>{user?.firstName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <span className="user-name">{user?.firstName || 'User'}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </Link>
                    {user?.role === 'restaurant' && (
                      <Link to="/restaurant/new" className="dropdown-item">
                        <span className="dropdown-icon">🏪</span>
                        Add Restaurant
                      </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item">
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            <button 
              className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" className="mobile-nav-link">Home</Link>
            <Link to="/search" className="mobile-nav-link">Restaurants</Link>
            {isAuthenticated && (
              <Link to="/orders" className="mobile-nav-link">My Orders</Link>
            )}
            {isAuthenticated && user?.role === 'restaurant' && (
              <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="mobile-nav-link">Login</Link>
                <Link to="/register" className="mobile-nav-link">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Shopping Cart Modal */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={closeCart}
        onProceedToCheckout={proceedToCheckout}
      />
    </>
  );
};

export default Navigation;
