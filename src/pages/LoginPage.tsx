import React from 'react';
import AuthModal from '../components/AuthModal';

export const LoginPage: React.FC = () => {
  // Render the existing AuthModal as a dedicated login route.
  return <AuthModal />;
};

export default LoginPage;
