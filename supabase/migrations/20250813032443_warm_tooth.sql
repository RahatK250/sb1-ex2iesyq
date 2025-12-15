/*
  # Fix RLS policies for public access

  1. Security Changes
    - Update all tables to allow public access for development
    - Remove authentication requirements temporarily
    - Enable proper CRUD operations for all tables

  2. Tables Updated
    - products: Allow public read/write access
    - modules: Allow public read/write access  
    - categories: Allow public read/write access
    - test_data: Allow public read/write access
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

DROP POLICY IF EXISTS "Anyone can read modules" ON modules;
DROP POLICY IF EXISTS "Authenticated users can insert modules" ON modules;
DROP POLICY IF EXISTS "Authenticated users can update modules" ON modules;
DROP POLICY IF EXISTS "Authenticated users can delete modules" ON modules;

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

DROP POLICY IF EXISTS "Anyone can read test_data" ON test_data;
DROP POLICY IF EXISTS "Authenticated users can insert test_data" ON test_data;
DROP POLICY IF EXISTS "Authenticated users can update test_data" ON test_data;
DROP POLICY IF EXISTS "Authenticated users can delete test_data" ON test_data;

-- Create new public access policies for products
CREATE POLICY "Public can read products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can insert products"
  ON products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update products"
  ON products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete products"
  ON products
  FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for modules
CREATE POLICY "Public can read modules"
  ON modules
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can insert modules"
  ON modules
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update modules"
  ON modules
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete modules"
  ON modules
  FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for categories
CREATE POLICY "Public can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for test_data
CREATE POLICY "Public can read test_data"
  ON test_data
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can insert test_data"
  ON test_data
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update test_data"
  ON test_data
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete test_data"
  ON test_data
  FOR DELETE
  TO public
  USING (true);