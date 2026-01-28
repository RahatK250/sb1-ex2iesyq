import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { msalInstance } from './config/msalConfig';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { HomePage } from './pages/HomePage';
import { DataPage } from './pages/DataPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import LoadingPage from './pages/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useDatabase } from './hooks/useDatabase';

function AppContent() {
  const navigate = useNavigate();
  const [isProcessingRedirect, setIsProcessingRedirect] = React.useState(true);
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
  const { instance, accounts } = useMsal();
  const { loginWithOffice365, isAuthenticated } = useAuth();

  // When MSAL redirect completes it populates `accounts`; when that happens
  // ensure we call `loginWithOffice365` so our app sets localStorage and role.
  React.useEffect(() => {
    let mounted = true;
    const doLogin = async () => {
      try {
        if (accounts && accounts.length > 0 && !isAuthenticated) {
          const acc = accounts[0];
          const res = await loginWithOffice365({
            mail: acc.idTokenClaims?.email || '',
            userPrincipalName: acc.username || '',
          });
          if (res && res.ok && mounted) {
            try { navigate('/select-product', { replace: true }); } catch (e) {}
          }
        }
      } catch (e) {
      }
    };
    doLogin();
    return () => { mounted = false; };
  }, [accounts, isAuthenticated, loginWithOffice365, navigate]);

  // Explicitly handle redirect responses in case automatic handling didn't run
  React.useEffect(() => {
    let mounted = true;
    const handleRedirect = async () => {
      try {
        const resp = await msalInstance.handleRedirectPromise();
        let acc: any = resp?.account || null;
        if (!acc && msalInstance.getAllAccounts().length > 0) {
          const accountsList = msalInstance.getAllAccounts();
          if (accountsList.length > 0) acc = accountsList[0];
        }
        if (acc && mounted) {
          try { instance.setActiveAccount(acc); } catch (e) { }
          const res = await loginWithOffice365({ mail: acc.idTokenClaims?.email || '', userPrincipalName: acc.username || '' });
          if (res?.ok && mounted) {
            try { navigate('/select-product', { replace: true }); } catch (e) {}
          }
        }
      } catch (e) {
      } finally {
        if (mounted) {
          setIsProcessingRedirect(false);
        }
      }
    };
    handleRedirect();
    return () => { mounted = false; };
  }, [instance, loginWithOffice365, navigate]);

  // Memoize the loadTestData function to prevent unnecessary re-renders
  const memoizedLoadTestData = React.useCallback(loadTestData, [loadTestData]);
  const memoizedGetModulesByProduct = React.useCallback(getModulesByProduct, [getModulesByProduct]);

  const handleNavigateBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Helper function to convert product name to URL-safe slug
  const createProductSlug = React.useCallback((name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Handle product selection with navigation
  const handleSelectProduct = React.useCallback((product: any) => {
    selectProduct(product);
    const productSlug = createProductSlug(product.name);
    navigate(`/data/${productSlug}`, { replace: true });
  }, [selectProduct, navigate, createProductSlug]);

  // Show loading page while processing redirect from OAuth
  if (isProcessingRedirect) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            products={products}
            onSelectProduct={handleSelectProduct}
          />
        }
      />
      <Route
        path="/select-product"
        element={
          <ProtectedRoute allowedRoles={['admin', 'reporter']}>
            <HomePage
              products={products}
              onSelectProduct={handleSelectProduct}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data/:productName"
        element={
          <ProtectedRoute allowedRoles={['admin', 'reporter']}>
            <DataPage
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
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={[ 'admin' ]}>
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
          <ProtectedRoute allowedRoles={[ 'admin' ]}>
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
        path="/login"
        element={<LoginPage />}
      />
      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </MsalProvider>
  );
}

export default App;