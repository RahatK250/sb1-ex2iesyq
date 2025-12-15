import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings } from '../components/Settings';
import { Product, Module, Category } from '../types';

interface Props {
  products: Product[];
  modules: Module[];
  categories: Category[];
  productModules: any[];
}

type SettingsTab = 'products' | 'modules' | 'product-modules';
export const SettingsPage: React.FC<Props> = ({
  products,
  modules,
  categories,
  productModules,
}) => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  // Convert URL tab to valid tab or default to 'products'
  const getValidTab = (urlTab?: string): SettingsTab => {
    const validTabs: SettingsTab[] = ['products', 'modules', 'product-modules'];
    if (urlTab && validTabs.includes(urlTab as SettingsTab)) {
      return urlTab as SettingsTab;
    }
    return 'products';
  };

  const activeTab = getValidTab(tab);
  const handleNavigateBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleTabChange = (newTab: SettingsTab) => {
    navigate(`/settings/${newTab}`, { replace: true });
  };
  return (
    <Settings
      products={products}
      modules={modules}
      categories={categories}
      productModules={productModules}
      onNavigateBack={handleNavigateBack}
      initialTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
};