import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCarousel } from '../components/ProductCarousel';
import { Product } from '../types';
import { AuthModal } from '../components/AuthModal';
import AuthDebugPanel from '../components/AuthDebugPanel';
import { useAuth } from '../hooks/useAuth';

interface Props {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

// Helper function to convert product name to URL-safe slug
const createProductSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};
export const HomePage: React.FC<Props> = ({ products, onSelectProduct }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [persistedRole, setPersistedRole] = React.useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('qollect_role') : null;
  });

  // Watch for localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newRole = typeof window !== 'undefined' ? localStorage.getItem('qollect_role') : null;
      setPersistedRole(newRole);
    };

    // Listen for changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for changes in this tab (loginWithOffice365 sets state synchronously)
    // We check localStorage periodically to catch updates
    const interval = setInterval(() => {
      const newRole = typeof window !== 'undefined' ? localStorage.getItem('qollect_role') : null;
      if (newRole && !persistedRole) {
        setPersistedRole(newRole);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [persistedRole]);

  const isEffectivelyAuthenticated = isAuthenticated || (persistedRole === 'admin' || persistedRole === 'reporter');

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    const productSlug = createProductSlug(product.name);
    navigate(`/data/${productSlug}`, { replace: true });
  };

  return (
    <>
      <AuthDebugPanel />
      {!isEffectivelyAuthenticated && <AuthModal />}
      {isEffectivelyAuthenticated && (
        <ProductCarousel
          products={products}
          onSelectProduct={handleSelectProduct}
        />
      )}
    </>
  );
};