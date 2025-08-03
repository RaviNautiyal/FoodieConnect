import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is authenticated first
  if (!isAuthenticated || !user) {
    return {
      isRestaurant: false,
      isCustomer: false,
      userRole: 'guest',
      hasRole: () => false
    };
  }

  // Determine role based on user object structure
  const userRole = user.role || user.userType;
  const isRestaurant = userRole === 'restaurant' || userRole === 'RESTAURANT';
  const isCustomer = userRole === 'customer' || userRole === 'CUSTOMER' || !isRestaurant;
  
  return {
    isRestaurant,
    isCustomer,
    userRole: userRole?.toLowerCase() || 'guest',
    hasRole: (role) => userRole?.toLowerCase() === role?.toLowerCase()
  };
};
