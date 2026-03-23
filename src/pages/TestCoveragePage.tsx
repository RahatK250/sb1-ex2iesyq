import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Settings, CheckCircle2,
  AlertCircle, XCircle, ChevronDown, X, Save, Loader2, GitBranch, LayoutGrid, GripVertical,
} from 'lucide-react';
import { Product, Module, ProductModule, SubModule, ModuleSubModule, CoverageType, CoverageStatus, TestCoverageItem, CreateTestCoverageItemInput, UpdateTestCoverageItemInput } from '../types';
import { useCoverage } from '../hooks/useCoverage';
import { useScrollLock } from '../hooks/useScrollLock';
import { Toast } from '../components/Toast';
import { CustomDropdown } from '../components/CustomDropdown';
import { getSubModules, getAllModuleSubModules } from '../services/database';

// ─── helpers ──────────────────────────────────────────────────────────────────

const createProductSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const COVERAGE_STATUS_CONFIG: Record<CoverageStatus, { label: string; short: string; bg: string; text: string; border: string; dot: string }> = {
  full:        { label: 'Full Coverage',  short: 'Full',    bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  border: 'border-green-200 dark:border-green-700',  dot: 'bg-green-500' },
  partial:     { label: 'Partial',        short: 'Partial', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700', dot: 'bg-yellow-500' },
  no_coverage: { label: 'No Coverage',   short: 'None',    bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-700',      dot: 'bg-red-500' },
};

const STATUS_CYCLE: CoverageStatus[] = ['full', 'partial', 'no_coverage'];
const nextStatus = (s: CoverageStatus): CoverageStatus => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % 3];

// Format percentage: up to 2dp, strip trailing .00
const fmtPct = (numerator: number, denominator: number): string => {
  if (denominator === 0) return '0%';
  const v = (numerator / denominator) * 100;
  const fixed = parseFloat(v.toFixed(2));
  return Number.isInteger(fixed) ? `${fixed}%` : `${fixed}%`;
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

// Convert angle (0° = 12 o'clock, clockwise) to SVG cartesian coordinate
const toXY = (cx: number, cy: number, r: number, angleDeg: number) => ({
  x: cx + r * Math.cos(((angleDeg - 90) * Math.PI) / 180),
  y: cy + r * Math.sin(((angleDeg - 90) * Math.PI) / 180),
});

// Draw an arc segment using a proper SVG path — no seam, no gap
const arcSeg = (
  cx: number, cy: number, r: number, sw: number,
  startDeg: number, endDeg: number, color: string,
) => {
  const span = endDeg - startDeg;
  if (span <= 0) return null;
  if (span >= 359.9999) {
    return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />;
  }
  const s = toXY(cx, cy, r, startDeg);
  const e = toXY(cx, cy, r, endDeg);
  const large = span > 180 ? 1 : 0;
  return (
    <path
      d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
      fill="none" stroke={color} strokeWidth={sw} strokeLinecap="butt"
    />
  );
};

const DonutChart: React.FC<{ full: number; partial: number; none: number; size?: number }> = ({
  full, partial, none, size = 160,
}) => {
  const total = full + partial + none;
  const r = size * 0.375;
  const cx = size / 2, cy = size / 2;
  const sw = size * 0.16;

  const pctFull    = total > 0 ? full / total : 0;
  const pctPartial = total > 0 ? partial / total : 0;
  const pctNone    = total > 0 ? none / total : 0;

  const a0 = 0;
  const a1 = pctFull * 360;
  const a2 = a1 + pctPartial * 360;
  const a3 = a2 + pctNone * 360;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={sw}
        className="text-gray-100 dark:text-gray-700" />
      {total > 0 && (
        <>
          {arcSeg(cx, cy, r, sw, a0, a1, '#22c55e')}
          {arcSeg(cx, cy, r, sw, a1, a2, '#eab308')}
          {arcSeg(cx, cy, r, sw, a2, a3, '#ef4444')}
        </>
      )}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.13} fontWeight="bold"
        fill="currentColor" className="fill-gray-800 dark:fill-white">
        {total > 0 ? fmtPct(full, total) : '—'}
      </text>
    </svg>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: number; pct?: number;
  colorClass: string; bgClass: string; borderClass: string;
  icon: React.FC<{ className?: string }>;
}> = ({ label, value, pct, colorClass, bgClass, borderClass, icon: Icon }) => (
  <div className={`${bgClass} ${borderClass} border rounded-xl p-4 flex flex-col gap-1 min-w-0`}>
    <div className="flex items-center gap-1.5">
      <Icon className={`w-4 h-4 ${colorClass} flex-shrink-0`} />
      <span className={`text-xs font-semibold ${colorClass} uppercase tracking-wide truncate`}>{label}</span>
    </div>
    <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
    {pct !== undefined && (
      <span className="text-xs text-gray-500 dark:text-gray-400">{fmtPct(pct, 100)}</span>
    )}
  </div>
);

// ─── Module Stacked Bar ───────────────────────────────────────────────────────

const ModuleBar: React.FC<{ full: number; partial: number; none: number }> = ({ full, partial, none }) => {
  const total = full + partial + none;
  if (total === 0) return <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 text-xs" />;
  const fp = (full / total) * 100;
  const pp = (partial / total) * 100;
  const np = (none / total) * 100;
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
      {fp > 0 && <div style={{ width: `${fp}%` }} className="bg-green-500" />}
      {pp > 0 && <div style={{ width: `${pp}%` }} className="bg-yellow-400" />}
      {np > 0 && <div style={{ width: `${np}%` }} className="bg-red-400" />}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: CoverageStatus; onClick?: () => void; loading?: boolean }> = ({ status, onClick, loading }) => {
  const cfg = COVERAGE_STATUS_CONFIG[status];
  const Icon = status === 'full' ? CheckCircle2 : status === 'partial' ? AlertCircle : XCircle;
  return (
    <button onClick={onClick} disabled={loading}
      className={`${cfg.bg} ${cfg.text} ${cfg.border} border text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium whitespace-nowrap transition-opacity ${onClick ? 'hover:opacity-75 cursor-pointer' : 'cursor-default'}`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {cfg.label}
    </button>
  );
};

// ─── Coverage Item Modal ──────────────────────────────────────────────────────

interface NewItemFormData {
  module_id: string;
  sub_module_id: string | null;
  name: string;
  description: string;
  coverage_status: CoverageStatus;
  notes: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNew: (data: NewItemFormData) => Promise<void>;
  onSaveEdit: (data: UpdateTestCoverageItemInput) => Promise<void>;
  productId: string;
  modules: Module[];
  subModules: SubModule[];
  moduleSubModules: ModuleSubModule[];
  editItem?: TestCoverageItem | null;
  defaultModuleId?: string;
  defaultSubModuleId?: string | null;
}

const CoverageItemModal: React.FC<ModalProps> = ({
  isOpen, onClose, onSaveNew, onSaveEdit, productId: _productId, modules, subModules, moduleSubModules, editItem, defaultModuleId, defaultSubModuleId,
}) => {
  const [form, setForm] = useState<NewItemFormData>({
    module_id: '',
    sub_module_id: null,
    name: '',
    description: '',
    coverage_status: 'no_coverage',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editItem) {
      setForm({
        module_id: editItem.module_id,
        sub_module_id: editItem.sub_module_id ?? null,
        name: editItem.name,
        description: editItem.description || '',
        coverage_status: editItem.coverage_status,
        notes: editItem.notes || '',
      });
    } else {
      setForm({
        module_id: defaultModuleId || '',
        sub_module_id: defaultSubModuleId ?? null,
        name: '',
        description: '',
        coverage_status: 'no_coverage',
        notes: '',
      });
    }
    setErrors({});
  }, [isOpen, editItem, defaultModuleId, defaultSubModuleId, modules]);

  useScrollLock(isOpen);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.module_id) e.module_id = 'Please select a module';
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      if (editItem) {
        await onSaveEdit({ id: editItem.id, ...form });
      } else {
        await onSaveNew(form);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editItem ? 'Edit Coverage Item' : 'Add Coverage Item'}
            </h2>
            {!editItem && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Will be added to both Manual &amp; Automate (other starts as No Coverage)
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module *</label>
            <div className={errors.module_id ? 'ring-2 ring-red-400 rounded-xl' : ''}>
              <CustomDropdown
                options={modules.map(m => ({ id: m.id, name: m.name }))}
                selectedValue={form.module_id || '__none__'}
                onValueChange={(v) => setForm(f => ({ ...f, module_id: v === '__none__' ? '' : v, sub_module_id: null }))}
                placeholder="— Select module —"
                allText="— Select module —"
                hasAllOption={false}
                className="w-full"
              />
            </div>
            {errors.module_id && <p className="text-xs text-red-500 mt-1">{errors.module_id}</p>}
          </div>

          {/* Sub Module (optional) */}
          {form.module_id && (() => {
            const linkedSubModuleIds = moduleSubModules
              .filter(msm => msm.module_id === form.module_id && msm.is_active !== false)
              .map(msm => msm.sub_module_id);
            const availableSubModules = subModules.filter(sm => linkedSubModuleIds.includes(sm.id) && sm.is_active !== false);
            if (availableSubModules.length === 0) return null;
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Sub Module <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <CustomDropdown
                  options={availableSubModules.map(sm => ({ id: sm.id, name: sm.name }))}
                  selectedValue={form.sub_module_id ?? 'all'}
                  onValueChange={(v) => setForm(f => ({ ...f, sub_module_id: v === 'all' ? null : v }))}
                  allText="— None —"
                  placeholder="— None —"
                  hasAllOption={true}
                  className="w-full"
                />
              </div>
            );
          })()}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Test Item Name *</label>
            <input
              type="text"
              placeholder="e.g. Create, Read, Filter by status…"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={`input-enhanced w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Coverage Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {editItem ? 'Coverage Status' : 'Initial Coverage Status'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(COVERAGE_STATUS_CONFIG) as [CoverageStatus, typeof COVERAGE_STATUS_CONFIG[CoverageStatus]][]).map(([status, cfg]) => (
                <button key={status} onClick={() => setForm(f => ({ ...f, coverage_status: status }))}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${form.coverage_status === status
                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea rows={2} placeholder="Additional notes or description…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-enhanced w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editItem ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

const ConfirmDeleteDialog: React.FC<{
  isOpen: boolean; itemName: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}> = ({ isOpen, itemName, onConfirm, onCancel, loading }) => {
  useScrollLock(isOpen);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Delete Item</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Delete <span className="font-medium text-gray-900 dark:text-white">"{itemName}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-60 transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Combined All Dashboard ────────────────────────────────────────────────────

interface TypeStats { full: number; partial: number; none: number; total: number }

const TypeDashboardCard: React.FC<{
  label: string; stats: TypeStats; accentColor: string;
}> = ({ label, stats, accentColor }) => (
  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${accentColor}`}>{label}</p>
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <DonutChart full={stats.full} partial={stats.partial} none={stats.none} size={140} />
      <div className="grid grid-cols-2 gap-2.5 flex-1 w-full">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-0.5">
          <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Full</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 leading-tight tabular-nums">{stats.full}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{fmtPct(stats.full, stats.total)}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-0.5">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Partial</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 leading-tight tabular-nums">{stats.partial}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{fmtPct(stats.partial, stats.total)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-0.5">
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">No Cov.</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 leading-tight tabular-nums">{stats.none}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{fmtPct(stats.none, stats.total)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-0.5">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Total</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-tight tabular-nums">{stats.total}</p>
        </div>
      </div>
    </div>
  </div>
);

// Mini stacked bar + colored numbers for coverage cells in the module table
const CoverageBar: React.FC<{ full: number; partial: number; none: number; total: number; compact?: boolean }> = ({
  full, partial, none, total, compact = false,
}) => {
  const fPct = total > 0 ? (full / total) * 100 : 0;
  const pPct = total > 0 ? (partial / total) * 100 : 0;
  const nPct = total > 0 ? (none / total) * 100 : 0;

  const bar = (h: string) => (
    <div className={`w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${h}`}>
      {total > 0 ? (
        <div className="flex h-full">
          <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${fPct}%` }} />
          <div className="bg-yellow-400 h-full transition-all duration-300" style={{ width: `${pPct}%` }} />
          <div className="bg-red-400 h-full transition-all duration-300" style={{ width: `${nPct}%` }} />
        </div>
      ) : null}
    </div>
  );

  const counts = (
    <div className="flex items-center justify-center gap-1.5 tabular-nums flex-shrink-0">
      <span className="text-base font-semibold text-green-500 dark:text-green-400 w-6 text-center">{full}</span>
      <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
      <span className="text-base font-semibold text-yellow-500 dark:text-yellow-400 w-6 text-center">{partial}</span>
      <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
      <span className="text-base font-semibold text-red-400 w-6 text-center">{none}</span>
    </div>
  );

  if (total === 0) {
    return <span className="text-xs text-gray-400 dark:text-gray-500 italic">No items</span>;
  }

  if (compact) {
    // Sub-row: bar flex, counts right
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">{bar('h-2')}</div>
        {counts}
      </div>
    );
  }

  // Main row: % left, bar center, counts right — all in one line
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* % indicator — no "full" label */}
      <div className="flex-shrink-0 w-12 text-right leading-none">
        <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{fmtPct(full, total)}</span>
      </div>
      {/* Bar stretches */}
      <div className="flex-1 min-w-0">{bar('h-3')}</div>
      {/* Counts right */}
      {counts}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  selectedProduct: Product | null;
  products: Product[];
  modules: Module[];
  productModules: ProductModule[];
  subModules: SubModule[];
  allSubModules: SubModule[];
  moduleSubModules: ModuleSubModule[];
  onProductChange?: (product: Product) => void;
}

export const TestCoveragePage: React.FC<Props> = ({ selectedProduct, products, modules, productModules, subModules, moduleSubModules }) => {
  const navigate = useNavigate();
  const { productName } = useParams<{ productName: string }>();

  const product = useMemo(() => {
    if (selectedProduct && createProductSlug(selectedProduct.name) === productName) return selectedProduct;
    return products.find(p => createProductSlug(p.name) === productName) || selectedProduct;
  }, [selectedProduct, productName, products]);

  const productModuleIds = useMemo(() =>
    productModules.filter(pm => pm.product_id === product?.id && pm.is_active !== false).map(pm => pm.module_id),
    [productModules, product]
  );
  const productModulesList = useMemo(() =>
    modules.filter(m => productModuleIds.includes(m.id) && m.is_active !== false),
    [modules, productModuleIds]
  );

  const { coverageItems, loading, createCoverageItem, updateCoverageItem, deleteCoverageItem } = useCoverage(product?.id);

  // Local fresh copies — fetched on mount so newly-created sub modules / links are visible
  // even if App.tsx's shared state hasn't been updated yet via Realtime.
  const [freshSubModules, setFreshSubModules] = useState<SubModule[]>(subModules);
  const [freshModuleSubModules, setFreshModuleSubModules] = useState<ModuleSubModule[]>(moduleSubModules);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [sms, msms] = await Promise.all([getSubModules(), getAllModuleSubModules()]);
        if (!cancelled) {
          setFreshSubModules(sms);
          setFreshModuleSubModules(msms);
        }
      } catch {
        // silent — fall back to props already in state
      }
    };
    refresh();
    return () => { cancelled = true; };
  }, []); // run once on mount

  // Keep in sync when parent's Realtime updates arrive
  useEffect(() => { setFreshSubModules(subModules); }, [subModules]);
  useEffect(() => { setFreshModuleSubModules(moduleSubModules); }, [moduleSubModules]);

  const [coverageTypeTab, setCoverageTypeTab] = useState<CoverageType | 'all'>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [showProductSwitcher, setShowProductSwitcher] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TestCoverageItem | null>(null);
  const [defaultModalModule, setDefaultModalModule] = useState<string | undefined>(undefined);
  const [defaultModalSubModuleId, setDefaultModalSubModuleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestCoverageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedSubModule, setSelectedSubModule] = useState<string>('all');
  const [expandedModuleRows, setExpandedModuleRows] = useState<Record<string, boolean>>({});
  // key = `${moduleId}__${subModuleId ?? '__none__'}`, default expanded
  const [expandedSubModuleGroups, setExpandedSubModuleGroups] = useState<Record<string, boolean>>({});

  // ── Drag-and-drop module order ──
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const toggleSubModuleGroup = useCallback((moduleId: string, subModuleId: string | null) => {
    const key = `${moduleId}__${subModuleId ?? '__none__'}`;
    setExpandedSubModuleGroups(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }, []);

  const isSubModuleGroupExpanded = useCallback((moduleId: string, subModuleId: string | null) => {
    const key = `${moduleId}__${subModuleId ?? '__none__'}`;
    // default = expanded (undefined → true)
    return expandedSubModuleGroups[key] !== false;
  }, [expandedSubModuleGroups]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleModuleDragStart = useCallback((e: React.DragEvent, moduleId: string) => {
    dragIdRef.current = moduleId;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleModuleDragOver = useCallback((e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIdRef.current && dragIdRef.current !== moduleId) setDragOverId(moduleId);
  }, []);

  const handleModuleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) { setDragOverId(null); return; }
    setModuleOrder(prev => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(sourceId);
      const toIdx = arr.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, sourceId);
      return arr;
    });
    setDragOverId(null);
    dragIdRef.current = null;
  }, []);

  const handleModuleDragEnd = useCallback(() => {
    setDragOverId(null);
    dragIdRef.current = null;
  }, []);

  // Manual / Automate items split
  const manualItems = useMemo(() => coverageItems.filter(i => i.coverage_type === 'manual'), [coverageItems]);
  const automateItems = useMemo(() => coverageItems.filter(i => i.coverage_type === 'automate'), [coverageItems]);

  // Items shown in list view (manual or automate tab only)
  const filteredItems = useMemo(() => {
    let items = coverageTypeTab === 'manual' ? manualItems : automateItems;
    if (selectedModule !== 'all') items = items.filter(i => i.module_id === selectedModule);
    if (selectedSubModule === '__none__') {
      items = items.filter(i => !i.sub_module_id);
    } else if (selectedSubModule !== 'all') {
      items = items.filter(i => i.sub_module_id === selectedSubModule);
    }
    return items;
  }, [manualItems, automateItems, coverageTypeTab, selectedModule, selectedSubModule]);

  // Stats for current tab
  const makeStats = (items: TestCoverageItem[]): TypeStats => ({
    full:    items.filter(i => i.coverage_status === 'full').length,
    partial: items.filter(i => i.coverage_status === 'partial').length,
    none:    items.filter(i => i.coverage_status === 'no_coverage').length,
    total:   items.length,
  });

  const manualStats = useMemo(() => {
    let base = selectedModule === 'all' ? manualItems : manualItems.filter(i => i.module_id === selectedModule);
    if (selectedSubModule === '__none__') base = base.filter(i => !i.sub_module_id);
    else if (selectedSubModule !== 'all') base = base.filter(i => i.sub_module_id === selectedSubModule);
    return makeStats(base);
  }, [manualItems, selectedModule, selectedSubModule]);

  const automateStats = useMemo(() => {
    let base = selectedModule === 'all' ? automateItems : automateItems.filter(i => i.module_id === selectedModule);
    if (selectedSubModule === '__none__') base = base.filter(i => !i.sub_module_id);
    else if (selectedSubModule !== 'all') base = base.filter(i => i.sub_module_id === selectedSubModule);
    return makeStats(base);
  }, [automateItems, selectedModule, selectedSubModule]);

  const currentStats = coverageTypeTab === 'manual' ? manualStats : automateStats;

  // Per-module stats for current tab (or combined for "all")
  const moduleStats = useMemo(() => {
    return productModulesList.map(mod => {
      const mManual   = manualItems.filter(i => i.module_id === mod.id);
      const mAutomate = automateItems.filter(i => i.module_id === mod.id);
      const forTab    = coverageTypeTab === 'manual' ? mManual : mAutomate;
      return {
        module: mod,
        manual:   makeStats(mManual),
        automate: makeStats(mAutomate),
        tab:      makeStats(forTab),
      };
    });
  }, [productModulesList, manualItems, automateItems, coverageTypeTab]);

  // Sync module order AFTER moduleStats is defined (preserve user order, append new, remove deleted)
  useEffect(() => {
    setModuleOrder(prev => {
      const allIds = moduleStats.map(ms => ms.module.id);
      if (prev.length === 0) return allIds;
      const existingSet = new Set(allIds);
      const filtered = prev.filter(id => existingSet.has(id));
      const newIds = allIds.filter(id => !prev.includes(id));
      return [...filtered, ...newIds];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleStats]);

  const groupedByModule = useMemo(() => {
    return productModulesList.map(mod => ({
      module: mod,
      items: filteredItems.filter(i => i.module_id === mod.id),
    })).filter(g => g.items.length > 0);
  }, [productModulesList, filteredItems]);

  // Sub module filter helpers
  const availableSubModulesForFilter = useMemo(() => {
    if (selectedModule === 'all') {
      // All sub modules linked to any module of this product
      const productModuleIdSet = new Set(productModulesList.map(m => m.id));
      const linkedIds = freshModuleSubModules
        .filter(msm => productModuleIdSet.has(msm.module_id) && msm.is_active !== false)
        .map(msm => msm.sub_module_id);
      return freshSubModules.filter(sm => linkedIds.includes(sm.id) && sm.is_active !== false);
    }
    const linkedIds = freshModuleSubModules
      .filter(msm => msm.module_id === selectedModule && msm.is_active !== false)
      .map(msm => msm.sub_module_id);
    return freshSubModules.filter(sm => linkedIds.includes(sm.id) && sm.is_active !== false);
  }, [selectedModule, freshModuleSubModules, freshSubModules, productModulesList]);

  // Sub module breakdown stats (for All tab and Manual/Automate sidebar)
  const subModuleStatsForModule = useMemo(() => {
    if (selectedModule === 'all' || availableSubModulesForFilter.length === 0) return [];
    const moduleManual = manualItems.filter(i => i.module_id === selectedModule);
    const moduleAutomate = automateItems.filter(i => i.module_id === selectedModule);

    const rows = availableSubModulesForFilter.map(sm => {
      const mItems = moduleManual.filter(i => i.sub_module_id === sm.id);
      const aItems = moduleAutomate.filter(i => i.sub_module_id === sm.id);
      return { id: sm.id, name: sm.name, manual: makeStats(mItems), automate: makeStats(aItems) };
    });

    // Row for items with no sub module
    const mNoSub = moduleManual.filter(i => !i.sub_module_id);
    const aNoSub = moduleAutomate.filter(i => !i.sub_module_id);
    if (mNoSub.length > 0 || aNoSub.length > 0) {
      rows.push({ id: '__none__', name: 'Others', manual: makeStats(mNoSub), automate: makeStats(aNoSub) });
    }

    return rows;
  }, [selectedModule, availableSubModulesForFilter, manualItems, automateItems]);

  // Per-module sub module stats for expandable rows in Coverage by Module table (Overview)
  const moduleSubModuleStats = useMemo(() => {
    const result: Record<string, Array<{ id: string; name: string; manual: TypeStats; automate: TypeStats }>> = {};
    productModulesList.forEach(mod => {
      const linkedIds = freshModuleSubModules
        .filter(msm => msm.module_id === mod.id && msm.is_active !== false)
        .map(msm => msm.sub_module_id);
      const modSubs = freshSubModules.filter(sm => linkedIds.includes(sm.id) && sm.is_active !== false);
      const mManual = manualItems.filter(i => i.module_id === mod.id);
      const mAutomate = automateItems.filter(i => i.module_id === mod.id);
      if (modSubs.length === 0) { result[mod.id] = []; return; }
      const rows = modSubs.map(sm => ({
        id: sm.id, name: sm.name,
        manual: makeStats(mManual.filter(i => i.sub_module_id === sm.id)),
        automate: makeStats(mAutomate.filter(i => i.sub_module_id === sm.id)),
      }));
      const mNoSub = mManual.filter(i => !i.sub_module_id);
      const aNoSub = mAutomate.filter(i => !i.sub_module_id);
      if (mNoSub.length > 0 || aNoSub.length > 0) {
        rows.push({ id: '__none__', name: 'Others', manual: makeStats(mNoSub), automate: makeStats(aNoSub) });
      }
      result[mod.id] = rows;
    });
    return result;
  }, [productModulesList, freshModuleSubModules, freshSubModules, manualItems, automateItems]);

  // Global sub module stats (all product modules) for Manual/Automate dashboard when selectedModule === 'all'
  const subModuleStatsAll = useMemo(() => {
    const productModuleIdSet = new Set(productModulesList.map(m => m.id));
    const linkedIds = freshModuleSubModules
      .filter(msm => productModuleIdSet.has(msm.module_id) && msm.is_active !== false)
      .map(msm => msm.sub_module_id);
    const relevantSubs = freshSubModules.filter(sm => linkedIds.includes(sm.id) && sm.is_active !== false);
    if (relevantSubs.length === 0) return [];
    return relevantSubs.map(sm => {
      const mItems = manualItems.filter(i => i.sub_module_id === sm.id);
      const aItems = automateItems.filter(i => i.sub_module_id === sm.id);
      return { id: sm.id, name: sm.name, manual: makeStats(mItems), automate: makeStats(aItems) };
    });
  }, [productModulesList, freshModuleSubModules, freshSubModules, manualItems, automateItems]);

  const selectedSubModuleName = useMemo(() => {
    if (selectedSubModule === 'all') return null;
    if (selectedSubModule === '__none__') return 'Others';
    return availableSubModulesForFilter.find(sm => sm.id === selectedSubModule)?.name ?? null;
  }, [selectedSubModule, availableSubModulesForFilter]);

  // Reset sub module filter when module changes
  useEffect(() => {
    setSelectedSubModule('all');
  }, [selectedModule]);

  useEffect(() => {
    if (productModulesList.length > 0) {
      const expanded: Record<string, boolean> = {};
      productModulesList.forEach(m => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    }
  }, [productModulesList]);

  const handleBack = () => {
    if (product) navigate(`/features/${createProductSlug(product.name)}`);
    else navigate('/');
  };

  const handleOpenAddModal = (moduleId?: string, subModuleId?: string | null) => {
    setEditItem(null);
    setDefaultModalModule(moduleId);
    setDefaultModalSubModuleId(subModuleId ?? null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: TestCoverageItem) => {
    setEditItem(item);
    setDefaultModalModule(undefined);
    setModalOpen(true);
  };

  // Create BOTH manual and automate records when adding a new item.
  // The tab's type gets the selected status; the other defaults to no_coverage.
  const handleSaveNew = async (data: NewItemFormData) => {
    try {
      const base: Omit<CreateTestCoverageItemInput, 'coverage_type' | 'coverage_status'> = {
        product_id: product?.id ?? '',
        module_id: data.module_id,
        sub_module_id: data.sub_module_id,
        name: data.name,
        description: data.description,
        notes: data.notes,
      };

      // Determine which type is "primary" (gets the user-chosen status)
      const primaryType: CoverageType = coverageTypeTab === 'automate' ? 'automate' : 'manual';
      const secondaryType: CoverageType = primaryType === 'manual' ? 'automate' : 'manual';

      await createCoverageItem({ ...base, coverage_type: primaryType, coverage_status: data.coverage_status });
      await createCoverageItem({ ...base, coverage_type: secondaryType, coverage_status: 'no_coverage' });
      showToast('Coverage item added to both Manual & Automate');
    } catch {
      showToast('Failed to save. Please try again.', 'error');
      throw new Error('save failed');
    }
  };

  const handleSaveEdit = async (data: UpdateTestCoverageItemInput) => {
    try {
      await updateCoverageItem(data);
      showToast('Coverage item updated');
    } catch {
      showToast('Failed to save. Please try again.', 'error');
      throw new Error('save failed');
    }
  };

  const handleQuickStatusChange = async (item: TestCoverageItem) => {
    setUpdatingStatusId(item.id);
    try {
      await updateCoverageItem({ id: item.id, coverage_status: nextStatus(item.coverage_status) });
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteCoverageItem(deleteTarget.id);
      showToast('Item deleted');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedModuleName = useMemo(() => {
    const modName = selectedModule === 'all'
      ? 'All Modules'
      : productModulesList.find(m => m.id === selectedModule)?.name ?? 'All Modules';
    if (selectedSubModuleName) return `${modName} › ${selectedSubModuleName}`;
    return modName;
  }, [selectedModule, productModulesList, selectedSubModuleName]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {toast && <Toast message={toast.message} type={toast.type} isVisible={!!toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button onClick={handleBack}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => navigate('/coverage-overview')}
              title="Coverage Overview — All Products"
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex-shrink-0 px-2 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">All Products</span>
            </button>

            {/* Product switcher — right of All Products, left of Settings */}
            <div className="relative">
              <button
                onClick={() => setShowProductSwitcher(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700/70"
              >
                {product?.logo ? (
                  <img src={product.logo} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">{product?.name?.charAt(0)}</span>
                  </div>
                )}
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[100px] hidden sm:block">{product?.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${showProductSwitcher ? 'rotate-180 text-orange-500' : 'text-gray-400'}`} />
              </button>
              {showProductSwitcher && (
                <div className="absolute top-full mt-1 right-0 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 min-w-[200px] max-h-72 overflow-y-auto">
                  <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Switch Product</p>
                  {products.filter(p => p.is_active !== false).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setShowProductSwitcher(false);
                        navigate(`/test-coverage/${createProductSlug(p.name)}`);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        p.id === product?.id
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p.logo ? (
                        <img src={p.logo} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">{p.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                      {p.id === product?.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Coverage Type Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pb-3">
          {(['all', 'automate', 'manual'] as const).map(tab => (
            <button key={tab} onClick={() => setCoverageTypeTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${coverageTypeTab === tab
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {tab === 'all' ? 'Overview' : tab === 'automate' ? 'Automate' : 'Manual'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* ══ ALL TAB: Combined Dashboard ══ */}
        {coverageTypeTab === 'all' && (
          <>
            {/* Module Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <CustomDropdown
                options={productModulesList.map(m => ({ id: m.id, name: m.name }))}
                selectedValue={selectedModule}
                onValueChange={(v) => setSelectedModule(v)}
                allText="All Modules"
                placeholder="Select module"
                hasAllOption={true}
                className="min-w-[160px]"
              />

              {/* Sub Module Dropdown (when sub modules exist for the current filter context) */}
              {availableSubModulesForFilter.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <CustomDropdown
                    options={availableSubModulesForFilter.map(sm => ({ id: sm.id, name: sm.name }))}
                    selectedValue={selectedSubModule}
                    onValueChange={(v) => setSelectedSubModule(v)}
                    allText="All Sub Modules"
                    placeholder="Select sub module"
                    hasAllOption={true}
                    className="min-w-[160px]"
                  />
                  {selectedSubModule !== 'all' && (
                    <button onClick={() => setSelectedSubModule('all')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
                {/* Side-by-side Automate + Manual dashboards (Automate first) */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <TypeDashboardCard label="Automate Coverage" stats={automateStats} accentColor="text-purple-600 dark:text-purple-400" />
                  <TypeDashboardCard label="Manual Coverage" stats={manualStats} accentColor="text-blue-600 dark:text-blue-400" />
                </div>

                {/* By Sub Module breakdown (when a specific module is selected and has sub modules) */}
                {selectedModule !== 'all' && subModuleStatsForModule.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Coverage by Sub Module</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide" rowSpan={2}>Sub Module</th>
                            <th colSpan={4} className="text-center px-3 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest border-l-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">Manual</th>
                            <th colSpan={4} className="text-center px-3 py-2.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest border-l-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">Automate</th>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                            {(['Full','Partial','None','Total'] as const).map((h, i) => (
                              <th key={`sm-${h}`} className={`text-center px-2 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium ${i === 0 ? 'border-l-2 border-blue-200 dark:border-blue-800' : ''}`}>{h}</th>
                            ))}
                            {(['Full','Partial','None','Total'] as const).map((h, i) => (
                              <th key={`sa-${h}`} className={`text-center px-2 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium ${i === 0 ? 'border-l-2 border-purple-200 dark:border-purple-800' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {subModuleStatsForModule.map(({ id, name, manual, automate }) => (
                            <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                {id !== '__none__' && <GitBranch className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                                {name}
                              </td>
                              <td className="px-2 py-3 text-center text-green-600 dark:text-green-400 font-medium border-l-2 border-blue-100 dark:border-blue-900/30">{manual.full}</td>
                              <td className="px-2 py-3 text-center text-yellow-600 dark:text-yellow-400 font-medium">{manual.partial}</td>
                              <td className="px-2 py-3 text-center text-red-500 dark:text-red-400 font-medium">{manual.none}</td>
                              <td className="px-2 py-3 text-center text-gray-500 dark:text-gray-400">{manual.total}</td>
                              <td className="px-2 py-3 text-center text-green-600 dark:text-green-400 font-medium border-l-2 border-purple-100 dark:border-purple-900/30">{automate.full}</td>
                              <td className="px-2 py-3 text-center text-yellow-600 dark:text-yellow-400 font-medium">{automate.partial}</td>
                              <td className="px-2 py-3 text-center text-red-500 dark:text-red-400 font-medium">{automate.none}</td>
                              <td className="px-2 py-3 text-center text-gray-500 dark:text-gray-400">{automate.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Combined module breakdown */}
                {moduleStats.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Coverage by Module</p>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          <GripVertical className="w-3 h-3" />
                          Drag to reorder
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />Full</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block flex-shrink-0" />Partial</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0" />None</span>
                      </div>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(220px,2fr)_minmax(220px,2fr)] border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/40">
                      <div className="px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center">Module</div>
                      <div className="px-5 py-3 text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-purple-500 dark:bg-purple-400 inline-block" />
                        Automate
                      </div>
                      <div className="px-5 py-3 text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-blue-500 dark:bg-blue-400 inline-block" />
                        Manual
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {moduleStats
                        .filter(ms => selectedModule === 'all' || ms.module.id === selectedModule)
                        .sort((a, b) => {
                          const ai = moduleOrder.indexOf(a.module.id);
                          const bi = moduleOrder.indexOf(b.module.id);
                          if (ai === -1 && bi === -1) return 0;
                          if (ai === -1) return 1;
                          if (bi === -1) return -1;
                          return ai - bi;
                        })
                        .map(({ module, manual, automate }) => {
                        const subRows = moduleSubModuleStats[module.id] ?? [];
                        const isRowExpanded = expandedModuleRows[module.id] === true;
                        const isDragOver = dragOverId === module.id;
                        return (
                          <React.Fragment key={module.id}>
                            <div
                              draggable
                              onDragStart={e => handleModuleDragStart(e, module.id)}
                              onDragOver={e => handleModuleDragOver(e, module.id)}
                              onDrop={e => handleModuleDrop(e, module.id)}
                              onDragEnd={handleModuleDragEnd}
                              className={`grid grid-cols-[minmax(120px,1fr)_minmax(220px,2fr)_minmax(220px,2fr)] transition-colors cursor-grab active:cursor-grabbing
                                ${isDragOver
                                  ? 'bg-blue-50/60 dark:bg-blue-900/20 border-l-2 border-l-blue-400'
                                  : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'
                                }`}
                            >
                              <div className="px-3 py-4 flex items-center gap-1.5">
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab" />
                                {subRows.length > 0 && (
                                  <button
                                    onClick={() => setExpandedModuleRows(prev => ({ ...prev, [module.id]: !isRowExpanded }))}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 p-0.5 rounded">
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRowExpanded ? '' : '-rotate-90'}`} />
                                  </button>
                                )}
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{module.name}</span>
                              </div>
                              <div className="px-5 py-4 border-l border-gray-100 dark:border-gray-700">
                                <CoverageBar full={automate.full} partial={automate.partial} none={automate.none} total={automate.total} />
                              </div>
                              <div className="px-5 py-4 border-l border-gray-100 dark:border-gray-700">
                                <CoverageBar full={manual.full} partial={manual.partial} none={manual.none} total={manual.total} />
                              </div>
                            </div>
                            {isRowExpanded && subRows.map(sr => (
                              <div key={sr.id} className="grid grid-cols-[minmax(120px,1fr)_minmax(220px,2fr)_minmax(220px,2fr)] bg-gray-50/40 dark:bg-gray-700/15 border-t border-dashed border-gray-200 dark:border-gray-700/50">
                                <div className="pl-11 pr-5 py-3 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                  {sr.id !== '__none__' && <GitBranch className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                                  <span className="text-xs font-medium">{sr.name}</span>
                                </div>
                                <div className="px-5 py-3 border-l border-gray-100 dark:border-gray-700">
                                  <CoverageBar full={sr.automate.full} partial={sr.automate.partial} none={sr.automate.none} total={sr.automate.total} compact />
                                </div>
                                <div className="px-5 py-3 border-l border-gray-100 dark:border-gray-700">
                                  <CoverageBar full={sr.manual.full} partial={sr.manual.partial} none={sr.manual.none} total={sr.manual.total} compact />
                                </div>
                              </div>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══ MANUAL / AUTOMATE TABS ══ */}
        {coverageTypeTab !== 'all' && (
          <>
            {/* Dashboard Card — fixed height, 2-row layout */}
            {(() => {
              const subStats = selectedModule !== 'all' && subModuleStatsForModule.length > 0
                ? subModuleStatsForModule
                : selectedModule === 'all' ? subModuleStatsAll : [];
              return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {coverageTypeTab === 'manual' ? 'Manual' : 'Automate'} Coverage Dashboard
                    </h2>
                  </div>

                  {/* ── 4 equal columns ─────────────────────────────────── */}
                  <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700/60 h-[260px]">

                    {/* Col 1 — Donut chart */}
                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                      <DonutChart full={currentStats.full} partial={currentStats.partial} none={currentStats.none} size={150} />
                      <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />Full</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />Partial</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />None</span>
                      </div>
                    </div>

                    {/* Col 2 — 2×2 stat cards */}
                    <div className="flex items-center justify-center p-4">
                      <div className="grid grid-cols-2 gap-2.5 w-full h-full">
                        {[
                          { label: 'Full',    value: currentStats.full,    pct: currentStats.total > 0 ? (currentStats.full    / currentStats.total) * 100 : 0, color: 'text-green-700  dark:text-green-400',  bg: 'bg-green-50  dark:bg-green-900/20',  border: 'border-green-200  dark:border-green-800',  Icon: CheckCircle2 },
                          { label: 'Partial', value: currentStats.partial, pct: currentStats.total > 0 ? (currentStats.partial / currentStats.total) * 100 : 0, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', Icon: AlertCircle  },
                          { label: 'No Cov.', value: currentStats.none,    pct: currentStats.total > 0 ? (currentStats.none    / currentStats.total) * 100 : 0, color: 'text-red-700    dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-900/20',    border: 'border-red-200    dark:border-red-800',    Icon: XCircle      },
                          { label: 'Total',   value: currentStats.total,   pct: undefined,                                                                       color: 'text-blue-700   dark:text-blue-400',   bg: 'bg-blue-50   dark:bg-blue-900/20',   border: 'border-blue-200   dark:border-blue-800',   Icon: LayoutGrid   },
                        ].map(({ label, value, pct, color, bg, border, Icon }) => (
                          <div key={label} className={`${bg} ${border} border rounded-xl px-3 py-2.5 flex flex-col items-center justify-center text-center gap-0.5`}>
                            <div className="flex items-center gap-1 mb-0.5">
                              <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
                              <span className={`text-[10px] font-bold ${color} uppercase tracking-widest`}>{label}</span>
                            </div>
                            <span className={`text-3xl font-bold leading-tight tabular-nums ${color}`}>{value}</span>
                            {pct !== undefined && <span className="text-[10px] text-gray-400">{fmtPct(pct, 100)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Col 3 — By Module */}
                    <div className="flex flex-col px-3 py-3 overflow-x-hidden overflow-y-hidden">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">By Module</p>
                      {moduleStats.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No modules.</p>
                      ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-dashboard space-y-0.5">
                          {moduleStats.map(({ module, tab }) => {
                            const isSelected = selectedModule === module.id;
                            return (
                              <div key={module.id}
                                className={`flex items-stretch rounded-md transition-all cursor-pointer ${
                                  isSelected ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                                onClick={() => setSelectedModule(m => m === module.id ? 'all' : module.id)}
                              >
                                {/* left indicator bar — always present to avoid layout shift */}
                                <div className={`w-0.5 rounded-full flex-shrink-0 my-1 mr-2 transition-colors ${
                                  isSelected ? 'bg-orange-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0 py-1 pr-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className={`text-[11px] truncate flex-1 leading-tight font-medium transition-colors ${
                                      isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                                    }`}>{module.name}</span>
                                    <span className="text-[10px] text-green-500 dark:text-green-400 tabular-nums w-4 text-right flex-shrink-0">{tab.full}</span>
                                    <span className="text-[10px] text-yellow-500 dark:text-yellow-400 tabular-nums w-4 text-right flex-shrink-0">{tab.partial}</span>
                                    <span className="text-[10px] text-red-400 tabular-nums w-4 text-right flex-shrink-0">{tab.none}</span>
                                  </div>
                                  <ModuleBar full={tab.full} partial={tab.partial} none={tab.none} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Col 4 — By Sub Module (or empty state) */}
                    <div className="flex flex-col px-3 py-3 overflow-x-hidden overflow-y-hidden">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">By Sub Module</p>
                      {subStats.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-[11px] text-gray-300 dark:text-gray-600 italic text-center">No sub modules linked</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-dashboard space-y-0.5">
                          {subStats.map(({ id, name, manual, automate }) => {
                            const tabStats = coverageTypeTab === 'manual' ? manual : automate;
                            const isSubSelected = selectedSubModule === id;
                            return (
                              <div key={id}
                                className={`flex items-stretch rounded-md transition-all cursor-pointer ${
                                  isSubSelected ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                                onClick={() => setSelectedSubModule(s => s === id ? 'all' : id)}
                              >
                                <div className={`w-0.5 rounded-full flex-shrink-0 my-1 mr-2 transition-colors ${
                                  isSubSelected ? 'bg-orange-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0 py-1 pr-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className={`text-[11px] truncate flex-1 leading-tight font-medium transition-colors flex items-center gap-1 ${
                                      isSubSelected ? 'text-orange-500 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {id !== '__none__' && <GitBranch className="w-2.5 h-2.5 flex-shrink-0 opacity-40" />}
                                      {name}
                                    </span>
                                    <span className="text-[10px] text-green-500 dark:text-green-400 tabular-nums w-4 text-right flex-shrink-0">{tabStats.full}</span>
                                    <span className="text-[10px] text-yellow-500 dark:text-yellow-400 tabular-nums w-4 text-right flex-shrink-0">{tabStats.partial}</span>
                                    <span className="text-[10px] text-red-400 tabular-nums w-4 text-right flex-shrink-0">{tabStats.none}</span>
                                  </div>
                                  <ModuleBar full={tabStats.full} partial={tabStats.partial} none={tabStats.none} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Filter + Add */}
            <div className="flex items-center gap-3 flex-wrap">
              <CustomDropdown
                options={productModulesList.map(m => ({ id: m.id, name: m.name }))}
                selectedValue={selectedModule}
                onValueChange={(v) => setSelectedModule(v)}
                allText="All Modules"
                placeholder="Select module"
                hasAllOption={true}
                className="min-w-[160px]"
              />

              {/* Sub Module Dropdown (when sub modules exist for the current filter context) */}
              {availableSubModulesForFilter.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <CustomDropdown
                    options={availableSubModulesForFilter.map(sm => ({ id: sm.id, name: sm.name }))}
                    selectedValue={selectedSubModule}
                    onValueChange={(v) => setSelectedSubModule(v)}
                    allText="All Sub Modules"
                    placeholder="Select sub module"
                    hasAllOption={true}
                    className="min-w-[160px]"
                  />
                  {selectedSubModule !== 'all' && (
                    <button onClick={() => setSelectedSubModule('all')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1" />
              <button onClick={() => handleOpenAddModal(selectedModule !== 'all' ? selectedModule : undefined)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            )}

            {/* Empty state */}
            {!loading && groupedByModule.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {coverageItems.length === 0
                    ? 'No coverage items yet. Click "Add Item" to start logging.'
                    : 'No items match the current filters.'}
                </p>
              </div>
            )}

            {/* Items grouped by module */}
            {!loading && groupedByModule.map(({ module, items }) => {
              const isExpanded = expandedModules[module.id] !== false;
              const mFull    = items.filter(i => i.coverage_status === 'full').length;
              const mPartial = items.filter(i => i.coverage_status === 'partial').length;
              const mNone    = items.filter(i => i.coverage_status === 'no_coverage').length;

              // Group items by sub module within this module
              const subRowDefs = moduleSubModuleStats[module.id] ?? [];
              const hasSubModules = subRowDefs.length > 0;

              // Build sub-grouped display: sub module sections + items with no sub module
              const itemsBySubModule: Array<{ subModuleId: string | null; subModuleName: string | null; items: TestCoverageItem[] }> = [];
              if (hasSubModules) {
                // linked sub modules
                subRowDefs.filter(sr => sr.id !== '__none__').forEach(sr => {
                  const srItems = items.filter(i => i.sub_module_id === sr.id);
                  if (srItems.length > 0) itemsBySubModule.push({ subModuleId: sr.id, subModuleName: sr.name, items: srItems });
                });
                // no sub module
                const noSubItems = items.filter(i => !i.sub_module_id);
                if (noSubItems.length > 0) itemsBySubModule.push({ subModuleId: null, subModuleName: null, items: noSubItems });
              }

              const renderItemRow = (item: TestCoverageItem, idx: number) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.coverage_status} loading={updatingStatusId === item.id} onClick={() => handleQuickStatusChange(item)} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.notes ? (
                      <span
                        className="text-gray-500 dark:text-gray-400 text-xs truncate block cursor-default"
                        title={item.notes}
                      >
                        {item.notes}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );

              return (
                <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  {/* Module header */}
                  <div
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
                    onClick={() => setExpandedModules(prev => ({ ...prev, [module.id]: !isExpanded }))}
                  >
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{module.name}</span>
                    <div className="flex items-center gap-2 ml-1">
                      {mFull > 0    && <span className="text-xs text-green-600 dark:text-green-400 font-medium">{mFull} full</span>}
                      {mPartial > 0 && <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{mPartial} partial</span>}
                      {mNone > 0    && <span className="text-xs text-red-500 dark:text-red-400 font-medium">{mNone} none</span>}
                    </div>
                    <div className="flex-1 mx-2">
                      <ModuleBar full={mFull} partial={mPartial} none={mNone} />
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">{items.length} items</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleOpenAddModal(module.id); }}
                      className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors ml-2">
                      <Plus className="w-3.5 h-3.5" />Add
                    </button>
                  </div>

                  {/* Items table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col style={{ width: '40px' }} />
                          <col style={{ width: '38%' }} />
                          <col style={{ width: '160px' }} />
                          <col style={{ width: 'auto' }} className="hidden md:table-column" />
                          <col style={{ width: '72px' }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">#</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Test Item</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Notes</th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {hasSubModules ? (
                            itemsBySubModule.map(({ subModuleId, subModuleName, items: smItems }) => {
                              const smExpanded = isSubModuleGroupExpanded(module.id, subModuleId);
                              const smFull    = smItems.filter(i => i.coverage_status === 'full').length;
                              const smPartial = smItems.filter(i => i.coverage_status === 'partial').length;
                              const smNone    = smItems.filter(i => i.coverage_status === 'no_coverage').length;
                              return (
                                <React.Fragment key={subModuleId ?? '__none__'}>
                                  {/* Sub module separator row */}
                                  <tr
                                    className="bg-indigo-50/60 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800/30 transition-colors group/smrow hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                  >
                                    <td colSpan={5} className="px-4 py-2">
                                      <div className="flex items-center gap-2">
                                        {/* Expand/collapse toggle */}
                                        <button
                                          onClick={() => toggleSubModuleGroup(module.id, subModuleId)}
                                          className="flex items-center gap-2 flex-1 min-w-0"
                                        >
                                          <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 flex-shrink-0 transition-transform ${smExpanded ? '' : '-rotate-90'}`} />
                                          {subModuleId ? (
                                            <>
                                              <GitBranch className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{subModuleName}</span>
                                            </>
                                          ) : (
                                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 italic">Others</span>
                                          )}
                                          <span className="text-xs text-gray-400">({smItems.length})</span>
                                          <div className="flex items-center gap-1.5 ml-1">
                                            {smFull > 0    && <span className="text-xs text-green-500 dark:text-green-400">{smFull} full</span>}
                                            {smPartial > 0 && <span className="text-xs text-yellow-500 dark:text-yellow-400">{smPartial} partial</span>}
                                            {smNone > 0    && <span className="text-xs text-red-400">{smNone} none</span>}
                                          </div>
                                        </button>
                                        {/* +Add button — visible on hover */}
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleOpenAddModal(module.id, subModuleId);
                                          }}
                                          className="opacity-0 group-hover/smrow:opacity-100 flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 font-medium transition-all px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 flex-shrink-0"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          Add
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {smExpanded && smItems.map((item, idx) => renderItemRow(item, idx))}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            items.map((item, idx) => renderItemRow(item, idx))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div className="h-8" />
      </div>

      {/* Modals */}
      <CoverageItemModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSaveNew={handleSaveNew}
        onSaveEdit={handleSaveEdit}
        productId={product?.id ?? ''}
        modules={productModulesList}
        subModules={freshSubModules}
        moduleSubModules={freshModuleSubModules}
        editItem={editItem}
        defaultModuleId={defaultModalModule}
        defaultSubModuleId={defaultModalSubModuleId}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={!!deletingId}
      />

      {showProductSwitcher && (
        <div className="fixed inset-0 z-20" onClick={() => setShowProductSwitcher(false)} />
      )}
    </div>
  );
};

