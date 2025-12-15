/*
  # Remove soft delete from test_data table

  1. Database Changes
    - Remove is_active column from test_data table
    - Delete all inactive test_data records (is_active = false)
    - Update RLS policies to work without is_active

  2. Cleanup
    - Remove all soft-deleted records permanently
    - Simplify table structure
*/

-- First, delete all inactive test_data records
DELETE FROM test_data WHERE is_active = false;

-- Remove the is_active column
ALTER TABLE test_data DROP COLUMN IF EXISTS is_active;

-- Drop and recreate RLS policies without is_active filter
DROP POLICY IF EXISTS "Allow all operations on test_data" ON test_data;

CREATE POLICY "Allow all operations on test_data"
  ON test_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);