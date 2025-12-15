import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import { HomePage } from './pages/HomePage';
import { DataPage } from './pages/DataPage';
import { SettingsPage } from './pages/SettingsPage';
import { useDatabase } from './hooks/useDatabase';

function App() {
  const {
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
  } = useApp();
  
  const { products, modules, categories, allProducts, allModules, allCategories, testData, loading, loadTestData, productModules, getModulesByProduct } = useDatabase();
  
  // Memoize the loadTestData function to prevent unnecessary re-renders
  const memoizedLoadTestData = React.useCallback(loadTestData, []);
  const memoizedGetModulesByProduct = React.useCallback(getModulesByProduct, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage
              products={products}
              onSelectProduct={selectProduct}
            />
          } 
        />
        <Route 
          path="/data/:productName" 
          element={
            <DataPage
              selectedProduct={state.selectedProduct}
              products={products}
              modules={modules}
              categories={categories}
              testData={testData}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedModule={selectedModule}
              onModuleChange={setSelectedModule}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onProductChange={changeProduct}
              onLoadTestData={memoizedLoadTestData}
              onGetModulesByProduct={memoizedGetModulesByProduct}
            />
          } 
        />
        <Route 
          path="/settings" 
          element={
            <SettingsPage
              products={allProducts}
              modules={allModules}
              categories={allCategories}
              productModules={productModules}
            />
          } 
        />
        <Route 
          path="/settings/:tab" 
          element={
            <SettingsPage
              products={allProducts}
              modules={allModules}
              categories={allCategories}
              productModules={productModules}
            />
          } 
        />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;