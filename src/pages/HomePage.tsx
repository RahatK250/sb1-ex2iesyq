import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCarousel } from '../components/ProductCarousel';
import { Product } from '../types';
import { AuthModal } from '../components/AuthModal';
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

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    const productSlug = createProductSlug(product.name);
    navigate(`/data/${productSlug}`);
  };

  return (
    <>
      {!isAuthenticated && <AuthModal />}
      {isAuthenticated && (
        <ProductCarousel
          products={products}
          onSelectProduct={handleSelectProduct}
        />
      )}
    </>
  );
};