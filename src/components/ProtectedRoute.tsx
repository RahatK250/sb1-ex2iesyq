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

  // Use the React context role first, fall back to persisted role in
  // localStorage to avoid a race where auth state hasn't been applied yet
  // but localStorage already contains the auth role (set during login).
  const persistedRole = typeof window !== 'undefined' ? localStorage.getItem('qollect_role') : null;
  const effectiveRole = role || (persistedRole === 'admin' || persistedRole === 'reporter' ? (persistedRole as 'admin' | 'reporter') : null);

  // Not authenticated -> redirect to login
  if (!effectiveRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role not allowed -> redirect to home
  if (!allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
