import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataManagement } from '../components/DataManagement';
import { Product, TestData, Module, Category } from '../types';

interface Props {
  selectedProduct: Product | null;
  products: Product[];
  modules: Module[];
  categories: Category[];
  testData: TestData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedModule: string | 'all';
  onModuleChange: (moduleId: string | 'all') => void;
  selectedCategory: string | 'all';
  onCategoryChange: (categoryId: string | 'all') => void;
  onProductChange: (product: Product) => void;
  onLoadTestData: (filters?: {
    product_id?: string;
    module_id?: string;
    category_id?: string;
    search?: string;
  }) => Promise<void>;
  onGetModulesByProduct: (productId: string) => Promise<Module[]>;
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

// Helper function to find product by slug
const findProductBySlug = (products: Product[], slug: string): Product | undefined => {
  return products.find(product => createProductSlug(product.name) === slug);
};
export const DataPage: React.FC<Props> = ({
  selectedProduct,
  products,
  modules,
  categories,
  testData,
  searchQuery,
  onSearchChange,
  selectedModule,
  onModuleChange,
  selectedCategory,
  onCategoryChange,
  onProductChange,
  onLoadTestData,
  onGetModulesByProduct,
}) => {
  const navigate = useNavigate();
  const { productName } = useParams<{ productName: string }>();

  // If no product is selected or URL product doesn't match, find and select the correct product
  useEffect(() => {
    if (productName && (!selectedProduct || createProductSlug(selectedProduct.name) !== productName)) {
      const product = findProductBySlug(products, productName);
      if (product) {
        onProductChange(product);
      } else {
        // Product not found, redirect to home
        navigate('/', { replace: true });
      }
    }
  }, [productName, selectedProduct, products, onProductChange, navigate]);

  // Handle product change from within the component
  const handleProductChange = (product: Product) => {
    onProductChange(product);
    const productSlug = createProductSlug(product.name);
    navigate(`/data/${productSlug}`, { replace: true });
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  // Don't render if no product is selected
  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Loading...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we load the product data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DataManagement
      selectedProduct={selectedProduct}
      products={products}
      modules={modules}
      categories={categories}
      testData={testData}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedModule={selectedModule}
      onModuleChange={onModuleChange}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      onProductChange={handleProductChange}
      onNavigateToSettings={handleNavigateToSettings}
      onLoadTestData={onLoadTestData}
      onGetModulesByProduct={onGetModulesByProduct}
    />
  );
};