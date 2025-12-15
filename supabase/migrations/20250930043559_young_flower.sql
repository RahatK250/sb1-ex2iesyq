/*
  # Add display_order column to products table

  1. Changes
    - Add `display_order` column to `products` table
    - Set default values for existing products
    - Add index for better performance

  2. Migration Details
    - Add column with integer type and default value
    - Update existing products with sequential order based on name
    - Create index on display_order for efficient sorting
*/

-- Add display_order column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing products with sequential display_order based on name
DO $$
DECLARE
    product_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR product_record IN 
        SELECT id FROM products ORDER BY name ASC
    LOOP
        UPDATE products 
        SET display_order = counter 
        WHERE id = product_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Create index on display_order for better performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Set default value for new products
ALTER TABLE products ALTER COLUMN display_order SET DEFAULT 1;