import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Plus, Edit, Trash2, Copy, X, ChevronLeft, ChevronRight, Package, Layers, Tag, Menu, FileSpreadsheet, MoreVertical, Files, LogOut } from 'lucide-react';
import { Product, TestData, Module, Category } from '../types';
import { useDatabase } from '../hooks/useDatabase';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { TestDataModal } from './modals/TestDataModal';
import { ExcelImport } from './ExcelImport';
import { CustomProductDropdown } from './CustomProductDropdown';
import { CustomDropdown } from './CustomDropdown';
import { useAuth } from '../hooks/useAuth';

interface Props {
  selectedProduct: Product;
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
  onNavigateToSettings: () => void;
  onLoadTestData: (filters?: {
    product_id?: string;
    module_id?: string;
    category_id?: string;
    search?: string;
  }) => Promise<void>;
  onGetModulesByProduct: (productId: string) => Promise<Module[]>;
}

export const DataManagement: React.FC<Props> = ({
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
  onNavigateToSettings,
  onLoadTestData,
  onGetModulesByProduct,
}) => {
  const { role, logout, email } = useAuth();
  const navigate = useNavigate();

  const handleLogout = React.useCallback(() => {
    try {
      logout();
    } finally {
      // navigate to home so auth modal (on HomePage) appears
      navigate('/');
    }
  }, [logout, navigate]);
  const [toast, setToast] = React.useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  const [showTestDataModal, setShowTestDataModal] = React.useState(false);
  const [showExcelImport, setShowExcelImport] = React.useState(false);
  const [editingTestData, setEditingTestData] = React.useState<TestData | null>(null);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [showMobileFilter, setShowMobileFilter] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [filteredModules, setFilteredModules] = React.useState<Module[]>(modules);
  const [filteredCategories, setFilteredCategories] = React.useState<Category[]>(categories);
  const [confirmDialog, setConfirmDialog] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const { createTestData, updateTestData, deleteTestData } = useDatabase();

  // Load test data when filters change (with debounce to prevent infinite loading)
  React.useEffect(() => {
    const loadData = async () => {
      console.log('Loading test data with filters:', {
        product_id: selectedProduct.id,
        module_id: selectedModule !== 'all' ? selectedModule : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      });
      
      const filters = {
        product_id: selectedProduct.id,
        module_id: selectedModule !== 'all' ? selectedModule : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      };
      
      try {
        await onLoadTestData(filters);
        console.log('Test data loaded successfully');
      } catch (error) {
        console.error('Error loading test data:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (selectedProduct) {
      // Add debounce to prevent too frequent calls
      const timeoutId = setTimeout(loadData, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProduct?.id, selectedModule, selectedCategory, searchQuery]);

  // Load modules for selected product - Memoized to prevent unnecessary re-renders
  const loadModulesForProduct = React.useCallback(async () => {
    if (selectedProduct) {
      try {
        console.log('Loading modules for product in DataManagement:', selectedProduct.id);
        const productModules = await onGetModulesByProduct(selectedProduct.id);
        const activeProductModules = productModules.filter(m => m.is_active);
        console.log('Loaded modules in DataManagement:', activeProductModules);
        setFilteredModules(activeProductModules);
        
        // Reset module filter if current selection is not available for this product
        if (selectedModule !== 'all' && !activeProductModules.find(m => m.id === selectedModule)) {
          console.log('Resetting module filter - current selection not available');
          onModuleChange('all');
        }
      } catch (error) {
        console.error('Error loading modules for product:', error);
        setFilteredModules([]);
      }
    } else {
      console.log('No product selected, clearing modules');
      setFilteredModules([]);
    }
  }, [selectedProduct?.id, onGetModulesByProduct, selectedModule, onModuleChange]);

  React.useEffect(() => {
    loadModulesForProduct();
  }, [loadModulesForProduct]);

  // Filter categories to show only active ones - Memoized
  const filteredCategoriesMemo = React.useMemo(() => {
    return categories.filter(c => c.is_active);
  }, [categories]);

  React.useEffect(() => {
    setFilteredCategories(filteredCategoriesMemo);
    
    // Reset category filter if current selection is not active
    if (selectedCategory !== 'all' && !filteredCategoriesMemo.find(c => c.id === selectedCategory)) {
      onCategoryChange('all');
    }
  }, [filteredCategoriesMemo, selectedCategory, onCategoryChange]);

  // Memoized category stats to prevent unnecessary recalculations
  const categoryStats = React.useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      count: testData.filter(item => item.category_id === cat.id).length,
    }));
  }, [categories, testData]);

  // Memoized helper functions
  const getCategoryById = React.useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getModuleById = React.useCallback((id: string) => {
    return filteredModules.find(mod => mod.id === id) || modules.find(mod => mod.id === id);
  }, [filteredModules, modules]);

  // Memoized copy function
  const copyToClipboard = React.useCallback(async (text: string) => {
    const loadModulesForProduct = async () => {
      if (selectedProduct) {
        try {
          const productModules = await onGetModulesByProduct(selectedProduct.id);
          const activeProductModules = productModules.filter(m => m.is_active);
          setFilteredModules(activeProductModules);
          
          // Reset module filter if current selection is not available for this product
          if (selectedModule !== 'all' && !activeProductModules.find(m => m.id === selectedModule)) {
            onModuleChange('all');
          }
        } catch (error) {
          console.error('Error loading modules for product:', error);
          setFilteredModules([]);
        }
      } else {
        setFilteredModules([]);
      }
    };

    try {
      await navigator.clipboard.writeText(text);
      setToast({ isVisible: true, message: 'Copied to clipboard!', type: 'success' });
    } catch (err) {
      console.error('Failed to copy: ', err);
      setToast({ isVisible: true, message: 'Failed to copy', type: 'error' });
    }
  }, []);

  // Copy entire test data
  const copyTestData = React.useCallback(async (testData: TestData) => {
    const category = getCategoryById(testData.category_id);
    const module = getModuleById(testData.module_id);
    
    const copyText = `Test Case: ${testData.name}\nDescription: ${testData.description}\nModule: ${module?.name || 'N/A'}\nCategory: ${category?.name || 'N/A'}\n\nTest Data:\n${testData.test_data}\n\nExpected Result:\n${testData.expected}`;
    
    try {
      await navigator.clipboard.writeText(copyText);
      setToast({ isVisible: true, message: 'Test data copied to clipboard!', type: 'success' });
    } catch (err) {
      setToast({ isVisible: true, message: 'Failed to copy test data', type: 'error' });
    }
  }, [getCategoryById, getModuleById]);

  // Memoized texts object
  const texts = React.useMemo(() => ({
    dataTestManagement: 'Data Test Management',
    filter: 'Filter',
    product: 'Product',
    modules: 'Modules',
    categories: 'Categories',
    all: 'All',
    totalData: 'Total data',
    searchPlaceholder: 'Search...',
    addData: '+ Add data',
    setting: 'Setting',
    copyData: 'Copy Data',
    testCaseName: 'Test Case Name',
    description: 'Description',
    module: 'Module',
    testData: 'Test Data',
    expected: 'Expected',
    categoryTag: 'Category Tag',
    notFound: 'Not found..',
    notFoundDataTest: 'Not found data test',
    addNewTestData: '+ Add new test data',
    actions: 'Actions',
    copyTestData: 'Copy Test Data',
    editTestData: 'Edit',
  }), []);

  const totalCount = testData.length;

  // Memoized event handlers
  const closeToast = React.useCallback(() => {
    setToast({ isVisible: false, message: '', type: 'success' });
  }, []);

  const handleAddTestData = React.useCallback(() => {
    setEditingTestData(null);
    setShowTestDataModal(true);
  }, []);

  const handleImportExcel = React.useCallback(() => {
    setShowExcelImport(true);
  }, []);

  const handleImportSuccess = React.useCallback(async () => {
    // Reload test data after successful import
    try {
      const filters = {
        product_id: selectedProduct.id,
        module_id: selectedModule !== 'all' ? selectedModule : undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      };
      await onLoadTestData(filters);
      setToast({ isVisible: true, message: 'Excel data imported successfully!', type: 'success' });
    } catch (error) {
      console.error('Error reloading data after import:', error);
    }
  }, [selectedProduct, selectedModule, selectedCategory, searchQuery, onLoadTestData]);

  const handleEditTestData = React.useCallback((testData: TestData) => {
    setEditingTestData(testData);
    setShowTestDataModal(true);
  }, []);

  const handleDeleteTestData = React.useCallback(async (id: string) => {
    const testDataItem = testData.find(item => item.id === id);
    const itemName = testDataItem?.name || 'this item';

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Test Data',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          console.log('Deleting test data:', id);
          await deleteTestData(id);
          console.log('Test data delete request sent');
          setToast({ isVisible: true, message: `Test data "${itemName}" deleted successfully!`, type: 'success' });

          // Close confirm dialog
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });

          // Reload test data with current filters so UI updates immediately
          try {
            const filters = {
              product_id: selectedProduct.id,
              module_id: selectedModule !== 'all' ? selectedModule : undefined,
              category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
              search: searchQuery || undefined,
            };
            await onLoadTestData(filters);
            console.log('Test data reloaded after deletion');
          } catch (reloadErr) {
            console.error('Error reloading test data after deletion:', reloadErr);
          }

        } catch (error) {
          console.error('Error deleting test data:', error);
          setToast({ isVisible: true, message: `Failed to delete test data "${itemName}"`, type: 'error' });
        }
      }
    });
  }, [testData, deleteTestData, onLoadTestData, selectedProduct, selectedModule, selectedCategory, searchQuery]);

  const closeConfirmDialog = React.useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
    });
  }, []);

  const handleSaveTestData = React.useCallback(async (data: any) => {
    try {
      console.log('Saving test data:', data);
      if (editingTestData && editingTestData.id) {
        await updateTestData({ ...data, id: editingTestData.id });
        setToast({ isVisible: true, message: `Test data "${data.name}" updated successfully!`, type: 'success' });
      } else {
        await createTestData(data);
        setToast({ isVisible: true, message: `Test data "${data.name}" created successfully!`, type: 'success' });
      }
      setShowTestDataModal(false);
      console.log('Test data saved successfully');
      
      // Force reload test data with current filters after a short delay
      setTimeout(async () => {
        try {
          const filters = {
            product_id: selectedProduct.id,
            module_id: selectedModule !== 'all' ? selectedModule : undefined,
            category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery || undefined,
          };
          await onLoadTestData(filters);
          console.log('Test data manually refreshed after save');
        } catch (error) {
          console.error('Error manually refreshing test data:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Error saving test data:', error);
      setToast({ isVisible: true, message: `Failed to save test data "${data.name}"`, type: 'error' });
    }
  }, [editingTestData, updateTestData, createTestData, setShowTestDataModal, selectedProduct, selectedModule, selectedCategory, searchQuery, onLoadTestData]);

  const handleCopyTestData = React.useCallback((testData: TestData) => {
    // Create a copy object for new data creation
    const copyData = {
      ...testData,
      id: undefined, // Remove ID to create new data
      name: testData.name.startsWith('Copy of ') ? testData.name : `Copy of ${testData.name}`,
      created_at: undefined,
      updated_at: undefined
    };
    setEditingTestData(copyData as TestData);
    setShowTestDataModal(true);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Sidebar Filter */}
      <div className={`hidden lg:block ${isSidebarCollapsed ? 'w-0' : 'w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed top-0 left-0 h-screen transition-all duration-300 z-20 overflow-hidden`}>
        {!isSidebarCollapsed && (
          <div className="p-6 h-full flex flex-col">
            {/* Header with Collapse Button */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {texts.filter}
              </h2>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Hide Filter"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Product Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {texts.product}
                </label>
                <CustomProductDropdown
                  products={products}
                  selectedProduct={selectedProduct}
                  onProductChange={onProductChange}
                />
              </div>

              {/* Modules Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {texts.modules}
                </label>
                <CustomDropdown
                  options={filteredModules}
                  selectedValue={selectedModule}
                  onValueChange={onModuleChange}
                  allText={texts.all}
                  placeholder="Select Module"
                />
              </div>


              {/* Categories Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {texts.categories}
                </label>
                <CustomDropdown
                  options={categories}
                  selectedValue={selectedCategory}
                  onValueChange={onCategoryChange}
                  allText={texts.all}
                  placeholder="Select Category"
                />
              </div>
            </div>

            {/* Email (above separator) */}
            {email && (
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 py-4">{'Account: '+email}</div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {role !== 'reporter' && (
                <div>
                  <button
                    onClick={onNavigateToSettings}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{texts.setting}</span>
                  </button>
                </div>
              )}

              {/* Logout button (same style as Settings) */}
              <div>
                  <button
                    onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          onClick={() => setShowMobileFilter(!showMobileFilter)}
          className="bg-orange-500 text-white p-3 rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Expand Filter Button (when collapsed) */}
      {isSidebarCollapsed && (
        <div className="hidden lg:block fixed top-4 left-4 z-20">
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 group"
            title="Show Filter"
          >
            <Menu className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
          </button>
        </div>
      )}

      {/* Mobile Filter Overlay */}
      {showMobileFilter && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setShowMobileFilter(false)}>
          <div className="bg-white dark:bg-gray-800 w-80 h-full overflow-y-auto rounded-r-3xl shadow-2xl backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {texts.filter}
              </h2>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Filter Content - Same as desktop */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.product}
              </label>
              <CustomProductDropdown
                products={products}
                selectedProduct={selectedProduct}
                onProductChange={onProductChange}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.modules}
              </label>
              <CustomDropdown
                options={filteredModules}
                selectedValue={selectedModule}
                onValueChange={onModuleChange}
                allText={texts.all}
                placeholder="Select Module"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {texts.categories}
              </label>
              <CustomDropdown
                options={categories}
                selectedValue={selectedCategory}
                onValueChange={onCategoryChange}
                allText={texts.all}
                placeholder="Select Category"
              />
            </div>

            <div className="mt-auto pt-8 space-y-3">
              {role !== 'reporter' && (
                <button
                  onClick={onNavigateToSettings}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 dark:border-gray-600"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{texts.setting}</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 dark:border-gray-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 p-4 lg:p-6 ${!isSidebarCollapsed ? 'lg:ml-72' : 'lg:ml-12'} transition-all duration-300 min-h-screen`}>
        <div className="max-w-full">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-4 lg:mb-6 mt-16 lg:mt-0">
            {texts.dataTestManagement}
          </h1>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {texts.totalData}
              </h3>
              <p className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                {totalCount}
              </p>
            </div>
            {categoryStats.map(stat => (
              <div key={stat.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                  {stat.count}
                </p>
              </div>
            ))}
          </div>

          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={texts.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input-enhanced w-full pl-10 pr-4 py-2 lg:py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              {role !== 'reporter' && (
                <>
                  <button
                    onClick={handleImportExcel}
                    className="px-4 py-2 lg:py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Import Excel</span>
                  </button>
                  <button
                    onClick={handleAddTestData}
                    className="px-4 py-2 lg:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                  >
                    {texts.addData}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Test Data Cards or No Results */}
          {testData.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-4">
                  {texts.notFoundDataTest}
                </p>
                {role !== 'reporter' && (
                  <button
                    onClick={handleAddTestData}
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {texts.addNewTestData}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 pb-8">
              {testData.map((item) => {
                const category = getCategoryById(item.category_id);
                const module = getModuleById(item.module_id);
                
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Action Buttons - Top Right */}
                    <div className="flex justify-end items-center mb-4">
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {role !== 'reporter' && (
                          <>
                            <button
                              onClick={() => handleEditTestData(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyTestData(item)}
                              className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Copy Test Data"
                            >
                              <Files className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTestData(item.id)}
                              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Test Case Name - Below Action Buttons */}
                    <div className="mb-4">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white break-words line-clamp-2">
                        {item.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {texts.description}:
                      </p>
                      {item.description && item.description.trim() ? (
                        <div className="text-sm text-gray-800 dark:text-white break-words max-h-16 overflow-y-auto text-scroll-area bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                          {item.description}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
                      )}
                    </div>

                    {/* Module */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {texts.module}:
                      </p>
                      <p className="text-sm text-gray-800 dark:text-white break-words">
                        {module?.name}
                      </p>
                    </div>

                    {/* Test Data */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {texts.testData}:
                        </p>
                        <button
                          onClick={() => copyToClipboard(item.testData)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0"
                          title="Copy All Test Data"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 lg:p-3 rounded text-xs font-mono text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto scrollbar-hide">
                          {item.test_data && item.test_data.split('\n').map((line, index) => {
                            const [key, value] = line.split(': ');
                            if (key && value) {
                              return (
                                <div key={index} className="flex items-start justify-between py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-1 group">
                                  <span className="flex-1">
                                    <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                                    <span className="text-gray-800 dark:text-gray-200 break-all">{value}</span>
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(value.replace(/"/g, ''));
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all ml-2 flex-shrink-0"
                                    title={`Copy ${key} value`}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <div key={index} className="py-1 break-all">
                                {line}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Expected */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {texts.expected}:
                      </p>
                      {item.expected && item.expected.trim() ? (
                        <div className="text-sm text-gray-800 dark:text-white break-words max-h-16 overflow-y-auto text-scroll-area bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                          {item.expected}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
                      )}
                    </div>

                    {/* Category Tag */}
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {texts.categoryTag}:
                        </p>
                        {category && (
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-medium text-white break-words"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.tag}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Test Data Modal */}
      <TestDataModal
        isOpen={showTestDataModal}
        onClose={() => setShowTestDataModal(false)}
        onSave={handleSaveTestData}
        products={products}
        modules={modules}
        categories={categories}
        editData={editingTestData}
        onGetModulesByProduct={onGetModulesByProduct}
      />

      {/* Excel Import Modal */}
      <ExcelImport
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        products={products}
        modules={modules}
        categories={categories}
        selectedProduct={selectedProduct}
        onGetModulesByProduct={onGetModulesByProduct}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};