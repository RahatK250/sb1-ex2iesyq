/*
  # Coverage Summary RPC Function

  Creates a PostgreSQL function `get_coverage_summary()` that returns
  overall + per-product test coverage statistics.

  Usage (via Supabase REST API — no auth required because function is SECURITY DEFINER
  and exposed to the public role):
    GET  https://<project>.supabase.co/rest/v1/rpc/get_coverage_summary
         -H "apikey: <anon_key>"

  Returns JSON:
  {
    "generated_at": "...",
    "overall": { "total": N, "full": N, "partial": N, "no_coverage": N, "coverage_pct": N,
                 "manual": {...}, "automate": {...} },
    "products": [{ "id": "...", "name": "...", "logo": "...", ... }]
  }
*/

CREATE OR REPLACE FUNCTION get_coverage_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH
  -- All coverage items joined with product info
  items AS (
    SELECT
      tci.product_id,
      tci.coverage_type,
      tci.coverage_status,
      p.name  AS product_name,
      p.logo  AS product_logo,
      p.display_order
    FROM test_coverage_items tci
    JOIN products p ON p.id = tci.product_id AND p.is_active = true
  ),

  -- Per-product + per-type aggregates
  product_type_stats AS (
    SELECT
      product_id,
      product_name,
      product_logo,
      display_order,
      coverage_type,
      COUNT(*)                                              AS total,
      COUNT(*) FILTER (WHERE coverage_status = 'full')     AS full_count,
      COUNT(*) FILTER (WHERE coverage_status = 'partial')  AS partial_count,
      COUNT(*) FILTER (WHERE coverage_status = 'no_coverage') AS none_count
    FROM items
    GROUP BY product_id, product_name, product_logo, display_order, coverage_type
  ),

  -- Per-product combined (both types)
  product_combined AS (
    SELECT
      product_id,
      product_name,
      product_logo,
      display_order,
      SUM(total)         AS total,
      SUM(full_count)    AS full_count,
      SUM(partial_count) AS partial_count,
      SUM(none_count)    AS none_count
    FROM product_type_stats
    GROUP BY product_id, product_name, product_logo, display_order
  ),

  -- Pivot manual/automate per product
  product_manual AS (
    SELECT product_id, total, full_count, partial_count, none_count
    FROM product_type_stats WHERE coverage_type = 'manual'
  ),
  product_automate AS (
    SELECT product_id, total, full_count, partial_count, none_count
    FROM product_type_stats WHERE coverage_type = 'automate'
  ),

  -- Overall stats
  overall_combined AS (
    SELECT
      SUM(total)         AS total,
      SUM(full_count)    AS full_count,
      SUM(partial_count) AS partial_count,
      SUM(none_count)    AS none_count
    FROM product_combined
  ),
  overall_manual AS (
    SELECT SUM(total) AS total, SUM(full_count) AS full_count,
           SUM(partial_count) AS partial_count, SUM(none_count) AS none_count
    FROM product_type_stats WHERE coverage_type = 'manual'
  ),
  overall_automate AS (
    SELECT SUM(total) AS total, SUM(full_count) AS full_count,
           SUM(partial_count) AS partial_count, SUM(none_count) AS none_count
    FROM product_type_stats WHERE coverage_type = 'automate'
  )

  SELECT jsonb_build_object(
    'generated_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),

    -- Overall
    'overall', jsonb_build_object(
      'total',        oc.total,
      'full',         oc.full_count,
      'partial',      oc.partial_count,
      'no_coverage',  oc.none_count,
      'coverage_pct', CASE WHEN oc.total > 0
                        THEN ROUND((oc.full_count::numeric / oc.total) * 100, 2)
                        ELSE 0 END,
      'manual', jsonb_build_object(
        'total',        om.total,
        'full',         om.full_count,
        'partial',      om.partial_count,
        'no_coverage',  om.none_count,
        'coverage_pct', CASE WHEN om.total > 0
                          THEN ROUND((om.full_count::numeric / om.total) * 100, 2)
                          ELSE 0 END
      ),
      'automate', jsonb_build_object(
        'total',        oa.total,
        'full',         oa.full_count,
        'partial',      oa.partial_count,
        'no_coverage',  oa.none_count,
        'coverage_pct', CASE WHEN oa.total > 0
                          THEN ROUND((oa.full_count::numeric / oa.total) * 100, 2)
                          ELSE 0 END
      )
    ),

    -- Per-product array
    'products', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',           pc.product_id,
          'name',         pc.product_name,
          'logo',         pc.product_logo,
          'total',        pc.total,
          'full',         pc.full_count,
          'partial',      pc.partial_count,
          'no_coverage',  pc.none_count,
          'coverage_pct', CASE WHEN pc.total > 0
                            THEN ROUND((pc.full_count::numeric / pc.total) * 100, 2)
                            ELSE 0 END,
          'manual', jsonb_build_object(
            'total',        COALESCE(pm.total, 0),
            'full',         COALESCE(pm.full_count, 0),
            'partial',      COALESCE(pm.partial_count, 0),
            'no_coverage',  COALESCE(pm.none_count, 0),
            'coverage_pct', CASE WHEN COALESCE(pm.total, 0) > 0
                              THEN ROUND((pm.full_count::numeric / pm.total) * 100, 2)
                              ELSE 0 END
          ),
          'automate', jsonb_build_object(
            'total',        COALESCE(pa.total, 0),
            'full',         COALESCE(pa.full_count, 0),
            'partial',      COALESCE(pa.partial_count, 0),
            'no_coverage',  COALESCE(pa.none_count, 0),
            'coverage_pct', CASE WHEN COALESCE(pa.total, 0) > 0
                              THEN ROUND((pa.full_count::numeric / pa.total) * 100, 2)
                              ELSE 0 END
          )
        )
        ORDER BY pc.display_order
      )
      FROM product_combined pc
      LEFT JOIN product_manual   pm ON pm.product_id = pc.product_id
      LEFT JOIN product_automate pa ON pa.product_id = pc.product_id
    ), '[]'::jsonb)

  ) INTO v_result
  FROM overall_combined oc, overall_manual om, overall_automate oa;

  RETURN v_result;
END;
$$;

-- Grant execute to public (anon role) so it's callable without auth
GRANT EXECUTE ON FUNCTION get_coverage_summary() TO anon;
GRANT EXECUTE ON FUNCTION get_coverage_summary() TO authenticated;
