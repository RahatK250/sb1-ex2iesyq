/*
  # Add Product-Module Relationship

  1. New Tables
    - `product_modules`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `module_id` (uuid, foreign key to modules)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `product_modules` table
    - Add policy for public access to read/write data

  3. Indexes
    - Add indexes for better query performance
    - Add unique constraint for product_id + module_id combination
*/

CREATE TABLE IF NOT EXISTS product_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(product_id, module_id)
);

ALTER TABLE product_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on product_modules"
  ON product_modules
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_modules_product_id ON product_modules(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modules_module_id ON product_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_product_modules_active ON product_modules(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_product_modules_updated_at
  BEFORE UPDATE ON product_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();