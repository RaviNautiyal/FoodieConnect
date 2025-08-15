import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Delicious Food
              <span className="text-accent"> Delivered</span>
              <br />
              to Your Doorstep
            </h1>
            <p className="hero-subtitle">
              Discover the best restaurants in your area. Order your favorite meals 
              and enjoy fast, reliable delivery right to your home.
            </p>
            <div className="hero-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </>
              ) : (
                <Link to="/search" className="btn btn-primary btn-lg">
                  Order Now
                </Link>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-image-container">
              <div className="floating-card card-1">
                <div className="card-icon">🍕</div>
                <div className="card-text">Fresh Pizza</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🍔</div>
                <div className="card-text">Juicy Burgers</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">🍜</div>
                <div className="card-text">Asian Delights</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose FoodieConnect?</h2>
            <p>We make food ordering simple, fast, and delicious</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast Delivery</h3>
              <p>Get your food delivered in under 30 minutes with our optimized delivery network.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Fresh Food</h3>
              <p>Partner with the best local restaurants to ensure fresh, quality ingredients.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment</h3>
              <p>Multiple payment options with secure, encrypted transactions for your safety.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Location Based</h3>
              <p>Find restaurants near you with our intelligent location-based search.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Ordering food has never been easier</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3>Search</h3>
              <p>Find restaurants and browse menus in your area</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🛒</div>
              <h3>Order</h3>
              <p>Add items to cart and customize your order</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🚚</div>
              <h3>Delivery</h3>
              <p>Track your order and enjoy fresh food at home</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Order?</h2>
            <p>Join thousands of satisfied customers who love our service</p>
            <Link to="/search" className="btn btn-accent btn-xl">
              Start Ordering Now
            </Link>
          </div>
        </div>
      </section>

      {/* Restaurant Owner CTA */}
      <section className="restaurant-cta">
        <div className="container">
          <div className="restaurant-cta-content">
            <div className="restaurant-cta-text">
              <h2>Are You a Restaurant Owner?</h2>
              <p>
                Join our platform and reach more customers. We provide everything you need 
                to grow your business and deliver amazing food experiences.
              </p>
              <Link to="/restaurant/new" className="btn btn-outline btn-lg">
                List Your Restaurant
              </Link>
            </div>
            <div className="restaurant-cta-image">
              <div className="restaurant-illustration">
                🏪
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
