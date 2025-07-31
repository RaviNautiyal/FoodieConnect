import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';

export const RoleBasedRoute = ({ allowedRoles, redirectTo = '/restaurants' }) => {
  const { userRole, hasRole } = useRole();
  
  // If no specific roles are provided, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }
  
  // Check if user has any of the allowed roles
  const hasRequiredRole = allowedRoles.some(role => hasRole(role));
  
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <Outlet />;
};

export const RestaurantRoute = () => (
  <RoleBasedRoute allowedRoles={['restaurant', 'admin']} redirectTo="/restaurants" />
);

export const CustomerRoute = () => (
  <RoleBasedRoute allowedRoles={['customer', 'user']} redirectTo="/restaurants" />
);
