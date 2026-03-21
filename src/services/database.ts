import { supabase } from '../lib/supabase';
import {
  Product,
  Module,
  Category,
  TestData,
  ProductModule,
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
  CreateProductModuleInput,
  UpdateProductModuleInput,
  CreateSubModuleInput,
  UpdateSubModuleInput,
  CreateModuleSubModuleInput,
  TestCoverageItem,
  CreateTestCoverageItemInput,
  UpdateTestCoverageItemInput,
} from '../types';

// Products
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Get all products for settings (including inactive)
export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Update product display order
export const updateProductOrder = async (productId: string, newOrder: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ display_order: newOrder })
    .eq('id', productId);

  if (error) throw error;
};

// Bulk update product orders
export const updateProductOrders = async (updates: { id: string; display_order: number }[]): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
};

// Product Modules
export const getProductModules = async (productId?: string): Promise<ProductModule[]> => {
  let query = supabase
    .from('product_modules')
    .select('*')
    .eq('is_active', true);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query.order('created_at');

  if (error) throw error;
  return data || [];
};

export const getModulesByProductId = async (productId: string): Promise<Module[]> => {
  console.log('Getting modules for product ID:', productId);

  const { data, error } = await supabase
    .from('product_modules')
    .select(`
      modules (
        id,
        name,
        created_at,
        updated_at,
        is_active
      )
    `)
    .eq('product_id', productId)
    .eq('is_active', true);

  if (error) throw error;

  const modules = data?.map(item => item.modules).filter(module => module && module.is_active) || [];
  console.log('Found modules for product:', productId, modules);

  return modules;
};

export const createProductModule = async (input: CreateProductModuleInput): Promise<ProductModule> => {
  // Check if a record with the same product_id and module_id already exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('product_modules')
    .select('*')
    .eq('product_id', input.product_id)
    .eq('module_id', input.module_id)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  // If a record exists, reactivate it instead of creating a new one
  if (existingRecord) {
    const { data, error } = await supabase
      .from('product_modules')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // If no record exists, create a new one
  const { data, error } = await supabase
    .from('product_modules')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProductModule = async (productId: string, moduleId: string): Promise<void> => {
  const { error } = await supabase
    .from('product_modules')
    .update({ is_active: false })
    .eq('product_id', productId)
    .eq('module_id', moduleId);

  if (error) throw error;
};

export const getAllProductModules = async (): Promise<ProductModule[]> => {
  const { data, error } = await supabase
    .from('product_modules')
    .select('*')
    .order('created_at');

  if (error) throw error;
  return data || [];
};

// Modules
export const getModules = async (): Promise<Module[]> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createModule = async (input: CreateModuleInput): Promise<Module> => {
  const { data, error } = await supabase
    .from('modules')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateModule = async (input: UpdateModuleInput): Promise<Module> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('modules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteModule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('modules')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Get all modules for settings (including inactive)
export const getAllModules = async (): Promise<Module[]> => {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

// Get all categories for settings (including inactive)
export const getAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

// Test Data
export const getTestData = async (filters?: {
  product_id?: string;
  module_id?: string;
  category_id?: string;
  search?: string;
}): Promise<TestData[]> => {
  let query = supabase
    .from('test_data')
    .select('*');

  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id);
  }

  if (filters?.module_id) {
    query = query.eq('module_id', filters.module_id);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,test_data.ilike.%${filters.search}%,expected.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const createTestData = async (input: CreateTestDataInput): Promise<TestData> => {
  const { data, error } = await supabase
    .from('test_data')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTestData = async (input: UpdateTestDataInput): Promise<TestData> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('test_data')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTestData = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('test_data')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Sub Modules
export const getSubModules = async (): Promise<SubModule[]> => {
  const { data, error } = await supabase
    .from('sub_modules')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
};

export const getAllSubModules = async (): Promise<SubModule[]> => {
  const { data, error } = await supabase
    .from('sub_modules')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
};

export const createSubModule = async (input: CreateSubModuleInput): Promise<SubModule> => {
  const { data, error } = await supabase
    .from('sub_modules')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSubModule = async (input: UpdateSubModuleInput): Promise<SubModule> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('sub_modules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSubModule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sub_modules')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
};

// Module Sub Modules
export const getAllModuleSubModules = async (): Promise<ModuleSubModule[]> => {
  const { data, error } = await supabase
    .from('module_sub_modules')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data || [];
};

export const createModuleSubModule = async (input: CreateModuleSubModuleInput): Promise<ModuleSubModule> => {
  // Check existing record
  const { data: existing } = await supabase
    .from('module_sub_modules')
    .select('*')
    .eq('module_id', input.module_id)
    .eq('sub_module_id', input.sub_module_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('module_sub_modules')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('module_sub_modules')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteModuleSubModule = async (moduleId: string, subModuleId: string): Promise<void> => {
  const { error } = await supabase
    .from('module_sub_modules')
    .update({ is_active: false })
    .eq('module_id', moduleId)
    .eq('sub_module_id', subModuleId);
  if (error) throw error;
};

// Test Coverage Items
export const getCoverageItems = async (filters?: {
  product_id?: string;
  module_id?: string;
  coverage_type?: string;
}): Promise<TestCoverageItem[]> => {
  let query = supabase.from('test_coverage_items').select('*');

  if (filters?.product_id) query = query.eq('product_id', filters.product_id);
  if (filters?.module_id) query = query.eq('module_id', filters.module_id);
  if (filters?.coverage_type) query = query.eq('coverage_type', filters.coverage_type);

  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createCoverageItem = async (input: CreateTestCoverageItemInput): Promise<TestCoverageItem> => {
  const { data, error } = await supabase
    .from('test_coverage_items')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCoverageItem = async (input: UpdateTestCoverageItemInput): Promise<TestCoverageItem> => {
  const { id, ...updateData } = input;
  const { data, error } = await supabase
    .from('test_coverage_items')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCoverageItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('test_coverage_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const checkSubModuleInUse = async (subModuleId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('test_coverage_items')
    .select('id', { count: 'exact', head: true })
    .eq('sub_module_id', subModuleId);
  if (error) throw error;
  return count ?? 0;
};

// Get ALL coverage items across all products (for manager overview)
export const getAllCoverageItems = async (): Promise<TestCoverageItem[]> => {
  const { data, error } = await supabase
    .from('test_coverage_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
