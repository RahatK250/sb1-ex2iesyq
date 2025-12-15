/*
  # Initial Database Schema for Qollect

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `logo` (text, URL to logo image)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)
    
    - `modules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `tag` (text)
      - `color` (text, hex color code)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)
    
    - `test_data`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `product_id` (uuid, foreign key)
      - `module_id` (uuid, foreign key)
      - `category_id` (uuid, foreign key)
      - `test_data` (text, JSON or formatted text)
      - `expected` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
    - Public read access for basic operations

  3. Initial Data
    - Insert default products, modules, and categories
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create test_data table
CREATE TABLE IF NOT EXISTS test_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  test_data text NOT NULL,
  expected text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_data ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for modules
CREATE POLICY "Anyone can read modules"
  ON modules
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert modules"
  ON modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update modules"
  ON modules
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete modules"
  ON modules
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for categories
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for test_data
CREATE POLICY "Anyone can read test_data"
  ON test_data
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert test_data"
  ON test_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update test_data"
  ON test_data
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete test_data"
  ON test_data
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial data
INSERT INTO products (name, logo) VALUES
  ('empeo', 'https://login-uat.gofive.co.th/images/layout/logo-empeo-full.svg'),
  ('emconnect', 'https://login-uat.gofive.co.th/images/layout/logo-emconnect-full.svg'),
  ('Venio', 'https://login-uat.gofive.co.th/images/layout/logo-Venio-full.svg'),
  ('Partner Portal', 'https://login-uat.gofive.co.th/images/layout/logo-client portal-full.svg'),
  ('eTaxGo', 'https://login-uat.gofive.co.th/images/layout/logo-eTaxGo-full.svg'),
  ('Salesbear', 'https://login-uat.gofive.co.th/images/layout/logo-Salesbear-full.svg')
ON CONFLICT (name) DO NOTHING;

INSERT INTO modules (name) VALUES
  ('Plan')
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, tag, color) VALUES
  ('Positive case', 'Positive', '#10B981'),
  ('Negative case', 'Negative', '#EF4444'),
  ('Boundary case', 'Boundary', '#F59E0B'),
  ('Performance case', 'Perf', '#3B82F6')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_data_product_id ON test_data(product_id);
CREATE INDEX IF NOT EXISTS idx_test_data_module_id ON test_data(module_id);
CREATE INDEX IF NOT EXISTS idx_test_data_category_id ON test_data(category_id);
CREATE INDEX IF NOT EXISTS idx_test_data_created_at ON test_data(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_data_updated_at BEFORE UPDATE ON test_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();