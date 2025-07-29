// frontend/src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
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
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout/>
              </ProtectedRoute>
            } />
            <Route path="/success" element={<Success/>} />
            <Route path="/cancel" element={<Cancel/>} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;