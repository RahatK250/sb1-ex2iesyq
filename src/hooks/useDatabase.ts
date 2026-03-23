import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Product,
  Module,
  Category,
  TestData,
  SubModule,
  ModuleSubModule,
  CreateTestDataInput,
  UpdateTestDataInput,
  CreateProductInput,
  UpdateProductInput,
  CreateModuleInput,
  UpdateModuleInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubModuleInput,
  UpdateSubModuleInput,
  CreateModuleSubModuleInput,
} from '../types';
import * as db from '../services/database';

export const useDatabase = () => {
  // Unique ID per hook instance so Supabase channel names don't collide when
  // multiple components (e.g. App + SettingsPage) each call useDatabase().
  const instanceId = useRef(Math.random().toString(36).slice(2, 8)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [productModules, setProductModules] = useState<any[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [allSubModules, setAllSubModules] = useState<SubModule[]>([]);
  const [moduleSubModules, setModuleSubModules] = useState<ModuleSubModule[]>([]);
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup realtime subscriptions
  useEffect(() => {
    console.log('Setting up realtime subscriptions...');
    
    // Products subscription — update state directly from payload (no extra queries)
    const productsSubscription = supabase
      .channel(`products-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const p = payload.new as Product;
            setAllProducts(prev => [...prev, p].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
            if (p.is_active !== false) setProducts(prev => [...prev, p].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const p = payload.new as Product;
            setAllProducts(prev => prev.map(x => x.id === p.id ? p : x));
            setProducts(prev => {
              const exists = prev.some(x => x.id === p.id);
              if (p.is_active !== false) return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
              return prev.filter(x => x.id !== p.id);
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = (payload.old as Product).id;
            setAllProducts(prev => prev.filter(x => x.id !== id));
            setProducts(prev => prev.filter(x => x.id !== id));
          }
        }
      )
      .subscribe();

    // Modules subscription — payload-based update
    const modulesSubscription = supabase
      .channel(`modules-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const m = payload.new as Module;
            setAllModules(prev => [...prev, m].sort((a, b) => a.name.localeCompare(b.name)));
            if (m.is_active !== false) setModules(prev => [...prev, m].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const m = payload.new as Module;
            setAllModules(prev => prev.map(x => x.id === m.id ? m : x));
            setModules(prev => {
              const exists = prev.some(x => x.id === m.id);
              if (m.is_active !== false) return exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
              return prev.filter(x => x.id !== m.id);
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = (payload.old as Module).id;
            setAllModules(prev => prev.filter(x => x.id !== id));
            setModules(prev => prev.filter(x => x.id !== id));
          }
        }
      )
      .subscribe();

    // Categories subscription — payload-based update
    const categoriesSubscription = supabase
      .channel(`categories-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const c = payload.new as Category;
            setAllCategories(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
            if (c.is_active !== false) setCategories(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const c = payload.new as Category;
            setAllCategories(prev => prev.map(x => x.id === c.id ? c : x));
            setCategories(prev => {
              const exists = prev.some(x => x.id === c.id);
              if (c.is_active !== false) return exists ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
              return prev.filter(x => x.id !== c.id);
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = (payload.old as Category).id;
            setAllCategories(prev => prev.filter(x => x.id !== id));
            setCategories(prev => prev.filter(x => x.id !== id));
          }
        }
      )
      .subscribe();

    // Product Modules subscription — payload-based update
    const productModulesSubscription = supabase
      .channel(`product-modules-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'product_modules' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const pm = payload.new;
            setProductModules(prev => {
              const exists = prev.some(x => x.id === pm.id);
              return exists ? prev.map(x => x.id === pm.id ? pm : x) : [...prev, pm];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const pm = payload.new;
            setProductModules(prev => prev.map(x => x.id === pm.id ? pm : x));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = payload.old.id;
            setProductModules(prev => prev.filter(x => x.id !== id));
          }
        }
      )
      .subscribe();

    // Sub Modules subscription — payload-based update
    const subModulesSubscription = supabase
      .channel(`sub-modules-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sub_modules' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const s = payload.new as SubModule;
            setAllSubModules(prev => [...prev, s]);
            if (s.is_active !== false) setSubModules(prev => [...prev, s]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const s = payload.new as SubModule;
            setAllSubModules(prev => prev.map(x => x.id === s.id ? s : x));
            setSubModules(prev => {
              const exists = prev.some(x => x.id === s.id);
              if (s.is_active !== false) return exists ? prev.map(x => x.id === s.id ? s : x) : [...prev, s];
              return prev.filter(x => x.id !== s.id);
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = (payload.old as SubModule).id;
            setAllSubModules(prev => prev.filter(x => x.id !== id));
            setSubModules(prev => prev.filter(x => x.id !== id));
          }
        }
      ).subscribe();

    // Module Sub Modules subscription — payload-based update
    const moduleSubModulesSubscription = supabase
      .channel(`module-sub-modules-changes-${instanceId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'module_sub_modules' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const msm = payload.new as ModuleSubModule;
            setModuleSubModules(prev => {
              const exists = prev.some(x => x.id === msm.id);
              return exists ? prev.map(x => x.id === msm.id ? msm : x) : [...prev, msm];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const msm = payload.new as ModuleSubModule;
            setModuleSubModules(prev => prev.map(x => x.id === msm.id ? msm : x));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = (payload.old as ModuleSubModule).id;
            setModuleSubModules(prev => prev.filter(x => x.id !== id));
          }
        }
      ).subscribe();

    // Test Data subscription
    const testDataSubscription = supabase
      .channel(`test-data-changes-${instanceId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'test_data' },
        async (payload) => {
          console.log('Test data change detected:', payload);
          try {
            // Handle test data changes with hard delete
            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('Adding new test data:', payload.new);
              setTestData(prev => [payload.new as TestData, ...prev]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              console.log('Updating test data:', payload.new);
              const updatedItem = payload.new as TestData;
              setTestData(prev => prev.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              ));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              console.log('Deleting test data:', payload.old);
              setTestData(prev => prev.filter(item => item.id !== payload.old.id));
            }
            console.log('Test data updated successfully');
          } catch (error) {
            console.error('Error handling test data change:', error);
          }
        }
      )
      .subscribe();

    // (subscription status logging removed — reduces noise)

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up subscriptions...');
      productsSubscription.unsubscribe();
      modulesSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
      productModulesSubscription.unsubscribe();
      subModulesSubscription.unsubscribe();
      moduleSubModulesSubscription.unsubscribe();
      testDataSubscription.unsubscribe();
    };
  }, []);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, modulesData, categoriesData, allProductsData, allModulesData, allCategoriesData, productModulesData, subModulesData, allSubModulesData, moduleSubModulesData] = await Promise.all([
        db.getProducts(),
        db.getModules(),
        db.getCategories(),
        db.getAllProducts(),
        db.getAllModules(),
        db.getAllCategories(),
        db.getAllProductModules(),
        db.getSubModules(),
        db.getAllSubModules(),
        db.getAllModuleSubModules(),
      ]);

      setProducts(productsData);
      setModules(modulesData);
      setCategories(categoriesData);
      setAllProducts(allProductsData);
      setAllModules(allModulesData);
      setAllCategories(allCategoriesData);
      setProductModules(productModulesData);
      setSubModules(subModulesData);
      setAllSubModules(allSubModulesData);
      setModuleSubModules(moduleSubModulesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load test data with filters
  const loadTestData = async (filters?: {
    product_id?: string;
    module_id?: string;
    category_id?: string;
    search?: string;
  }) => {
    // Prevent loading if already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await db.getTestData(filters);
      setTestData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Products CRUD
  const createProduct = async (input: CreateProductInput) => {
    try {
      console.log('Creating product:', input);
      
      // Get the highest display_order and add 1
      const { data: maxOrderData } = await supabase
        .from('products')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);
      
      const nextOrder = maxOrderData && maxOrderData[0] ? (maxOrderData[0].display_order || 0) + 1 : 1;
      
      const newProduct = await db.createProduct(input);
      console.log('Product created successfully:', newProduct);
      
      // Method 1: Direct state update (fast, responsive)
      setAllProducts(prev => [...prev, newProduct]);
      if (newProduct.is_active) {
        setProducts(prev => [...prev, newProduct]);
      }
      
      return newProduct;
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
      throw err;
    }
  };

  // Update product orders
  const updateProductOrders = async (updates: { id: string; display_order: number }[]) => {
    try {
      console.log('Updating product orders:', updates);
      await db.updateProductOrders(updates);
      console.log('Product orders updated successfully');
      
      // ไม่ต้อง refresh ที่นี่ เพราะจะทำใน Settings component
      
    } catch (err) {
      console.error('Error updating product orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product orders');
      throw err;
    }
  };

  const updateProduct = async (input: UpdateProductInput) => {
    try {
      console.log('Updating product:', input);
      const updatedProduct = await db.updateProduct(input);
      console.log('Product updated successfully:', updatedProduct);
      
      // Method 1: Direct state update (fast, responsive)
      setAllProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setProducts(prev => 
        updatedProduct.is_active 
          ? prev.map(p => p.id === updatedProduct.id ? updatedProduct : p).concat(
              prev.find(p => p.id === updatedProduct.id) ? [] : [updatedProduct]
            )
          : prev.filter(p => p.id !== updatedProduct.id)
      );
      
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('Deleting product:', id);
      await db.deleteProduct(id);
      console.log('Product deleted successfully');
      
      // Method 1: Direct state update (fast, responsive)
      setAllProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
      setProducts(prev => prev.filter(p => p.id !== id));
      
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      throw err;
    }
  };

  // Modules CRUD
  const createModule = async (input: CreateModuleInput) => {
    try {
      console.log('Creating module:', input);
      const newModule = await db.createModule(input);
      console.log('Module created successfully:', newModule);
      
      // Method 1: Direct state update (fast, responsive)
      setAllModules(prev => [...prev, newModule]);
      if (newModule.is_active) {
        setModules(prev => [...prev, newModule]);
      }
      
      return newModule;
    } catch (err) {
      console.error('Error creating module:', err);
      setError(err instanceof Error ? err.message : 'Failed to create module');
      throw err;
    }
  };

  const updateModule = async (input: UpdateModuleInput) => {
    try {
      console.log('Updating module:', input);
      const updatedModule = await db.updateModule(input);
      console.log('Module updated successfully:', updatedModule);
      
      // Method 1: Direct state update (fast, responsive)
      setAllModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
      setModules(prev => 
        updatedModule.is_active 
          ? prev.map(m => m.id === updatedModule.id ? updatedModule : m).concat(
              prev.find(m => m.id === updatedModule.id) ? [] : [updatedModule]
            )
          : prev.filter(m => m.id !== updatedModule.id)
      );
      
      return updatedModule;
    } catch (err) {
      console.error('Error updating module:', err);
      setError(err instanceof Error ? err.message : 'Failed to update module');
      throw err;
    }
  };

  const deleteModule = async (id: string) => {
    try {
      console.log('Deleting module:', id);
      await db.deleteModule(id);
      console.log('Module deleted successfully');
      
      // Method 1: Direct state update (fast, responsive)
      setAllModules(prev => prev.map(m => m.id === id ? { ...m, is_active: false } : m));
      setModules(prev => prev.filter(m => m.id !== id));
      
    } catch (err) {
      console.error('Error deleting module:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete module');
      throw err;
    }
  };

  // Categories CRUD
  const createCategory = async (input: CreateCategoryInput) => {
    try {
      console.log('Creating category:', input);
      const newCategory = await db.createCategory(input);
      console.log('Category created successfully:', newCategory);
      
      // Method 1: Direct state update (fast, responsive)
      setAllCategories(prev => [...prev, newCategory]);
      if (newCategory.is_active) {
        setCategories(prev => [...prev, newCategory]);
      }
      
      return newCategory;
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    }
  };

  const updateCategory = async (input: UpdateCategoryInput) => {
    try {
      console.log('Updating category:', input);
      const updatedCategory = await db.updateCategory(input);
      console.log('Category updated successfully:', updatedCategory);
      
      // Method 1: Direct state update (fast, responsive)
      setAllCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
      setCategories(prev => 
        updatedCategory.is_active 
          ? prev.map(c => c.id === updatedCategory.id ? updatedCategory : c).concat(
              prev.find(c => c.id === updatedCategory.id) ? [] : [updatedCategory]
            )
          : prev.filter(c => c.id !== updatedCategory.id)
      );
      
      return updatedCategory;
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log('Deleting category:', id);
      await db.deleteCategory(id);
      console.log('Category deleted successfully');
      
      // Method 1: Direct state update (fast, responsive)
      setAllCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
      setCategories(prev => prev.filter(c => c.id !== id));
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    }
  };

  // Get modules by product
  const getModulesByProduct = async (productId: string) => {
    try {
      return await db.getModulesByProductId(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get modules for product');
      throw err;
    }
  };

  // Product Modules CRUD
  const createProductModule = async (productId: string, moduleId: string) => {
    try {
      console.log('Creating product module:', { productId, moduleId });
      const newProductModule = await db.createProductModule({ product_id: productId, module_id: moduleId });
      console.log('Product module created successfully:', newProductModule);
      
      // Method 1: Direct state update (fast, responsive)
      setProductModules(prev => [...prev, newProductModule]);
      
      return newProductModule;
    } catch (err) {
      console.error('Error creating product module:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product module');
      throw err;
    }
  };

  const deleteProductModule = async (productId: string, moduleId: string) => {
    try {
      console.log('Deleting product module:', { productId, moduleId });
      await db.deleteProductModule(productId, moduleId);
      console.log('Product module deleted successfully');
      
      // Method 1: Direct state update (fast, responsive)
      setProductModules(prev => prev.map(pm => 
        pm.product_id === productId && pm.module_id === moduleId 
          ? { ...pm, is_active: false } 
          : pm
      ));
      
    } catch (err) {
      console.error('Error deleting product module:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product module');
      throw err;
    }
  };

  // Sub Modules CRUD
  const createSubModule = async (input: CreateSubModuleInput) => {
    try {
      const item = await db.createSubModule(input);
      setAllSubModules(prev => [...prev, item]);
      if (item.is_active) setSubModules(prev => [...prev, item]);
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sub module');
      throw err;
    }
  };

  const updateSubModule = async (input: UpdateSubModuleInput) => {
    try {
      const item = await db.updateSubModule(input);
      setAllSubModules(prev => prev.map(s => s.id === item.id ? item : s));
      setSubModules(prev => item.is_active
        ? prev.map(s => s.id === item.id ? item : s).concat(prev.find(s => s.id === item.id) ? [] : [item])
        : prev.filter(s => s.id !== item.id)
      );
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sub module');
      throw err;
    }
  };

  const deleteSubModule = async (id: string) => {
    try {
      await db.deleteSubModule(id);
      setAllSubModules(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s));
      setSubModules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sub module');
      throw err;
    }
  };

  // Module Sub Modules CRUD
  const createModuleSubModule = async (moduleId: string, subModuleId: string) => {
    try {
      const item = await db.createModuleSubModule({ module_id: moduleId, sub_module_id: subModuleId });
      setModuleSubModules(prev => {
        const exists = prev.find(msm => msm.id === item.id);
        return exists ? prev.map(msm => msm.id === item.id ? item : msm) : [...prev, item];
      });
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link sub module');
      throw err;
    }
  };

  const deleteModuleSubModule = async (moduleId: string, subModuleId: string) => {
    try {
      await db.deleteModuleSubModule(moduleId, subModuleId);
      setModuleSubModules(prev => prev.map(msm =>
        msm.module_id === moduleId && msm.sub_module_id === subModuleId
          ? { ...msm, is_active: false }
          : msm
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink sub module');
      throw err;
    }
  };

  // Test Data CRUD
  const createTestData = async (input: CreateTestDataInput) => {
    try {
      console.log('Creating test data:', input);
      const newTestData = await db.createTestData(input);
      console.log('Test data created successfully:', newTestData);
      
      // Method 1: Direct state update (fast, responsive)
      setTestData(prev => [newTestData, ...prev]);
      
      return newTestData;
    } catch (err) {
      console.error('Error creating test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to create test data');
      throw err;
    }
  };

  const updateTestData = async (input: UpdateTestDataInput) => {
    try {
      console.log('Updating test data:', input);
      const updatedTestData = await db.updateTestData(input);
      console.log('Test data updated successfully:', updatedTestData);
      
      // Method 1: Direct state update (fast, responsive)
      setTestData(prev => prev.map(item => 
        item.id === updatedTestData.id ? updatedTestData : item
      ));
      
      return updatedTestData;
    } catch (err) {
      console.error('Error updating test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update test data');
      throw err;
    }
  };

  const deleteTestData = async (id: string) => {
    // Store original data for rollback
    const originalData = [...testData];

    try {
      console.log('Deleting test data:', id);

      // Method 1: Optimistic update - ลบออกจาก UI ทันทีก่อนเรียก API
      setTestData(prev => prev.filter(item => item.id !== id));

      // ส่ง API request
      await db.deleteTestData(id);
      console.log('Test data deleted successfully');
    } catch (err) {
      console.error('Error deleting test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete test data');

      // Rollback: คืนค่าข้อมูลเดิมถ้าเกิด error
      setTestData(originalData);
      console.log('Rolled back test data after delete error');

      throw err;
    }
  };

  // Method 2: Refetch data when needed (for complex operations)
  const refetchAllData = async () => {
    setLoading(true);
    try {
      const [productsData, modulesData, categoriesData, allProductsData, allModulesData, allCategoriesData, productModulesData] = await Promise.all([
        db.getProducts(),
        db.getModules(),
        db.getCategories(),
        db.getAllProducts(),
        db.getAllModules(),
        db.getAllCategories(),
        db.getAllProductModules()
      ]);
      
      setProducts(productsData);
      setModules(modulesData);
      setCategories(categoriesData);
      setAllProducts(allProductsData);
      setAllModules(allModulesData);
      setAllCategories(allCategoriesData);
      setProductModules(productModulesData);
      
      console.log('All data refetched successfully');
    } catch (err) {
      console.error('Error refetching all data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch data');
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Refetch specific data type
  const refetchProducts = async () => {
    try {
      const [productsData, allProductsData] = await Promise.all([
        db.getProducts(),
        db.getAllProducts()
      ]);
      setProducts(productsData);
      setAllProducts(allProductsData);
      console.log('Products refetched successfully');
    } catch (err) {
      console.error('Error refetching products:', err);
    }
  };

  const refetchModules = async () => {
    try {
      const [modulesData, allModulesData] = await Promise.all([
        db.getModules(),
        db.getAllModules()
      ]);
      setModules(modulesData);
      setAllModules(allModulesData);
      console.log('Modules refetched successfully');
    } catch (err) {
      console.error('Error refetching modules:', err);
    }
  };

  const refetchCategories = async () => {
    try {
      const [categoriesData, allCategoriesData] = await Promise.all([
        db.getCategories(),
        db.getAllCategories()
      ]);
      setCategories(categoriesData);
      setAllCategories(allCategoriesData);
      console.log('Categories refetched successfully');
    } catch (err) {
      console.error('Error refetching categories:', err);
    }
  };

  const refetchTestData = async (filters?: {
    product_id?: string;
    module_id?: string;
    category_id?: string;
    search?: string;
  }) => {
    try {
      const data = await db.getTestData(filters);
      setTestData(data);
      console.log('Test data refetched successfully');
    } catch (err) {
      console.error('Error refetching test data:', err);
    }
  };

  const refetchProductModules = async () => {
    try {
      const productModulesData = await db.getAllProductModules();
      setProductModules(productModulesData);
      console.log('Product modules refetched successfully');
    } catch (err) {
      console.error('Error refetching product modules:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    // Data
    products,
    modules,
    categories,
    allProducts,
    allModules,
    allCategories,
    productModules,
    subModules,
    allSubModules,
    moduleSubModules,
    testData,
    loading,
    error,
    
    // State setters for optimistic updates
    setProducts,
    setModules,
    setAllProducts,
    setAllModules,
    setAllCategories,
    
    // Actions
    loadData,
    loadTestData,
    getModulesByProduct,
    
    // Method 2: Refetch functions (when data consistency is critical)
    refetchAllData,
    refetchProducts,
    refetchModules,
    refetchCategories,
    refetchTestData,
    refetchProductModules,
    
    // Products
    createProduct,
    updateProduct,
    deleteProduct,
    
    // Modules
    createModule,
    updateModule,
    deleteModule,
    
    // Categories
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Product Modules
    createProductModule,
    deleteProductModule,

    // Sub Modules
    createSubModule,
    updateSubModule,
    deleteSubModule,

    // Module Sub Modules
    createModuleSubModule,
    deleteModuleSubModule,

    // Test Data
    createTestData,
    updateTestData,
    deleteTestData,

    // Product Ordering
    updateProductOrders,

    // Coverage item checks
    checkSubModuleInUse: db.checkSubModuleInUse,
  };
};