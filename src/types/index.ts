export interface Product {
  id: string;
  name: string;
  logo: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface Module {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  tag: string;
  color: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface TestData {
  id: string;
  name: string;
  description: string;
  product_id: string;
  module_id: string;
  category_id: string;
  test_data: string;
  expected: string;
  created_at: string;
  updated_at?: string;
}

export interface Language {
  code: 'th' | 'en';
  name: string;
  flag: string;
}

export type Theme = 'light' | 'dark';

export interface AppState {
  selectedProduct: Product | null;
  theme: Theme;
}

export interface CreateTestDataInput {
  name: string;
  description: string;
  product_id: string | null;
  module_id: string | null;
  category_id: string | null;
  test_data: string;
  expected: string;
}

export interface UpdateTestDataInput extends Partial<CreateTestDataInput> {
  id: string;
}

export interface CreateProductInput {
  name: string;
  logo: string;
  display_order?: number;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface CreateModuleInput {
  name: string;
}

export interface UpdateModuleInput extends Partial<CreateModuleInput> {
  id: string;
}

export interface CreateCategoryInput {
  name: string;
  tag: string;
  color: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface ProductModule {
  id: string;
  product_id: string;
  module_id: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface CreateProductModuleInput {
  product_id: string;
  module_id: string;
}

export interface UpdateProductModuleInput extends Partial<CreateProductModuleInput> {
  id: string;
}