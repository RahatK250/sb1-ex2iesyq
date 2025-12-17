import React, { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Package, Layers, Tag, Link, Trash2, X, GripVertical } from 'lucide-react';
import { Product, Module, Category } from '../types';
import { useDatabase } from '../hooks/useDatabase';
import { ProductModal } from './modals/ProductModal';
import { ModuleModal } from './modals/ModuleModal';
import { CategoryModal } from './modals/CategoryModal';
import { ProductModuleModal } from './modals/ProductModuleModal';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

type SettingsTab = 'products' | 'modules' | 'categories' | 'product-modules';

interface SettingsProps {
  products: Product[];
  modules: Module[];
  categories: Category[];
  productModules: any[];
  onNavigateBack: () => void;
  initialTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

export function Settings({ 
  products, 
  modules, 
  categories, 
  productModules, 
  onNavigateBack,
  initialTab = 'products',
  onTabChange
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isProductModuleModalOpen, setIsProductModuleModalOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Update activeTab when initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle tab change
  const handleTabChange = async (tab: SettingsTab) => {
    if (tab === activeTab) return; // Don't change if same tab
    
    setIsTabChanging(true);
    setActiveTab(tab);
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      setIsTabChanging(false);
    });
    
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    createModule, 
    updateModule, 
    deleteModule, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    createProductModule,
    deleteProductModule,
    updateProductOrders,
    setProducts,
    setAllProducts,
    setAllModules,
    setAllCategories,
    refetchProducts,
    refetchModules,
    refetchCategories
  } = useDatabase();

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast({ isVisible: false, message: '', type: 'success' });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
    });
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      console.log('Toggling product:', product.name, 'from', product.is_active, 'to', !product.is_active);
      const updatedProduct = { ...product, is_active: !product.is_active };
      
      // Method 1: Optimistic update - แสดงผลทันที
      setAllProducts(prev => prev.map(p => 
        p.id === product.id ? updatedProduct : p
      ));
      
      // Send API request
      await updateProduct(updatedProduct);
      console.log('Product update successful');
      showToast(`Product "${product.name}" ${product.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      
      // Method 2: Optional refetch for critical data consistency
      // await refetchProducts();
      
    } catch (error) {
      console.error('Product update failed:', error);
      
      // Method 1: Rollback on error
      setAllProducts(prev => prev.map(p => 
        p.id === product.id ? product : p
      ));
      showToast(`Failed to update product "${product.name}" status`, 'error');
      
      // Method 2: Refetch on error to ensure consistency
      await refetchProducts();
    }
  };

  const handleToggleModule = async (module: Module) => {
    try {
      console.log('Toggling module:', module.name, 'from', module.is_active, 'to', !module.is_active);
      const updatedModule = { ...module, is_active: !module.is_active };
      
      // Method 1: Optimistic update - แสดงผลทันที
      setAllModules(prev => prev.map(m => 
        m.id === module.id ? updatedModule : m
      ));
      
      // Send API request
      await updateModule(updatedModule);
      console.log('Module update successful');
      showToast(`Module "${module.name}" ${module.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      
    } catch (error) {
      console.error('Module update failed:', error);
      
      // Method 1: Rollback on error
      setAllModules(prev => prev.map(m => 
        m.id === module.id ? module : m
      ));
      showToast(`Failed to update module "${module.name}" status`, 'error');
      
      // Method 2: Refetch on error to ensure consistency
      await refetchModules();
    }
  };

  const handleToggleCategory = async (category: Category) => {
    try {
      console.log('Toggling category:', category.name, 'from', category.is_active, 'to', !category.is_active);
      const updatedCategory = { ...category, is_active: !category.is_active };
      
      // Method 1: Optimistic update - แสดงผลทันที
      setAllCategories(prev => prev.map(c => 
        c.id === category.id ? updatedCategory : c
      ));
      
      // Send API request
      await updateCategory(updatedCategory);
      console.log('Category update successful');
      showToast(`Category "${category.name}" ${category.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      
    } catch (error) {
      console.error('Category update failed:', error);
      
      // Method 1: Rollback on error
      setAllCategories(prev => prev.map(c => 
        c.id === category.id ? category : c
      ));
      showToast(`Failed to update category "${category.name}" status`, 'error');
      
      // Method 2: Refetch on error to ensure consistency
      await refetchCategories();
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsModuleModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddNew = () => {
    switch (activeTab) {
      case 'products':
        setEditingProduct(null);
        setIsProductModalOpen(true);
        break;
      case 'modules':
        setEditingModule(null);
        setIsModuleModalOpen(true);
        break;
      case 'product-modules':
        setIsProductModuleModalOpen(true);
        break;
    }
  };

  const handleProductSave = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct({ ...data, id: editingProduct.id });
        
        // Force refresh หลังจากอัปเดตสำเร็จ
        setTimeout(async () => {
          try {
            await refetchProducts();
            console.log('Products refreshed after edit');
          } catch (refreshError) {
            console.error('Error refreshing products after edit:', refreshError);
          }
        }, 100);
        
        showToast(`Product "${data.name}" updated successfully`, 'success');
      } else {
        await createProduct(data);
        
        // Force refresh หลังจากสร้างสำเร็จ
        setTimeout(async () => {
          try {
            await refetchProducts();
            console.log('Products refreshed after create');
          } catch (refreshError) {
            console.error('Error refreshing products after create:', refreshError);
          }
        }, 100);
        
        showToast(`Product "${data.name}" created successfully`, 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      showToast(`Failed to save product "${data.name}"`, 'error');
    }
  };

  const handleModuleSave = async (data: any) => {
    try {
      if (editingModule) {
        await updateModule({ ...data, id: editingModule.id });
        showToast(`Module "${data.name}" updated successfully`, 'success');
      } else {
        await createModule(data);
        showToast(`Module "${data.name}" created successfully`, 'success');
      }
      setIsModuleModalOpen(false);
      setEditingModule(null);
    } catch (error) {
      showToast(`Failed to save module "${data.name}"`, 'error');
    }
  };

  const handleCategorySave = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategory({ ...data, id: editingCategory.id });
        showToast(`Category "${data.name}" updated successfully`, 'success');
      } else {
        await createCategory(data);
        showToast(`Category "${data.name}" created successfully`, 'success');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      showToast(`Failed to save category "${data.name}"`, 'error');
    }
  };

  const handleProductModuleSave = async (data: { product_id: string; module_id: string }) => {
    try {
      await createProductModule(data.product_id, data.module_id);
      const product = products.find(p => p.id === data.product_id);
      const module = modules.find(m => m.id === data.module_id);
      showToast(`Successfully assigned "${module?.name}" to "${product?.name}"`, 'success');
      setIsProductModuleModalOpen(false);
    } catch (error) {
      showToast('Failed to assign module to product', 'error');
    }
  };

  const handleDeleteProductModule = async (productId: string, moduleId: string) => {
    const product = products.find(p => p.id === productId);
    const module = modules.find(m => m.id === moduleId);
    
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Module Assignment',
      message: `Are you sure you want to remove "${module?.name}" from "${product?.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteProductModule(productId, moduleId);
          showToast(`Successfully removed "${module?.name}" from "${product?.name}"`, 'success');
        } catch (error) {
          showToast('Failed to remove module from product', 'error');
        }
      }
    });
  };

  // Product ordering functions
  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedProduct) return;
    
    const sortedProducts = [...products].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const dragIndex = sortedProducts.findIndex(p => p.id === draggedProduct.id);
    
    if (dragIndex === dropIndex) return;
    
    // Create new order
    const newProducts = [...sortedProducts];
    const [removed] = newProducts.splice(dragIndex, 1);
    newProducts.splice(dropIndex, 0, removed);
    
    // Update display_order for all products
    const updates = newProducts.map((product, index) => ({
      ...product,
      display_order: index + 1
    }));
    
    // Optimistic update - แสดงผลทันทีก่อนส่ง API
    setAllProducts(prev => {
      const updated = [...prev];
      updates.forEach(updatedProduct => {
        const index = updated.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          updated[index] = updatedProduct;
        }
      });
      return updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });
    
    // อัปเดต products state สำหรับ active products
    setProducts(prev => {
      const updated = [...prev];
      updates.forEach(updatedProduct => {
        if (updatedProduct.is_active) {
          const index = updated.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            updated[index] = updatedProduct;
          }
        }
      });
      return updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });
    
    try {
      await updateProductOrders(updates);
      
      // Force refresh ทันทีหลังจากอัปเดตสำเร็จ
      setTimeout(async () => {
        try {
          await refetchProducts();
          console.log('Products refreshed after order update');
        } catch (refreshError) {
          console.error('Error refreshing products after order update:', refreshError);
        }
      }, 100);
      
      showToast('Product order updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating product orders:', error);
      showToast('Failed to update product order', 'error');
      
      // Rollback on error - คืนค่าเดิมถ้าเกิดข้อผิดพลาด
      setAllProducts(prev => {
        const rollback = [...prev];
        sortedProducts.forEach(originalProduct => {
          const index = rollback.findIndex(p => p.id === originalProduct.id);
          if (index !== -1) {
            rollback[index] = originalProduct;
          }
        });
        return rollback.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });
      
      setProducts(prev => {
        const rollback = [...prev];
        sortedProducts.forEach(originalProduct => {
          if (originalProduct.is_active) {
            const index = rollback.findIndex(p => p.id === originalProduct.id);
            if (index !== -1) {
              rollback[index] = originalProduct;
            }
          }
        });
        return rollback.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });
    }
    
    setDraggedProduct(null);
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
    setDragOverIndex(null);
  };

  // Toggle Switch Component
  const ToggleSwitch = React.memo(({ 
    isActive, 
    onToggle, 
    disabled = false 
  }: { 
    isActive: boolean; 
    onToggle: () => void; 
    disabled?: boolean 
  }) => {
    console.log('ToggleSwitch render:', { isActive, disabled });
    
    return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive 
          ? 'bg-green-500 focus:ring-green-500' 
          : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-200 ease-in-out shadow-lg ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
    );
  });
  
  ToggleSwitch.displayName = 'ToggleSwitch';

  // Get modules for a specific product
  const getModulesForProduct = (productId: string) => {
    const assignedModules = productModules
      .filter(pm => pm.product_id === productId && pm.is_active)
      .map(pm => modules.find(m => m.id === pm.module_id))
      .filter(Boolean);
    
    // Remove duplicates by module id
    const uniqueModules = assignedModules.filter((module, index, self) => 
      index === self.findIndex(m => m?.id === module?.id)
    );
    
    return uniqueModules;
  };

  // Get products grouped with their modules
  const getProductsWithModules = () => {
    return products.map(product => ({
      ...product,
      modules: getModulesForProduct(product.id)
    }));
  };
  
  // Get sorted products for display
  const getSortedProducts = () => {
    return [...products].sort((a, b) => {
      const orderA = a.display_order || 0;
      const orderB = b.display_order || 0;
      return orderA - orderB;
    });
  };
  
  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package, data: products },
    { id: 'modules' as const, label: 'Modules', icon: Layers, data: modules },
    { id: 'product-modules' as const, label: 'Product Modules', icon: Link, data: productModules },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />

      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px px-4 lg:px-6">
              {/* Mobile: Grid Layout */}
              <div className="grid grid-cols-2 gap-2 sm:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-3 px-3 border-b-2 font-medium text-sm flex flex-col items-center space-y-1 whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'rotate-12' : ''}`} />
                    <span className="text-xs leading-tight text-center">{tab.label}</span>
                  </button>
                );
              })}
              </div>
              
              {/* Desktop: Flex Layout */}
              <div className="hidden sm:flex space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-3 sm:py-4 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-12' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              </div>
            </nav>
          </div>

          {/* Tab Content */}
          <div className={`p-4 lg:p-6 transition-opacity duration-200 ${isTabChanging ? 'opacity-50' : 'opacity-100'}`}>
            {/* Product Modules Tab - Special Layout */}
            {activeTab === 'product-modules' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white">
                      Product Module Assignments
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage which modules are available for each product
                    </p>
                  </div>
                  <button
                    onClick={handleAddNew}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Module</span>
                  </button>
                </div>

                {/* Products with their modules */}
                <div className="space-y-6">
                  {getProductsWithModules().filter(product => product.is_active).map((product) => (
                    <div
                      key={product.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-600"
                    >
                      {/* Product Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.modules.length} modules assigned
                          </p>
                        </div>
                      </div>

                      {/* Assigned Modules */}
                      {product.modules.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {product.modules.map((module: any) => (
                            <div
                              key={module.id}
                              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <Layers className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {module.name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteProductModule(product.id, module.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove module"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No modules assigned to this product
                          </p>
                          <button
                            onClick={() => setIsProductModuleModalOpen(true)}
                            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                          >
                            Assign modules
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {products.filter(p => p.is_active).length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No active products found. Create or activate products first to assign modules.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Other Tabs - Regular Layout */}
            {activeTab !== 'product-modules' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white">
                      Manage {activeTabData?.label}
                    </h2>
                    {activeTab === 'products' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Drag and drop to reorder products
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleAddNew}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New</span>
                  </button>
                </div>

                {/* Data Cards */}
                {activeTab === 'products' ? (
                  // Products with drag and drop
                  <div className="space-y-4">
                    {getSortedProducts().map((item: any, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 lg:p-6 hover:shadow-lg transition-all duration-200 cursor-move ${
                          dragOverIndex === index ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''
                        } ${draggedProduct?.id === item.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Drag Handle */}
                          <div className="flex-shrink-0">
                            <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          </div>
                          
                          {/* Product Logo */}
                          <div className="flex-shrink-0">
                            <img
                              src={item.logo}
                              alt={item.name}
                              className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Order: #{item.display_order || 0}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Created: {new Date(item.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 break-all line-clamp-1 mt-1">
                              {item.logo}
                            </p>
                          </div>
                          
                          {/* Status and Actions */}
                          <div className="flex items-center space-x-4 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                <span className={`font-medium ${item.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {item.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </span>
                              <ToggleSwitch
                                isActive={item.is_active}
                                onToggle={() => handleToggleProduct(item)}
                              />
                            </div>
                            
                            <button
                              onClick={() => handleEditProduct(item)}
                              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 rounded-md transition-colors whitespace-nowrap"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Other tabs with grid layout
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {activeTabData?.data.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 lg:p-6 hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Created: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <span className={`font-medium ${item.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </span>
                          {(() => {
                            const currentTab = activeTab as 'products' | 'modules' | 'categories';
                            return (
                              <ToggleSwitch
                                isActive={item.is_active}
                                onToggle={() => {
                                  console.log(`Toggling ${currentTab}:`, item.name, 'from', item.is_active, 'to', !item.is_active);
                                  if (currentTab === 'products') {
                                    handleToggleProduct(item as Product);
                                  } else if (currentTab === 'modules') {
                                    handleToggleModule(item as Module);
                                  } else if (currentTab === 'categories') {
                                    handleToggleCategory(item as Category);
                                  }
                                }}
                              />
                            );
                          })()}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        {activeTab === 'products' && (
                          <div className="flex items-start space-x-3">
                            <img
                              src={item.logo}
                              alt={item.name}
                              className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Logo URL</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 break-all line-clamp-2">
                                {item.logo}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            if (activeTab === 'products') handleEditProduct(item);
                            else if (activeTab === 'modules') handleEditModule(item);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 rounded-md transition-colors whitespace-nowrap"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {activeTabData?.data.length === 0 && (
                  <div className="text-center py-8 lg:py-12">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:p-8">
                      <div className="text-gray-500 dark:text-gray-400 mb-4">
                        No {activeTabData.label.toLowerCase()} found.
                      </div>
                      <button
                        onClick={handleAddNew}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New {activeTabData.label.slice(0, -1)}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleProductSave}
        editData={editingProduct}
      />

      <ModuleModal
        isOpen={isModuleModalOpen}
        onClose={() => {
          setIsModuleModalOpen(false);
          setEditingModule(null);
        }}
        onSave={handleModuleSave}
        editData={editingModule}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleCategorySave}
        editData={editingCategory}
      />

      <ProductModuleModal
        isOpen={isProductModuleModalOpen}
        onClose={() => setIsProductModuleModalOpen(false)}
        onSave={handleProductModuleSave}
        products={products}
        modules={modules}
        onAddModule={() => {
          // Switch to Modules tab and open Add Module modal
          handleTabChange('modules');
          setIsModuleModalOpen(true);
          setIsProductModuleModalOpen(false);
        }}
      />
    </div>
  );
}