import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface Props {
  selectedProduct: Product | null;
  products: Product[];
}

// Helper function to convert product name to URL-safe slug
const createProductSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const TestCoveragePage: React.FC<Props> = ({ selectedProduct, products }) => {
  const navigate = useNavigate();
  const { productName } = useParams<{ productName: string }>();

  // Get the product from the URL or use the selected product
  const product = React.useMemo(() => {
    if (selectedProduct && selectedProduct.name === productName) {
      return selectedProduct;
    }
    return products.find(p => createProductSlug(p.name) === productName) || selectedProduct;
  }, [selectedProduct, productName, products]);

  const handleBack = () => {
    if (product) {
      const productSlug = createProductSlug(product.name);
      navigate(`/features/${productSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header with Back Button */}
      <div className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Back to Features</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Test Coverage
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {product?.name && `for ${product.name}`}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              Test Coverage feature is coming soon. Business requirements are being finalized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
