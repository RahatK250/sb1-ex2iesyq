/*
  # Fix RLS Policies for Public Access

  1. Security Updates
    - Update RLS policies for products, modules, categories, and test_data tables
    - Allow public access for all CRUD operations
    - Remove authentication requirements for development/testing

  2. Policy Changes
    - Products: Allow public INSERT, UPDATE, DELETE, SELECT
    - Modules: Allow public INSERT, UPDATE, DELETE, SELECT  
    - Categories: Allow public INSERT, UPDATE, DELETE, SELECT
    - Test Data: Allow public INSERT, UPDATE, DELETE, SELECT

  3. Notes
    - These policies allow unrestricted access for development
    - In production, you may want to add proper authentication checks
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can insert products" ON products;
DROP POLICY IF EXISTS "Public can update products" ON products;
DROP POLICY IF EXISTS "Public can delete products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;

DROP POLICY IF EXISTS "Public can insert modules" ON modules;
DROP POLICY IF EXISTS "Public can update modules" ON modules;
DROP POLICY IF EXISTS "Public can delete modules" ON modules;
DROP POLICY IF EXISTS "Public can read modules" ON modules;

DROP POLICY IF EXISTS "Public can insert categories" ON categories;
DROP POLICY IF EXISTS "Public can update categories" ON categories;
DROP POLICY IF EXISTS "Public can delete categories" ON categories;
DROP POLICY IF EXISTS "Public can read categories" ON categories;

DROP POLICY IF EXISTS "Public can insert test_data" ON test_data;
DROP POLICY IF EXISTS "Public can update test_data" ON test_data;
DROP POLICY IF EXISTS "Public can delete test_data" ON test_data;
DROP POLICY IF EXISTS "Public can read test_data" ON test_data;

-- Create new permissive policies for products
CREATE POLICY "Allow all operations on products"
  ON products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for modules
CREATE POLICY "Allow all operations on modules"
  ON modules
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for categories
CREATE POLICY "Allow all operations on categories"
  ON categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for test_data
CREATE POLICY "Allow all operations on test_data"
  ON test_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);