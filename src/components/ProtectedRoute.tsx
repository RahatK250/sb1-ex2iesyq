import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  allowedRoles?: Array<'admin' | 'reporter'>;
  children: JSX.Element;
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles = ['admin'], children }) => {
  const { role } = useAuth();
  const location = useLocation();

  // Not authenticated -> redirect to login
  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role not allowed -> redirect to home
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
