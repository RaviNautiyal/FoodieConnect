// frontend/src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import { Link } from 'react-router-dom';
import Register from './components/Register';
import RestaurantList from './components/RestaurantList';
import RestaurantDetails from './components/RestaurantDetails';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Success from './components/Success';
import Cancel from './components/Cancel';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleBasedRoute, RestaurantRoute, CustomerRoute } from './components/common/RoleBasedRoute';
import RestaurantDashboard from './components/RestaurantDashboard';
import MenuManagement from './components/MenuManagement';
import RestaurantForm from './components/RestaurantForm';
import MenuItemForm from './components/MenuItemForm';
import MenuPage from './components/MenuPage';
import Unauthorized from './components/common/Unauthorized';
import Navigation from './components/Navigation';
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            <Routes>
            <Route path="/" element={<LandingPage/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/restaurants" element={
              <ProtectedRoute>
                <RestaurantList/>
              </ProtectedRoute>
            } />
            <Route path="/restaurants/:id" element={
              <ProtectedRoute>
                <RestaurantDetails/>
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart/>
              </ProtectedRoute>
            } />
            {/* Restaurant-only routes */}
            <Route element={<RestaurantRoute />}>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <RestaurantDashboard/>
                </ProtectedRoute>
              } />
              <Route path="/restaurant/new" element={
                <ProtectedRoute>
                  <RestaurantForm />
                </ProtectedRoute>
              } />
              <Route path="/restaurant/:id/edit" element={
                <ProtectedRoute>
                  <RestaurantForm />
                </ProtectedRoute>
              } />
              <Route path="/restaurant/:id/menu" element={
                <ProtectedRoute>
                  <MenuManagement/>
                </ProtectedRoute>
              } />
              <Route path="/restaurant/:id/menu/new" element={
                <ProtectedRoute>
                  <MenuItemForm />
                </ProtectedRoute>
              } />
              <Route path="/restaurant/:id/menu/:menuId/edit" element={
                <ProtectedRoute>
                  <MenuItemForm />
                </ProtectedRoute>
              } />
            </Route>

            {/* Customer-only routes */}
            <Route element={<CustomerRoute />}>
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart/>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout/>
                </ProtectedRoute>
              } />
            </Route>
            {/* Public routes */}
            <Route path="/menu/:id" element={
              <MenuPage />
            } />
              <Route path="/success" element={<Success/>} />
              <Route path="/cancel" element={<Cancel/>} />
              <Route path="/unauthorized" element={<Unauthorized/>} />
              {/* Catch-all route for 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">Page not found</p>
                    <Link 
                      to="/" 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Go Home
                    </Link>
                  </div>
                </div>
              } />
            </Routes>
          </main>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;