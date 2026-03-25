-- ============================================================
-- Migration: Add created_by and updated_by to all tables
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- test_data
ALTER TABLE test_data
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- test_coverage_items
ALTER TABLE test_coverage_items
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- modules
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- sub_modules
ALTER TABLE sub_modules
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;
