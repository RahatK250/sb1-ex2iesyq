import React, { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Package, Layers, Tag, Link, Trash2, X, GripVertical, GitBranch } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Product, Module, Category, SubModule } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { ProductModal } from '../components/modals/ProductModal';
import { ModuleModal } from '../components/modals/ModuleModal';
import { CategoryModal } from '../components/modals/CategoryModal';
import { ProductModuleModal } from '../components/modals/ProductModuleModal';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CustomDropdown } from '../components/CustomDropdown';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { ProductFilterDropdown } from '../components/ProductFilterDropdown';

type SettingsTab = 'products' | 'modules' | 'categories' | 'product-modules' | 'sub-modules';

interface SettingsProps {
  products: Product[];
  modules: Module[];
  categories: Category[];
  productModules: any[];
  onNavigateBack: () => void;
  initialTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

export function SettingsPage({ 
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
  const [isSubModuleModalOpen, setIsSubModuleModalOpen] = useState(false);
  const [editingSubModule, setEditingSubModule] = useState<SubModule | null>(null);
  const [subModuleForm, setSubModuleForm] = useState({ name: '' });
  // Per-module multi-select link state: { [moduleId]: string[] of selected sub module ids }
  const [subModuleLibraryModalOpen, setSubModuleLibraryModalOpen] = useState(false);
  const [subModuleLibrarySearch, setSubModuleLibrarySearch] = useState('');

  // Product Module "View All" modal — stores the product being expanded (null = closed)
  const [productModuleViewAllId, setProductModuleViewAllId] = useState<string | null>(null);
  const [productModuleViewAllSearch, setProductModuleViewAllSearch] = useState('');

  useScrollLock(subModuleLibraryModalOpen);
  useScrollLock(isSubModuleModalOpen);
  useScrollLock(!!productModuleViewAllId);
  const [subModuleLinkSelections, setSubModuleLinkSelections] = useState<Record<string, string[]>>({});
  const [subModuleLinkLoadingModuleId, setSubModuleLinkLoadingModuleId] = useState<string | null>(null);
  const [subModuleModuleSearch, setSubModuleModuleSearch] = useState('');
  const [subModuleProductFilter, setSubModuleProductFilter] = useState<string>('all');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: undefined as string | undefined,
    cancelText: undefined as string | undefined,
    type: undefined as 'danger' | 'warning' | 'info' | undefined
  });
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [optimisticDesired, setOptimisticDesired] = useState<Record<string, boolean>>({});
  const [optimisticLoading, setOptimisticLoading] = useState<Record<string, boolean>>({});
  const [inlineModuleProductId, setInlineModuleProductId] = useState<string | null>(null);
  const [inlineModuleName, setInlineModuleName] = useState('');
  const [inlineModuleLoading, setInlineModuleLoading] = useState(false);

  // Update activeTab when initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Ensure page is scrolled to top when Settings mounts (or when activated)
  React.useEffect(() => {
    try {
      // scroll window and common containers to top to avoid retained scroll position
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (document && document.documentElement) document.documentElement.scrollTop = 0;
      if (document && document.body) document.body.scrollTop = 0;
      // if there's a main app container with overflow, try to clear it as well
      const appRoot = document.getElementById('root') || document.querySelector('body');
      if (appRoot) (appRoot as HTMLElement).scrollTop = 0;
    } catch (e) {
      // noop
    }
  }, []);

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
    products: dbProducts,
    allProducts,
    modules: dbModules,
    allModules,
    categories: dbCategories,
    allCategories,
    productModules: dbProductModules,
    subModules: dbSubModules,
    allSubModules,
    moduleSubModules: dbModuleSubModules,
    loading: dbLoading,
    createModule,
    updateModule,
    deleteModule,
    createCategory,
    updateCategory,
    deleteCategory,
    createProductModule,
    deleteProductModule,
    createSubModule,
    updateSubModule,
    deleteSubModule,
    createModuleSubModule,
    deleteModuleSubModule,
    updateProductOrders,
    checkSubModuleInUse,
    setProducts,
    setModules,
    setAllProducts,
    setAllModules,
    setAllCategories,
    refetchProducts,
    refetchModules,
    refetchCategories
  } = useDatabaseContext();

  const { user: currentUser } = useAuth();
  const userLabel = currentUser?.displayName ?? currentUser?.email ?? undefined;

  const [statusFilter, setStatusFilter] = React.useState<'active' | 'inactive' | 'all'>('active');

  // When user switches to 'inactive' or 'all' while on Modules/Categories tabs,
  // ensure the admin lists are refetched so `allModules` / `allCategories` are populated.
  React.useEffect(() => {
    if (statusFilter === 'active') return;

    // Only refetch the relevant admin list for the active tab
    (async () => {
      try {
        if (activeTab === 'modules') {
          await refetchModules();
        } else if (activeTab === 'categories') {
          await refetchCategories();
        } else if (activeTab === 'products') {
          await refetchProducts();
        }
      } catch (err) {
        console.error('Error refetching admin lists for status filter change:', err);
      }
    })();
  }, [statusFilter, activeTab, refetchModules, refetchCategories, refetchProducts]);

  // Use hook state only — hook owns a separate useDatabase() instance with Realtime subscriptions
  const activeProducts = dbProducts;
  const activeModules = dbModules;
  const activeCategories = dbCategories;
  const activeProductModules = dbProductModules;
  const activeSubModules = dbSubModules || [];
  const activeModuleSubModules = dbModuleSubModules || [];

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
    // Use optimistic update then refetch to ensure canonical state
    console.log('Toggling product:', product.name, 'from', product.is_active, 'to', !product.is_active);
    const updatedProduct = { ...product, is_active: !product.is_active };

    // Optimistic update - update both allProducts (admin list) and products (visible active list)
    setAllProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
    setProducts(prev => 
      updatedProduct.is_active
        ? prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).concat(prev.find(p => p.id === updatedProduct.id) ? [] : [updatedProduct])
        : prev.filter(p => p.id !== updatedProduct.id)
    );
    try {
      const updated = await updateProduct(updatedProduct);
      console.log('Product update successful');
      showToast(`Product "${product.name}" ${product.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');

      // After the update, refetch canonical products to ensure UI matches server
      try {
        await refetchProducts();
      } catch (refetchErr) {
        console.error('Error refetching products after update:', refetchErr);
      }

      // clear optimistic state for this product after refetch
      console.log('Clearing optimistic state for product', product.id);
      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
    } catch (error) {
      console.error('Product update failed:', error);
      // Rollback optimistic update
      setAllProducts(prev => prev.map(p => p.id === product.id ? product : p));
      showToast(`Failed to update product "${product.name}" status`, 'error');

      // Try to make sure we have canonical data
      try {
        await refetchProducts();
      } catch (refetchErr) {
        console.error('Error refetching products after failed update:', refetchErr);
      }

      // clear optimistic state on error as well
      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
    }
  };

  const handleToggleModule = async (module: Module) => {
    console.log('Toggling module:', module.name, 'from', module.is_active, 'to', !module.is_active);
    const updatedModule = { ...module, is_active: !module.is_active };
    setAllModules(prev => prev.map(m => m.id === module.id ? updatedModule : m));
    setModules(prev => 
      updatedModule.is_active
        ? prev.map(m => m.id === updatedModule.id ? updatedModule : m).concat(prev.find(m => m.id === updatedModule.id) ? [] : [updatedModule])
        : prev.filter(m => m.id !== updatedModule.id)
    );
    try {
      const updated = await updateModule(updatedModule);
      console.log('Module update successful');
      showToast(`Module "${module.name}" ${module.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');

      // Refetch modules to sync canonical state
      try {
        await refetchModules();
      } catch (refetchErr) {
        console.error('Error refetching modules after update:', refetchErr);
      }

      console.log('Clearing optimistic state for module', module.id);
      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[module.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[module.id];
        return copy;
      });
    } catch (error) {
      console.error('Module update failed:', error);
      setAllModules(prev => prev.map(m => m.id === module.id ? module : m));
      showToast(`Failed to update module "${module.name}" status`, 'error');
      try {
        await refetchModules();
      } catch (refetchErr) {
        console.error('Error refetching modules after failed update:', refetchErr);
      }

      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[module.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[module.id];
        return copy;
      });
    }
  };

  const handleToggleCategory = async (category: Category) => {
    console.log('Toggling category:', category.name, 'from', category.is_active, 'to', !category.is_active);
    const updatedCategory = { ...category, is_active: !category.is_active };
    setAllCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));
    setCategories(prev => 
      updatedCategory.is_active
        ? prev.map(c => c.id === updatedCategory.id ? updatedCategory : c).concat(prev.find(c => c.id === updatedCategory.id) ? [] : [updatedCategory])
        : prev.filter(c => c.id !== updatedCategory.id)
    );
    try {
      const updated = await updateCategory(updatedCategory);
      console.log('Category update successful');
      showToast(`Category "${category.name}" ${category.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');

      // Refetch categories to sync canonical state
      try {
        await refetchCategories();
      } catch (refetchErr) {
        console.error('Error refetching categories after update:', refetchErr);
      }

      console.log('Clearing optimistic state for category', category.id);
      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[category.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[category.id];
        return copy;
      });
    } catch (error) {
      console.error('Category update failed:', error);
      setAllCategories(prev => prev.map(c => c.id === category.id ? category : c));
      showToast(`Failed to update category "${category.name}" status`, 'error');
      try {
        await refetchCategories();
      } catch (refetchErr) {
        console.error('Error refetching categories after failed update:', refetchErr);
      }

      setOptimisticDesired(prev => {
        const copy = { ...prev };
        delete copy[category.id];
        return copy;
      });
      setOptimisticLoading(prev => {
        const copy = { ...prev };
        delete copy[category.id];
        return copy;
      });
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
      case 'sub-modules':
        setEditingSubModule(null);
        setSubModuleForm({ name: '' });
        setIsSubModuleModalOpen(true);
        break;
    }
  };

  const handleSubModuleSave = async () => {
    if (!subModuleForm.name.trim()) return;
    try {
      if (editingSubModule) {
        await updateSubModule({ id: editingSubModule.id, name: subModuleForm.name.trim(), updated_by: userLabel });
        showToast(`Sub Module "${subModuleForm.name}" updated`, 'success');
      } else {
        await createSubModule({ name: subModuleForm.name.trim(), created_by: userLabel, updated_by: userLabel });
        showToast(`Sub Module "${subModuleForm.name}" created`, 'success');
      }
      setIsSubModuleModalOpen(false);
      setEditingSubModule(null);
    } catch {
      showToast('Failed to save sub module', 'error');
    }
  };

  const handleDeleteSubModule = async (sm: SubModule) => {
    try {
      const count = await checkSubModuleInUse(sm.id);
      if (count > 0) {
        showToast(`Cannot delete "${sm.name}" — it is used in ${count} coverage item(s). Remove from test coverage first.`, 'error');
        return;
      }
    } catch {
      showToast('Failed to check sub module usage', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sub Module',
      message: `Delete "${sm.name}"? This will also remove all its module links.`,
      onConfirm: async () => {
        try {
          await deleteSubModule(sm.id);
          showToast(`"${sm.name}" deleted`, 'success');
        } catch { showToast('Failed to delete sub module', 'error'); }
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  };

  const handleLinkSubModule = async (moduleId: string) => {
    const selectedIds = subModuleLinkSelections[moduleId] ?? [];
    if (!moduleId || selectedIds.length === 0) return;
    setSubModuleLinkLoadingModuleId(moduleId);
    try {
      await Promise.all(selectedIds.map(smId => createModuleSubModule(moduleId, smId)));
      const mod = activeModules.find(m => m.id === moduleId);
      showToast(
        selectedIds.length === 1
          ? `Linked "${(activeSubModules ?? []).find(s => s.id === selectedIds[0])?.name}" to "${mod?.name}"`
          : `Linked ${selectedIds.length} sub modules to "${mod?.name}"`,
        'success'
      );
      setSubModuleLinkSelections(prev => ({ ...prev, [moduleId]: [] }));
    } catch { showToast('Failed to link sub module', 'error'); }
    finally { setSubModuleLinkLoadingModuleId(null); }
  };

  const handleUnlinkSubModule = async (moduleId: string, subModuleId: string) => {
    const mod = activeModules.find(m => m.id === moduleId);
    const sm = activeSubModules.find(s => s.id === subModuleId);
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Link',
      message: `Remove "${sm?.name}" from "${mod?.name}"?`,
      onConfirm: async () => {
        try {
          await deleteModuleSubModule(moduleId, subModuleId);
          showToast('Link removed', 'success');
        } catch { showToast('Failed to remove link', 'error'); }
      },
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
    });
  };

  const handleInlineAddModule = async (productId: string) => {
    const name = inlineModuleName.trim();
    if (!name) return;
    setInlineModuleLoading(true);
    try {
      // 1. Create the module
      const newModule = await createModule({ name, created_by: userLabel, updated_by: userLabel });
      // 2. Link it to the product
      await createProductModule(productId, newModule.id);
      showToast(`Module "${name}" created and assigned`, 'success');
      setInlineModuleProductId(null);
      setInlineModuleName('');
    } catch {
      showToast('Failed to create module', 'error');
    } finally {
      setInlineModuleLoading(false);
    }
  };

  const handleProductSave = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct({ ...data, id: editingProduct.id, updated_by: userLabel });

        setTimeout(async () => {
          try {
            await refetchProducts();
          } catch (refreshError) {
            console.error('Error refreshing products after edit:', refreshError);
          }
        }, 100);

        showToast(`Product "${data.name}" updated successfully`, 'success');
      } else {
        await createProduct({ ...data, created_by: userLabel, updated_by: userLabel });

        setTimeout(async () => {
          try {
            await refetchProducts();
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
        await updateModule({ ...data, id: editingModule.id, updated_by: userLabel });
        showToast(`Module "${data.name}" updated successfully`, 'success');
      } else {
        await createModule({ ...data, created_by: userLabel, updated_by: userLabel });
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
        await updateCategory({ ...data, id: editingCategory.id, updated_by: userLabel });
        showToast(`Category "${data.name}" updated successfully`, 'success');
      } else {
        await createCategory({ ...data, created_by: userLabel, updated_by: userLabel });
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
      },
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger'
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
    disabled = false,
    loading = false
  }: { 
    isActive: boolean; 
    onToggle: () => void; 
    disabled?: boolean,
    loading?: boolean
  }) => {
    console.log('ToggleSwitch render:', { isActive, disabled, loading });
    
    return (
      <button
        onClick={onToggle}
        disabled={disabled || loading}
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

        {loading && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        )}
      </button>
    );
  });
  
  ToggleSwitch.displayName = 'ToggleSwitch';

  // Get modules for a specific product
  const getModulesForProduct = (productId: string) => {
    const assignedModules = activeProductModules
      .filter(pm => pm.product_id === productId && pm.is_active)
      .map(pm => activeModules.find(m => m.id === pm.module_id))
      .filter(Boolean);
    
    // Remove duplicates by module id
    const uniqueModules = assignedModules.filter((module, index, self) => 
      index === self.findIndex(m => m?.id === module?.id)
    );
    
    return uniqueModules;
  };

  // Get products grouped with their modules
  const getProductsWithModules = () => {
    // Always source from allProducts (hook owns the data); filter by statusFilter
    const sourceProducts = statusFilter === 'active'
      ? allProducts.filter(p => p.is_active)
      : statusFilter === 'inactive'
        ? allProducts.filter(p => !p.is_active)
        : allProducts;

    return sourceProducts.map(product => ({
      ...product,
      modules: getModulesForProduct(product.id)
    }));
  };

  // Get sorted products for display
  const getSortedProducts = () => {
    const source = statusFilter === 'active'
      ? allProducts.filter(p => p.is_active)
      : statusFilter === 'inactive'
        ? allProducts.filter(p => !p.is_active)
        : allProducts;

    return [...source].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };
  
  const tabs = [
    { id: 'products' as const, label: 'Products', icon: Package, data: activeProducts },
    { id: 'modules' as const, label: 'Modules', icon: Layers, data: activeModules },
    { id: 'product-modules' as const, label: 'Product Modules', icon: Link, data: activeProductModules },
    { id: 'sub-modules' as const, label: 'Sub Modules', icon: GitBranch, data: activeSubModules },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Compute displayed items for non-products tabs using statusFilter
  const displayedGridItems = React.useMemo(() => {
    if (activeTab === 'products') return getSortedProducts();

    // For modules/categories, the hook provides both active lists (activeModules/activeCategories)
    // and admin lists (allModules/allCategories). When filtering for inactive or all, prefer the
    // admin lists so inactive items are included; otherwise use the active list.
    if (activeTab === 'modules') {
      const src = (statusFilter === 'all' || statusFilter === 'inactive')
        ? (allModules && allModules.length > 0 ? allModules : activeModules)
        : activeModules;
      if (statusFilter === 'all') return src;
      if (statusFilter === 'active') return src.filter((d: any) => d.is_active);
      if (statusFilter === 'inactive') return src.filter((d: any) => !d.is_active);
      return src;
    }

    if (activeTab === 'categories') {
      const src = (statusFilter === 'all' || statusFilter === 'inactive')
        ? (allCategories && allCategories.length > 0 ? allCategories : activeCategories)
        : activeCategories;
      if (statusFilter === 'all') return src;
      if (statusFilter === 'active') return src.filter((d: any) => d.is_active);
      if (statusFilter === 'inactive') return src.filter((d: any) => !d.is_active);
      return src;
    }

    // product-modules: use productModules (includes is_active flag), filter directly
    if (activeTab === 'product-modules') {
      const src = activeProductModules || [];
      if (statusFilter === 'all') return src;
      if (statusFilter === 'active') return src.filter((d: any) => d.is_active);
      if (statusFilter === 'inactive') return src.filter((d: any) => !d.is_active);
      return src;
    }

    return activeTabData?.data || [];
  }, [activeTab, activeTabData, statusFilter]);

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
        confirmText={confirmDialog.confirmText ?? 'Confirm'}
        cancelText={confirmDialog.cancelText ?? 'Cancel'}
        type={confirmDialog.type ?? 'danger'}
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
            {/* Product Modules Tab */}
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

                {/* View All modal — expands a single product's full module list */}
                {productModuleViewAllId && (() => {
                  const viewProduct = getProductsWithModules().find(p => p.id === productModuleViewAllId);
                  if (!viewProduct) return null;
                  const filtered = viewProduct.modules.filter((m: any) =>
                    productModuleViewAllSearch === '' ||
                    m.name.toLowerCase().includes(productModuleViewAllSearch.toLowerCase())
                  );
                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setProductModuleViewAllId(null); setProductModuleViewAllSearch(''); }} />
                      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]">
                        {/* Modal Header */}
                        <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                          <img
                            src={viewProduct.logo}
                            alt={viewProduct.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{viewProduct.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{viewProduct.modules.length} modules assigned</p>
                          </div>
                          <button
                            onClick={() => { setProductModuleViewAllId(null); setProductModuleViewAllSearch(''); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {/* Search */}
                        <div className="px-6 py-3 flex-shrink-0">
                          <input
                            type="text"
                            placeholder="Search modules..."
                            value={productModuleViewAllSearch}
                            onChange={e => setProductModuleViewAllSearch(e.target.value)}
                            className="select-enhanced w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
                          />
                        </div>
                        {/* Grid */}
                        <div className="overflow-y-auto px-6 pb-6 scroll-dashboard">
                          {filtered.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {filtered.map((module: any) => (
                                <div key={module.id}
                                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{module.name}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteProductModule(viewProduct.id, module.id)}
                                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                    title="Remove module">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-8">No modules found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Products with their modules */}
                <div className="space-y-6">
                  {getProductsWithModules().filter(product => product.is_active).map((product) => {
                    const SHOW_ALL_THRESHOLD = 9; // > 3 rows (3 cols × 3 rows = 9)
                    const hasViewAll = product.modules.length > SHOW_ALL_THRESHOLD;

                    return (
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
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.modules.length} modules assigned
                          </p>
                        </div>
                        {hasViewAll && (
                          <button
                            onClick={() => { setProductModuleViewAllId(product.id); setProductModuleViewAllSearch(''); }}
                            className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors flex-shrink-0"
                          >
                            View All →
                          </button>
                        )}
                      </div>

                      {/* Assigned Modules — max 4 rows, scrollable */}
                      {product.modules.length > 0 ? (
                        <div className="max-h-[248px] overflow-y-auto scroll-dashboard rounded-lg">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {product.modules.map((module: any) => (
                              <div
                                key={module.id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <Layers className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {module.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteProductModule(product.id, module.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                  title="Remove module"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
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
                      {/* Inline quick-add module */}
                      {inlineModuleProductId === product.id ? (
                        <div className="mt-4 flex gap-2 items-center">
                          <input
                            autoFocus
                            type="text"
                            placeholder="New module name…"
                            value={inlineModuleName}
                            onChange={e => setInlineModuleName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleInlineAddModule(product.id);
                              if (e.key === 'Escape') { setInlineModuleProductId(null); setInlineModuleName(''); }
                            }}
                            className="select-enhanced flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
                          />
                          <button
                            onClick={() => handleInlineAddModule(product.id)}
                            disabled={inlineModuleLoading || !inlineModuleName.trim()}
                            className="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0">
                            {inlineModuleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add
                          </button>
                          <button onClick={() => { setInlineModuleProductId(null); setInlineModuleName(''); }}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setInlineModuleProductId(product.id); setInlineModuleName(''); }}
                          className="mt-4 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                          <Plus className="w-4 h-4" />
                          Quick Add Module
                        </button>
                      )}
                    </div>
                    );
                  })}
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

            {/* Sub Modules Tab */}
            {activeTab === 'sub-modules' && (
              <>
                {/* Sub Module inline modal */}
                {isSubModuleModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSubModuleModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        {editingSubModule ? 'Edit Sub Module' : 'Add Sub Module'}
                      </h3>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                      <input
                        type="text" autoFocus
                        value={subModuleForm.name}
                        onChange={e => setSubModuleForm({ name: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleSubModuleSave()}
                        placeholder="e.g. Detail View, Create Modal…"
                        className="input-enhanced w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-5"
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setIsSubModuleModalOpen(false)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          Cancel
                        </button>
                        <button onClick={handleSubModuleSave} disabled={!subModuleForm.name.trim()}
                          className="px-5 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-colors">
                          {editingSubModule ? 'Save' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Sub Module Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create sub modules and link them to modules for detailed coverage tracking</p>
                  </div>
                  <button onClick={handleAddNew}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus className="w-4 h-4" />
                    Add Sub Module
                  </button>
                </div>

                {/* Sub Modules library */}
                <div className="mb-8">
                  {/* View All Modal */}
                  {subModuleLibraryModalOpen && (() => {
                    const filtered = (allSubModules || []).filter((sm: SubModule) =>
                      sm.is_active !== false &&
                      (subModuleLibrarySearch === '' || sm.name.toLowerCase().includes(subModuleLibrarySearch.toLowerCase()))
                    );
                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onWheel={e => e.stopPropagation()}
                        onTouchMove={e => e.stopPropagation()}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setSubModuleLibraryModalOpen(false); setSubModuleLibrarySearch(''); }} />
                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]">
                          {/* Modal Header */}
                          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sub Module Library</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(allSubModules || []).filter((sm: SubModule) => sm.is_active !== false).length} sub modules total</p>
                            </div>
                            <button onClick={() => { setSubModuleLibraryModalOpen(false); setSubModuleLibrarySearch(''); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {/* Search */}
                          <div className="px-6 py-3 flex-shrink-0">
                            <input
                              type="text"
                              placeholder="Search sub modules..."
                              value={subModuleLibrarySearch}
                              onChange={e => setSubModuleLibrarySearch(e.target.value)}
                              className="select-enhanced w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
                            />
                          </div>
                          {/* Grid */}
                          <div className="overflow-y-auto px-6 pb-6 scroll-dashboard">
                            {filtered.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {filtered.map((sm: SubModule) => (
                                  <div key={sm.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{sm.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button onClick={() => { setEditingSubModule(sm); setSubModuleForm({ name: sm.name }); setIsSubModuleModalOpen(true); setSubModuleLibraryModalOpen(false); }}
                                        className="p-1.5 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => { handleDeleteSubModule(sm); }}
                                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 text-center py-8">No sub modules found</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Library header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Sub Module Library
                      {allSubModules && allSubModules.filter((sm: SubModule) => sm.is_active !== false).length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                          ({allSubModules.filter((sm: SubModule) => sm.is_active !== false).length})
                        </span>
                      )}
                    </h3>
                    {(allSubModules || []).filter((sm: SubModule) => sm.is_active !== false).length > 12 && (
                      <button onClick={() => setSubModuleLibraryModalOpen(true)}
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
                        View All →
                      </button>
                    )}
                  </div>

                  {(allSubModules && allSubModules.length > 0) ? (
                    <>
                      {/* Scrollable grid — max 4 rows */}
                      <div className="max-h-[248px] overflow-y-auto scroll-dashboard rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(allSubModules || []).filter((sm: SubModule) => sm.is_active !== false).map((sm: SubModule) => (
                            <div key={sm.id} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{sm.name}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingSubModule(sm); setSubModuleForm({ name: sm.name }); setIsSubModuleModalOpen(true); }}
                                  className="p-1.5 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteSubModule(sm)}
                                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <GitBranch className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No sub modules yet. Click "Add Sub Module" to create one.</p>
                    </div>
                  )}
                </div>

                {/* Module Assignments */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Module Assignments</h3>

                  {/* Filter bar: Product filter + Search */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Product filter */}
                    <ProductFilterDropdown
                      products={activeProducts.filter((p: any) => p.is_active !== false)}
                      selectedValue={subModuleProductFilter}
                      onValueChange={(v) => setSubModuleProductFilter(v)}
                      allText="All Products"
                      className="sm:w-56"
                    />

                    {/* Module search */}
                    <div className="relative flex-1">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search modules…"
                        value={subModuleModuleSearch}
                        onChange={e => setSubModuleModuleSearch(e.target.value)}
                        className="select-enhanced w-full h-[46px] pl-10 pr-9 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm"
                      />
                      {subModuleModuleSearch && (
                        <button onClick={() => setSubModuleModuleSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtered module list */}
                  {(() => {
                    // Get module IDs that belong to at least one active product
                    const modulesWithProduct = new Set(
                      activeProductModules
                        .filter((pm: any) => pm.is_active !== false)
                        .map((pm: any) => pm.module_id)
                    );

                    // Get module IDs visible for the selected product filter
                    const productFilteredModuleIds = subModuleProductFilter === 'all'
                      ? null
                      : activeProductModules
                          .filter((pm: any) => pm.product_id === subModuleProductFilter && pm.is_active !== false)
                          .map((pm: any) => pm.module_id);

                    const visibleModules = activeModules.filter((m: Module) => {
                      if (m.is_active === false) return false;
                      // Always hide modules that are not linked to any product
                      if (!modulesWithProduct.has(m.id)) return false;
                      if (productFilteredModuleIds && !productFilteredModuleIds.includes(m.id)) return false;
                      if (subModuleModuleSearch.trim()) {
                        return m.name.toLowerCase().includes(subModuleModuleSearch.toLowerCase());
                      }
                      return true;
                    });

                    if (visibleModules.length === 0) {
                      return (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subModuleModuleSearch || subModuleProductFilter !== 'all'
                              ? 'No modules match the current filter.'
                              : 'No active modules. Create modules first.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {visibleModules.map((mod: Module) => {
                          const linkedSubModuleIds = activeModuleSubModules
                            .filter((msm: any) => msm.module_id === mod.id && msm.is_active !== false)
                            .map((msm: any) => msm.sub_module_id);
                          const linkedSubModules = (allSubModules || []).filter((sm: SubModule) => linkedSubModuleIds.includes(sm.id));
                          // 1:1 rule — exclude sub modules already linked to ANY module
                          const globallyLinkedIds = new Set(
                            activeModuleSubModules
                              .filter((msm: any) => msm.is_active !== false)
                              .map((msm: any) => msm.sub_module_id)
                          );
                          const unlinkedSubModules = (allSubModules || []).filter((sm: SubModule) => sm.is_active !== false && !globallyLinkedIds.has(sm.id));

                          // Find product(s) this module belongs to
                          const modProductIds = activeProductModules
                            .filter((pm: any) => pm.module_id === mod.id && pm.is_active !== false)
                            .map((pm: any) => pm.product_id);
                          const modProducts = activeProducts.filter((p: any) => modProductIds.includes(p.id));

                          return (
                            <div key={mod.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                              {/* Module header: [product logo] [module icon] [name] [(n linked)] */}
                              <div className="flex items-center gap-2.5 mb-3">
                                {/* Product logo — prominent, left-most */}
                                {modProducts.length > 0 ? (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {modProducts.map((p: any) => (
                                      <div key={p.id} title={p.name}
                                        className="w-7 h-7 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600 flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-600 flex-shrink-0">
                                        <img
                                          src={p.logo}
                                          alt={p.name}
                                          className="w-full h-full object-cover"
                                          onError={e => {
                                            const el = e.currentTarget;
                                            el.style.display = 'none';
                                            const parent = el.parentElement;
                                            if (parent) {
                                              parent.innerHTML = `<span class="text-[9px] font-bold text-gray-500 dark:text-gray-300">${p.name.slice(0,2).toUpperCase()}</span>`;
                                            }
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Layers className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                )}

                                {/* Module name */}
                                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate min-w-0">
                                  {mod.name}
                                </span>

                                {/* Linked count — right after name */}
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 font-normal">
                                  ({linkedSubModules.length} linked)
                                </span>
                              </div>

                              {/* Linked sub modules */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {linkedSubModules.map((sm: SubModule) => (
                                  <span key={sm.id} className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                                    <GitBranch className="w-3 h-3 text-gray-400" />
                                    {sm.name}
                                    <button onClick={() => handleUnlinkSubModule(mod.id, sm.id)}
                                      className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                {linkedSubModules.length === 0 && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">No sub modules linked</span>
                                )}
                              </div>

                              {/* Link sub module (multi-select) */}
                              {unlinkedSubModules.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Link sub module</p>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <MultiSelectDropdown
                                        options={unlinkedSubModules.map((sm: SubModule) => ({ id: sm.id, name: sm.name }))}
                                        selectedValues={subModuleLinkSelections[mod.id] ?? []}
                                        onValuesChange={(vals) => setSubModuleLinkSelections(prev => ({ ...prev, [mod.id]: vals }))}
                                        placeholder="— Select sub modules —"
                                        className="w-full"
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleLinkSubModule(mod.id)}
                                      disabled={subModuleLinkLoadingModuleId === mod.id || (subModuleLinkSelections[mod.id] ?? []).length === 0}
                                      className="px-5 py-3 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 flex items-center gap-2 transition-colors flex-shrink-0 shadow-sm"
                                    >
                                      {subModuleLinkLoadingModuleId === mod.id
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking…</>
                                        : <><Link className="w-4 h-4" /> Link</>}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Other Tabs - Regular Layout */}
            {activeTab !== 'product-modules' && activeTab !== 'sub-modules' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white">
                      Manage {activeTabData?.label}
                    </h2>
                    {activeTab === 'products' && (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Drag and drop to reorder products
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <div className="hidden sm:block">
                      <CustomDropdown
                        options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
                        selectedValue={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as 'active' | 'inactive' | 'all')}
                        allText="All"
                        className="w-40"
                      />
                    </div>
                    <button
                      onClick={handleAddNew}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 lg:py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New</span>
                    </button>
                  </div>
                </div>

                {/* Data Cards */}
                {activeTab === 'products' ? (
                  // Products with drag and drop
                  dbLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  ) :
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
                              {(() => {
                                const displayActive = typeof optimisticDesired[item.id] === 'boolean' ? optimisticDesired[item.id] : item.is_active;
                                return (
                                  <>
                                    <span className={`text-xs text-gray-500 dark:text-gray-400`}>
                                      <span className={`font-medium ${displayActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {displayActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </span>
                                    <ToggleSwitch
                                      isActive={displayActive}
                                      loading={Object.prototype.hasOwnProperty.call(optimisticLoading, item.id)}
                                      onToggle={() => {
                                        const willBeActive = !(typeof optimisticDesired[item.id] === 'boolean' ? optimisticDesired[item.id] : item.is_active);
                                        console.log('Direct toggle product', item.id, willBeActive);
                                        // optimistic update: set desired and loading immediately
                                        setOptimisticDesired(prev => ({ ...prev, [item.id]: willBeActive }));
                                        setOptimisticLoading(prev => ({ ...prev, [item.id]: true }));
                                        (async () => {
                                          try {
                                            await handleToggleProduct(item);
                                          } catch (err) {
                                            console.error('Toggle product error:', err);
                                          }
                                        })();
                                      }}
                                    />
                                  </>
                                );
                              })()}
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
                    {displayedGridItems.map((item: any) => (
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
                          {(() => {
                            const currentTab = activeTab as 'products' | 'modules' | 'categories';
                            const displayActive = typeof optimisticDesired[item.id] === 'boolean' ? optimisticDesired[item.id] : item.is_active;
                            return (
                              <>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  <span className={`font-medium ${displayActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {displayActive ? 'Active' : 'Inactive'}
                                  </span>
                                </span>
                                <ToggleSwitch
                                  isActive={displayActive}
                                  loading={Object.prototype.hasOwnProperty.call(optimisticLoading, item.id)}
                                  onToggle={() => {
                                    const willBeActive = !(typeof optimisticDesired[item.id] === 'boolean' ? optimisticDesired[item.id] : item.is_active);
                                    console.log('Direct toggle item', item.id, willBeActive, currentTab);
                                    setOptimisticDesired(prev => ({ ...prev, [item.id]: willBeActive }));
                                    setOptimisticLoading(prev => ({ ...prev, [item.id]: true }));
                                    (async () => {
                                      try {
                                        if (currentTab === 'products') {
                                          await handleToggleProduct(item as Product);
                                        } else if (currentTab === 'modules') {
                                          await handleToggleModule(item as Module);
                                        } else if (currentTab === 'categories') {
                                          await handleToggleCategory(item as Category);
                                        }
                                      } catch (err) {
                                        console.error('Toggle error:', err);
                                      }
                                    })();
                                  }}
                                />
                              </>
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

                {!dbLoading && displayedGridItems.length === 0 && activeTabData && (
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