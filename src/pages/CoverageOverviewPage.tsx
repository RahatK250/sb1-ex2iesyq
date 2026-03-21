import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, LayoutGrid,
} from 'lucide-react';
import { Product, ProductModule, Module } from '../types';
import { useAllCoverage } from '../hooks/useAllCoverage';

// ─── helpers ──────────────────────────────────────────────────────────────────

const createProductSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

interface Stats { full: number; partial: number; none: number; total: number }

const makeStats = (items: { coverage_status: string }[]): Stats => ({
  full:    items.filter(i => i.coverage_status === 'full').length,
  partial: items.filter(i => i.coverage_status === 'partial').length,
  none:    items.filter(i => i.coverage_status === 'no_coverage').length,
  total:   items.length,
});

// Format percentage: up to 2dp, strip trailing .00
const fmtPct = (numerator: number, denominator: number): string => {
  if (denominator === 0) return '0%';
  const v = (numerator / denominator) * 100;
  const fixed = parseFloat(v.toFixed(2));
  return Number.isInteger(fixed) ? `${fixed}%` : `${fixed}%`;
};

// ─── Mini Donut ───────────────────────────────────────────────────────────────

const MiniDonut: React.FC<{ full: number; partial: number; none: number; size?: number }> = ({
  full, partial, none, size = 100,
}) => {
  const total = full + partial + none;
  const r = size * 0.375;
  const C = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const quart = C * 0.25;
  const sw = size * 0.18;

  const pF = total > 0 ? full / total : 0;
  const pP = total > 0 ? partial / total : 0;
  const pN = total > 0 ? none / total : 0;

  const seg = (pct: number, color: string, offset: number) =>
    pct > 0 ? (
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${pct * C} ${C}`} strokeDashoffset={-offset} />
    ) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={sw}
        className="text-gray-200 dark:text-gray-700" />
      {total > 0 && (
        <>
          {seg(pF, '#22c55e', quart)}
          {seg(pP, '#eab308', quart + pF * C)}
          {seg(pN, '#ef4444', quart + (pF + pP) * C)}
        </>
      )}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.14} fontWeight="bold"
        className="fill-gray-900 dark:fill-white">
        {total > 0 ? fmtPct(full, total) : '—'}
      </text>
    </svg>
  );
};

// ─── Coverage Bar ─────────────────────────────────────────────────────────────

const CoverageBar: React.FC<{ stats: Stats }> = ({ stats }) => {
  const { full, partial, none, total } = stats;
  if (total === 0) return <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700" />;
  const fp = (full / total) * 100;
  const pp = (partial / total) * 100;
  const np = (none / total) * 100;
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
      {fp > 0 && <div style={{ width: `${fp}%` }} className="bg-green-500" />}
      {pp > 0 && <div style={{ width: `${pp}%` }} className="bg-yellow-400" />}
      {np > 0 && <div style={{ width: `${np}%` }} className="bg-red-400" />}
    </div>
  );
};

// ─── Type Coverage Panel (Automate or Manual) ─────────────────────────────────

const CoveragePanel: React.FC<{
  label: string;
  accent: string;
  stats: Stats;
}> = ({ label, accent, stats }) => {
  return (
    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600/50">
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${accent}`}>{label}</p>
      <div className="flex items-center gap-4">
        <MiniDonut full={stats.full} partial={stats.partial} none={stats.none} size={100} />
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
            <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Full</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-tight tabular-nums">{stats.full}</p>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(stats.full, stats.total)}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
            <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Partial</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight tabular-nums">{stats.partial}</p>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(stats.partial, stats.total)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">None</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-tight tabular-nums">{stats.none}</p>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(stats.none, stats.total)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-tight tabular-nums">{stats.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Product Coverage Card ────────────────────────────────────────────────────

const ProductCoverageCard: React.FC<{
  product: Product;
  automateStats: Stats;
  manualStats: Stats;
  onNavigate: () => void;
}> = ({ product, automateStats, manualStats, onNavigate }) => {
  const totalItems = Math.max(automateStats.total, manualStats.total);
  const overallPct = fmtPct(automateStats.full + manualStats.full, automateStats.total + manualStats.total);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Product header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 min-w-0">
          {product.logo ? (
            <img src={product.logo} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
            <p className="text-xs text-gray-400">{totalItems} test items · {overallPct} overall full coverage</p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
          View Detail →
        </button>
      </div>

      {/* Charts: Automate first, Manual second */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        <CoveragePanel
          label="Automate Coverage"
          accent="text-purple-600 dark:text-purple-400"
          stats={automateStats}
        />
        <CoveragePanel
          label="Manual Coverage"
          accent="text-blue-600 dark:text-blue-400"
          stats={manualStats}
        />
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
  productModules: ProductModule[];
  modules: Module[];
}

export const CoverageOverviewPage: React.FC<Props> = ({ products, productModules, modules: _modules }) => {
  const navigate = useNavigate();
  const { allCoverageItems, loading } = useAllCoverage();

  // Active products only
  const activeProducts = useMemo(
    () => products.filter(p => p.is_active !== false),
    [products]
  );

  // Per-product stats
  const productStats = useMemo(() => {
    return activeProducts.map(product => {
      const items = allCoverageItems.filter(i => i.product_id === product.id);
      const manualItems = items.filter(i => i.coverage_type === 'manual');
      const automateItems = items.filter(i => i.coverage_type === 'automate');
      return {
        product,
        manual: makeStats(manualItems),
        automate: makeStats(automateItems),
      };
    });
  }, [activeProducts, allCoverageItems]);

  // Global totals
  const globalStats = useMemo(() => {
    const allManual = allCoverageItems.filter(i => i.coverage_type === 'manual');
    const allAutomate = allCoverageItems.filter(i => i.coverage_type === 'automate');
    return { manual: makeStats(allManual), automate: makeStats(allAutomate) };
  }, [allCoverageItems]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white text-base">Coverage Overview</h1>
              <p className="text-xs text-gray-400">All Products · Manager View</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* Global summary bar */}
        {!loading && allCoverageItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Overall Summary · {activeProducts.length} Products</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {/* Automate section */}
              <div className="col-span-3 sm:col-span-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3">Automate</p>
                <div className="flex items-center gap-5">
                  <MiniDonut full={globalStats.automate.full} partial={globalStats.automate.partial} none={globalStats.automate.none} size={120} />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Full</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-tight tabular-nums">{globalStats.automate.full}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.automate.full, globalStats.automate.total)}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Partial</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight tabular-nums">{globalStats.automate.partial}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.automate.partial, globalStats.automate.total)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">None</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-tight tabular-nums">{globalStats.automate.none}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.automate.none, globalStats.automate.total)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Total</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-tight tabular-nums">{globalStats.automate.total}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Manual section */}
              <div className="col-span-3 sm:col-span-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Manual</p>
                <div className="flex items-center gap-5">
                  <MiniDonut full={globalStats.manual.full} partial={globalStats.manual.partial} none={globalStats.manual.none} size={120} />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Full</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 leading-tight tabular-nums">{globalStats.manual.full}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.manual.full, globalStats.manual.total)}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Partial</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight tabular-nums">{globalStats.manual.partial}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.manual.partial, globalStats.manual.total)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">None</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-tight tabular-nums">{globalStats.manual.none}</p>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{fmtPct(globalStats.manual.none, globalStats.manual.total)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-0.5">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Total</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-tight tabular-nums">{globalStats.manual.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        )}

        {/* No data */}
        {!loading && allCoverageItems.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No coverage data found across any products.</p>
          </div>
        )}

        {/* Per-product cards */}
        {!loading && productStats.map(({ product, manual, automate }) => (
          <ProductCoverageCard
            key={product.id}
            product={product}
            automateStats={automate}
            manualStats={manual}
            onNavigate={() => navigate(`/test-coverage/${createProductSlug(product.name)}`)}
          />
        ))}

        <div className="h-8" />
      </div>
    </div>
  );
};
