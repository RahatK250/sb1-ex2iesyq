// Supabase Edge Function: coverage-summary
// Public (no-auth) endpoint returning test coverage summary for all products.
// Deploy with: supabase functions deploy coverage-summary --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoverageItem {
  product_id: string
  coverage_type: 'manual' | 'automate'
  coverage_status: 'full' | 'partial' | 'no_coverage'
}

interface Product {
  id: string
  name: string
  display_order: number
}

interface Stats {
  total: number
  full: number
  partial: number
  no_coverage: number
  coverage_pct: number
}

interface ProductSummary extends Stats {
  id: string
  name: string
  manual: Stats
  automate: Stats
}

interface ResponseBody {
  generated_at: string
  overall: Stats & {
    manual: Stats
    automate: Stats
  }
  products: ProductSummary[]
}

function computeStats(items: CoverageItem[]): Stats {
  const total = items.length
  const full = items.filter(i => i.coverage_status === 'full').length
  const partial = items.filter(i => i.coverage_status === 'partial').length
  const no_coverage = items.filter(i => i.coverage_status === 'no_coverage').length
  const coverage_pct = total > 0 ? Math.round((full / total) * 10000) / 100 : 0
  return { total, full, partial, no_coverage, coverage_pct }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use GET.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all active products (ordered by display_order)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (productsError) throw productsError

    // Fetch all coverage items (only columns we need for aggregation)
    const { data: items, error: itemsError } = await supabase
      .from('test_coverage_items')
      .select('product_id, coverage_type, coverage_status')

    if (itemsError) throw itemsError

    const allItems = (items ?? []) as CoverageItem[]
    const allProducts = (products ?? []) as Product[]

    // Per-product breakdown
    const productSummaries: ProductSummary[] = allProducts.map(product => {
      const productItems = allItems.filter(i => i.product_id === product.id)
      const manualItems = productItems.filter(i => i.coverage_type === 'manual')
      const automateItems = productItems.filter(i => i.coverage_type === 'automate')

      return {
        id: product.id,
        name: product.name,
        ...computeStats(productItems),
        manual: computeStats(manualItems),
        automate: computeStats(automateItems),
      }
    })

    // Overall summary (all products combined)
    const manualItems = allItems.filter(i => i.coverage_type === 'manual')
    const automateItems = allItems.filter(i => i.coverage_type === 'automate')

    const response: ResponseBody = {
      generated_at: new Date().toISOString(),
      overall: {
        ...computeStats(allItems),
        manual: computeStats(manualItems),
        automate: computeStats(automateItems),
      },
      products: productSummaries,
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[coverage-summary]', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
