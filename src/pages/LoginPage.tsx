import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/select-product', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Render the existing AuthModal as a dedicated login route.
  return <AuthModal />;
};

export default LoginPage;
