-- ─────────────────────────────────────────────────────────────────────────────
-- Create public storage bucket for product logos.
--
-- Before this migration, product logos were stored as base64 data-URIs inside
-- the `products.logo` column.  Every query that fetched products transferred
-- the entire image payload as part of the DB response — contributing heavily
-- to Supabase egress.
--
-- After this migration:
--  • New logos are uploaded to Storage → only a short public URL is stored in DB
--  • The browser caches images via CDN → repeat visits don't re-download
--  • DB queries become tiny again (URL ~80 bytes vs base64 image ~200 KB)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-logos',
  'product-logos',
  true,                        -- public: images are readable without auth
  5242880,                     -- 5 MB max per file
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS policies (app uses anon role — no auth) ───────────────────────────────

-- Anyone can read logos (bucket is public, but RLS still needs a SELECT policy)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'product_logos_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY product_logos_public_read ON storage.objects
        FOR SELECT USING (bucket_id = 'product-logos');
    $policy$;
  END IF;
END $$;

-- Anyone (anon) can upload logos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'product_logos_anon_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY product_logos_anon_insert ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'product-logos');
    $policy$;
  END IF;
END $$;

-- Anyone (anon) can overwrite logos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'product_logos_anon_update'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY product_logos_anon_update ON storage.objects
        FOR UPDATE USING (bucket_id = 'product-logos');
    $policy$;
  END IF;
END $$;

-- Anyone (anon) can delete logos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'product_logos_anon_delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY product_logos_anon_delete ON storage.objects
        FOR DELETE USING (bucket_id = 'product-logos');
    $policy$;
  END IF;
END $$;
