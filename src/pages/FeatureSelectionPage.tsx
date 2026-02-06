import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FeatureCarousel } from '../components/FeatureCarousel';
import { Product } from '../types';

interface Props {
  selectedProduct: Product | null;
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

export const FeatureSelectionPage: React.FC<Props> = ({ selectedProduct, products }) => {
  const navigate = useNavigate();
  const { productName } = useParams<{ productName: string }>();

  // Get the product from the URL or use the selected product
  const product = React.useMemo(() => {
    if (selectedProduct && selectedProduct.name === productName) {
      return selectedProduct;
    }
    // Try to find the product by name slug
    return products.find(p => createProductSlug(p.name) === productName) || selectedProduct;
  }, [selectedProduct, productName, products]);

  const handleSelectFeature = (featureId: string) => {
    if (!product) return;

    const productSlug = createProductSlug(product.name);

    if (featureId === 'data-test-management') {
      // Navigate to the existing data page
      navigate(`/data/${productSlug}`);
    } else if (featureId === 'test-coverage') {
      // Navigate to test coverage page
      navigate(`/test-coverage/${productSlug}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <FeatureCarousel
      productName={product?.name || 'Product'}
      onSelectFeature={handleSelectFeature}
      onBack={handleBack}
    />
  );
};
