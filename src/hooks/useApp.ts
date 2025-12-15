import { useState, useEffect } from 'react';
import { AppState, Product } from '../types';

export const useApp = () => {
  const [state, setState] = useState<AppState>({
    selectedProduct: null,
    theme: 'light',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setState(prev => ({ ...prev, theme: savedTheme }));
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  const selectProduct = (product: Product) => {
    setState(prev => ({ 
      ...prev, 
      selectedProduct: product, 
      currentPage: 'data' 
    }));
  };

  const changeProduct = (product: Product) => {
    setState(prev => ({ 
      ...prev, 
      selectedProduct: product
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({ 
      ...prev, 
      theme: prev.theme === 'light' ? 'dark' : 'light' 
    }));
  };


  return {
    state,
    searchQuery,
    setSearchQuery,
    selectedModule,
    setSelectedModule,
    selectedCategory,
    setSelectedCategory,
    selectProduct,
    changeProduct,
    toggleTheme,
  };
};