import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import { HomePage } from './pages/HomePage';
import { DataPage } from './pages/DataPage';
import { SettingsPage } from './pages/SettingsPage';
import { FeatureSelectionPage } from './pages/FeatureSelectionPage';
import { TestCoveragePage } from './pages/TestCoveragePage';
import { CoverageOverviewPage } from './pages/CoverageOverviewPage';
import { LoginPage } from './pages/LoginPage';
import { useDatabaseContext } from './contexts/DatabaseContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Wraps routes that require authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
            alt="Qollect Logo"
            className="w-16 h-16"
          />
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const { products, modules, categories, allProducts, allModules, allCategories, testData, loading, loadTestData, productModules, moduleSubModules, subModules, allSubModules, getModulesByProduct } = useDatabaseContext();

  // Memoize the loadTestData function to prevent unnecessary re-renders
  const memoizedLoadTestData = React.useCallback(loadTestData, []);
  const memoizedGetModulesByProduct = React.useCallback(getModulesByProduct, []);

  const handleNavigateBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage
              products={products}
              onSelectProduct={selectProduct}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/:productName"
        element={
          <ProtectedRoute>
            <FeatureSelectionPage
              selectedProduct={state.selectedProduct}
              products={products}
              onSelectProduct={selectProduct}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data/:productName"
        element={
          <ProtectedRoute>
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
              currentUser={user}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-coverage/:productName"
        element={
          <ProtectedRoute>
            <TestCoveragePage
              selectedProduct={state.selectedProduct}
              products={allProducts}
              modules={allModules}
              productModules={productModules}
              subModules={subModules}
              allSubModules={allSubModules}
              moduleSubModules={moduleSubModules}
              currentUser={user}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage
              products={allProducts}
              modules={allModules}
              categories={allCategories}
              productModules={productModules}
              onNavigateBack={handleNavigateBack}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/:tab"
        element={
          <ProtectedRoute>
            <SettingsPage
              products={allProducts}
              modules={allModules}
              categories={allCategories}
              productModules={productModules}
              onNavigateBack={handleNavigateBack}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coverage-overview"
        element={
          <ProtectedRoute>
            <CoverageOverviewPage
              products={allProducts}
              productModules={productModules}
              modules={allModules}
            />
          </ProtectedRoute>
        }
      />
      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
