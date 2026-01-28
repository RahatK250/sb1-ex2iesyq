import { useState, useEffect, useCallback } from 'react';
import { AppState, Product } from '../types';

export const useApp = () => {
  const [state, setState] = useState<AppState>(() => {
    // Initialize from localStorage
    try {
      const saved = localStorage.getItem('appState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          selectedProduct: parsed.selectedProduct || null,
          theme: (parsed.theme as 'light' | 'dark') || 'light',
        };
      }
    } catch (e) {
      console.error('Error loading app state from localStorage:', e);
    }
    return { selectedProduct: null, theme: 'light' };
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

  // Persist app state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('appState', JSON.stringify({
        selectedProduct: state.selectedProduct,
        theme: state.theme,
      }));
    } catch (e) {
      console.error('Error saving app state to localStorage:', e);
    }
  }, [state.selectedProduct, state.theme]);

  const selectProduct = useCallback((product: Product) => {
    setState(prev => ({ 
      ...prev, 
      selectedProduct: product, 
      currentPage: 'data' 
    }));
  }, []);

  const changeProduct = useCallback((product: Product) => {
    setState(prev => ({ 
      ...prev, 
      selectedProduct: product
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      theme: prev.theme === 'light' ? 'dark' : 'light' 
    }));
  }, []);


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