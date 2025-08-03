// frontend/src/App.js
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRole } from './hooks/useRole';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import RestaurantList from './components/RestaurantList';
import RestaurantDetails from './components/RestaurantDetails';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Success from './components/Success';
import Cancel from './components/Cancel';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import RestaurantDashboard from './components/RestaurantDashboard';
import MenuManagement from './components/MenuManagement';
import RestaurantForm from './components/RestaurantForm';
import MenuItemForm from './components/MenuItemForm';
import MenuPage from './components/MenuPage';
import Unauthorized from './components/common/Unauthorized';
import RestaurantNavbar from './components/restaurant/RestaurantNavbar';

// Main app content component that uses hooks
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const { isRestaurant } = useRole();
  const location = useLocation();
  
  // Check if current route is the landing page or auth pages
  const isLandingPage = location.pathname === '/';
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const shouldShowNav = isAuthenticated && !isLandingPage && !isAuthPage;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Show only one navigation bar based on user type */}
      {shouldShowNav && (
        isRestaurant ? <RestaurantNavbar /> : <Navigation />
      )}
      
      <main>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to={isRestaurant ? '/dashboard' : '/restaurants'} />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to={isRestaurant ? '/dashboard' : '/restaurants'} />} 
          />
          
          {/* Protected routes */}
          <Route element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }>
            <Route path="/restaurants" element={<RestaurantList />} />
            <Route path="/restaurants/:id" element={<RestaurantDetails />} />
            <Route path="/menu/:id" element={<MenuPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            
            {/* Restaurant-specific routes */}
            <Route path="/dashboard" element={<RestaurantDashboard />} />
            <Route 
              path="/restaurant/new" 
              element={
                <RestaurantForm 
                  onSuccess={async () => {
                    console.log('Restaurant created, dispatching refresh event...');
                    // Give the server a moment to process the new restaurant
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Dispatch a custom event that the dashboard listens for
                    const event = new CustomEvent('restaurantCreated', { 
                      detail: { timestamp: Date.now() } 
                    });
                    window.dispatchEvent(event);
                    console.log('Refresh event dispatched');
                  }} 
                />
              } 
            />
            <Route path="/restaurant/:id/edit" element={<RestaurantForm />} />
            <Route path="/restaurant/:id/menu" element={<MenuManagement />} />
            <Route path="/restaurant/:id/menu/new" element={<MenuItemForm />} />
            <Route path="/restaurant/:id/menu/:menuId/edit" element={<MenuItemForm />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-xl mb-4">Page not found</p>
                <Link to="/" className="text-blue-600 hover:underline">
                  Go back home
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

// Main App component with providers
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;