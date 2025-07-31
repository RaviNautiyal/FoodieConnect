import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  
  const isRestaurant = user?.role === 'restaurant' || user?.userType === 'restaurant';
  const isCustomer = !isRestaurant && user; // If not a restaurant but authenticated, assume customer
  
  return {
    isRestaurant,
    isCustomer,
    userRole: user?.role || user?.userType || 'guest',
    hasRole: (role) => user?.role === role || user?.userType === role
  };
};
