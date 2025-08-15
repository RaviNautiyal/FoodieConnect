// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RestaurantSearch from './components/RestaurantSearch';
import RestaurantDetail from './components/RestaurantDetails';
import ShoppingCart from './components/ShoppingCart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import OrderDetail from './components/OrderDetail';
import RestaurantDashboard from './components/RestaurantDashboard';
import RestaurantForm from './components/RestaurantForm';
import MenuManagement from './components/MenuManagement';
import MenuItemForm from './components/MenuItemForm';
import Profile from './components/Profile';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navigation />
            <main className="main-content">
              <div className="nav-spacer"></div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<RestaurantSearch />} />
                <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                <Route path="/restaurant/:id/edit" element={<RestaurantForm />} />
                <Route path="/restaurant/:id/menu" element={<MenuManagement />} />
                <Route path="/restaurant/:id/menu/new" element={<MenuItemForm />} />
                <Route path="/restaurant/:id/menu/:itemId/edit" element={<MenuItemForm />} />
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/dashboard" element={<RestaurantDashboard />} />
                <Route path="/restaurant/new" element={<RestaurantForm />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;