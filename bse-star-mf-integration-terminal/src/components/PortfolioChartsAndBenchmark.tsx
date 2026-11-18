/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 15: Reusable Institutional Portfolio Visualization & Multi-Benchmark TRI Engine
 *
 * Deployed across ALL 4 User Levels:
 *  - Category 1: Standalone MFD (Client Portfolio Review)
 *  - Category 2: Network MFD / Sub-Broker (Client Portfolio + Practice AUM Book)
 *  - Category 3: End Investor / Client (Personal Wealth & Benchmark Dashboard)
 *  - Category 4: Tanashvi Promoters / HQ (Platform-Wide AUM Book & TRI Data Manager)
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Database,
  SlidersHorizontal,
  ShieldCheck,
  Info,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  PlusCircle,
  X,
  GitCompare
} from 'lucide-react';
import {
  BENCHMARK_DEFINITIONS,
  BenchmarkId,
  BenchmarkStoreEntry,
  HorizonKey,
  StandardBenchmarkId,
  computePortfolioComparison,
  computePortfolioDiversification,
  formatInrCompact,
  importBenchmarkCsvClient,
  loadBenchmarkStore,
  syncAllBenchmarksLive,
  upsertManualTriPoint
} from '../utils/benchmarkData';
import { exportReportToPdf, exportToExcelXls } from '../utils/exportUtils';

export interface ChartHoldingItem {
  name: string;
  invested: number;
  currentValue: number;
  xirr: number;
  category: string;
}

export interface ChartSectorItem {
  sector: string;
  weight: number;
  color: string;
}

export interface PortfolioChartsAndBenchmarkProps {
  title: string;
  subtitle?: string;
  entityName: string;
  pan?: string;
  ucc?: string;
  totalInvested: number;
  currentValue: number;
  portfolioXirr: number;
  assetAllocation: {
    equityPct: number;
    debtPct: number;
    liquidPct: number;
    hybridPct?: number;
  };
  marketCapAllocation?: {
    largeCapPct: number;
    midCapPct: number;
    smallCapPct: number;
    debtCashPct?: number;
  };
  holdings: ChartHoldingItem[];
  sectorBreakdown?: ChartSectorItem[];
  userRole: 'INVESTOR' | 'MFD' | 'NETWORK_MFD' | 'PROMOTER';
  defaultBenchmark?: BenchmarkId;
  isBookLevel?: boolean;
}

interface DonutSlice {
  label: string;
  pct: number;
  color: string;
  amountInr: number;
}

const InteractiveDonutChart: React.FC<{
  title: string;
  subtitle: string;
  slices: DonutSlice[];
  totalValueInr: number;
}> = ({ title, subtitle, slices, totalValueInr }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const cleanSlices = slices.filter(s => s.pct > 0.05);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const activeSlice = hoveredIdx !== null ? cleanSlices[hoveredIdx] : null;

  return (
    <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-serif text-white font-semibold flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#c5a059]" />
            {title}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 150 150" className="w-36 h-36 -rotate-90">
            <circle cx="75" cy="75" r={radius} fill="none" stroke="#1e293b" strokeWidth="18" />
            {cleanSlices.map((slice, idx) => {
              const dashLen = (slice.pct / 100) * circumference;
              const dashOffset = -cumulative * circumference;
              cumulative += slice.pct / 100;
              const isHover = hoveredIdx === idx;
              return (
                <circle
                  key={slice.label}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHover ? 22 : 18}
                  strokeDasharray={`${Math.max(0, dashLen - 1.5)} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-200 cursor-pointer"
                  opacity={hoveredIdx === null || isHover ? 1 : 0.45}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate max-w-[92px]">
              {activeSlice ? activeSlice.label : 'Total Value'}
            </span>
            <span className="text-sm font-mono font-bold text-white mt-0.5">
              {activeSlice ? `${activeSlice.pct.toFixed(1)}%` : formatInrCompact(totalValueInr)}
            </span>
            {activeSlice && (
              <span className="text-[10px] font-mono text-[#c5a059]">
                {formatInrCompact(activeSlice.amountInr)}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          {cleanSlices.map((slice, idx) => {
            const isHover = hoveredIdx === idx;
            return (
              <div
                key={slice.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isHover
                    ? 'bg-slate-800/90 border-[#c5a059]/50'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-200 truncate">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-slate-400 text-[11px]">{formatInrCompact(slice.amountInr)}</span>
                  <span className="font-bold text-white w-12 text-right">{slice.pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const PortfolioChartsAndBenchmark: React.FC<PortfolioChartsAndBenchmarkProps> = ({
  title,
  subtitle,
  entityName,
  pan,
  ucc,
  totalInvested,
  currentValue,
  portfolioXirr,
  assetAllocation,
  marketCapAllocation,
  holdings,
  sectorBreakdown,
  userRole,
  defaultBenchmark = 'NIFTY_500_TRI',
  isBookLevel = false
}) => {
  const [store, setStore] = useState<Record<StandardBenchmarkId, BenchmarkStoreEntry>>(() => loadBenchmarkStore());
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkId>(defaultBenchmark);
  const [horizon, setHorizon] = useState<HorizonKey>('3Y');
  const [chartMode, setChartMode] = useState<'INR' | 'BASE100'>('INR');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Benchmark TRI Data Management Drawer State
  const [showDataManager, setShowDataManager] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [csvTargetId, setCsvTargetId] = useState<StandardBenchmarkId>('NIFTY_50_TRI');
  const [manualTargetId, setManualTargetId] = useState<StandardBenchmarkId>('NIFTY_50_TRI');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualValue, setManualValue] = useState<string>('');
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const canManageTriData = userRole === 'MFD' || userRole === 'NETWORK_MFD' || userRole === 'PROMOTER';

  // Compute comparison metrics & dual curve
  const comparison = useMemo(
    () =>
      computePortfolioComparison({
        store,
        benchmarkId: selectedBenchmark,
        horizon,
        totalInvested,
        currentValue,
        portfolioXirr,
        assetAllocation
      }),
    [store, selectedBenchmark, horizon, totalInvested, currentValue, portfolioXirr, assetAllocation]
  );

  // Compute Portfolio Diversification & Mutual Fund Overlap Analysis
  const diversification = useMemo(
    () => computePortfolioDiversification(holdings, assetAllocation),
    [holdings, assetAllocation]
  );

  // Auto-derive market cap split if not explicitly passed
  const mcapSlices: DonutSlice[] = useMemo(() => {
    const mc = marketCapAllocation || {
      largeCapPct: Number((assetAllocation.equityPct * 0.68).toFixed(1)),
      midCapPct: Number((assetAllocation.equityPct * 0.21).toFixed(1)),
      smallCapPct: Number((assetAllocation.equityPct * 0.11).toFixed(1)),
      debtCashPct: Number((100 - assetAllocation.equityPct).toFixed(1))
    };
    return [
      { label: 'Large Cap', pct: mc.largeCapPct, color: '#c5a059', amountInr: (currentValue * mc.largeCapPct) / 100 },
      { label: 'Mid Cap', pct: mc.midCapPct, color: '#38bdf8', amountInr: (currentValue * mc.midCapPct) / 100 },
      { label: 'Small Cap', pct: mc.smallCapPct, color: '#34d399', amountInr: (currentValue * mc.smallCapPct) / 100 },
      {
        label: 'Debt & Liquid',
        pct: mc.debtCashPct ?? Math.max(0, 100 - mc.largeCapPct - mc.midCapPct - mc.smallCapPct),
        color: '#64748b',
        amountInr: (currentValue * (mc.debtCashPct ?? Math.max(0, 100 - mc.largeCapPct - mc.midCapPct - mc.smallCapPct))) / 100
      }
    ];
  }, [marketCapAllocation, assetAllocation.equityPct, currentValue]);

  const assetSlices: DonutSlice[] = useMemo(
    () => [
      {
        label: 'Equity',
        pct: assetAllocation.equityPct,
        color: '#c5a059',
        amountInr: (currentValue * assetAllocation.equityPct) / 100
      },
      {
        label: 'Hybrid',
        pct: assetAllocation.hybridPct || 0,
        color: '#a78bfa',
        amountInr: (currentValue * (assetAllocation.hybridPct || 0)) / 100
      },
      {
        label: 'Debt',
        pct: assetAllocation.debtPct,
        color: '#38bdf8',
        amountInr: (currentValue * assetAllocation.debtPct) / 100
      },
      {
        label: 'Liquid / Cash',
        pct: assetAllocation.liquidPct,
        color: '#34d399',
        amountInr: (currentValue * assetAllocation.liquidPct) / 100
      }
    ],
    [assetAllocation, currentValue]
  );

  // --- TRI Update Handlers ---
  const handleLiveSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllBenchmarksLive(store);
      setStore(res.store);
      setSyncFeedback({
        type: res.updatedCount > 0 ? 'success' : 'info',
        text: res.summaryMessage
      });
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err?.message || 'Sync error occurred.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = String(ev.target?.result || '');
        const res = importBenchmarkCsvClient(store, csvTargetId, text);
        setStore(res.store);
        setSyncFeedback({
          type: 'success',
          text: `Imported ${res.rowsImported} TRI records into ${csvTargetId.replace(/_/g, ' ')} (Latest: ${res.latestDate} = ${res.latestValue.toLocaleString('en-IN')}).`
        });
      } catch (err: any) {
        setSyncFeedback({ type: 'error', text: err?.message || 'Could not parse CSV file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualUpsert = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(manualValue);
    if (isNaN(num) || num <= 0) {
      setSyncFeedback({ type: 'error', text: 'Please enter a valid positive numeric TRI value.' });
      return;
    }
    try {
      const updated = upsertManualTriPoint(store, manualTargetId, manualDate, num);
      setStore(updated);
      setManualValue('');
      setSyncFeedback({
        type: 'success',
        text: `Updated ${manualTargetId.replace(/_/g, ' ')} on ${manualDate} to ${num.toLocaleString('en-IN')}.`
      });
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err?.message || 'Failed to update TRI value.' });
    }
  };

  // --- Branded Export Handlers ---
  const handleExportPdf = () => {
    const headers = ['Date', 'Portfolio Value', `${comparison.benchmarkName} Equiv.`, 'Portfolio (Base 100)', 'Benchmark (Base 100)', 'Spread (%)'];
    const step = Math.max(1, Math.floor(comparison.series.length / 14));
    const rows = comparison.series
      .filter((_, idx) => idx % step === 0 || idx === comparison.series.length - 1)
      .map(pt => [
        pt.date,
        formatInrCompact(pt.portfolioValueInr),
        formatInrCompact(pt.benchmarkValueInr),
        pt.portfolioBase100.toFixed(1),
        pt.benchmarkBase100.toFixed(1),
        `${pt.spreadPct >= 0 ? '+' : ''}${pt.spreadPct.toFixed(2)}%`
      ]);

    exportReportToPdf({
      title: `${title} — Benchmark Review`,
      subtitle: `Compared against ${comparison.benchmarkName} (${horizon} Horizon · TRI Data As Of ${comparison.benchmarkLastUpdated})`,
      clientName: entityName,
      pan,
      ucc,
      summaryCards: [
        { label: 'Portfolio XIRR', value: `${comparison.portfolioXirr.toFixed(2)}%` },
        { label: `${comparison.benchmarkName} Return`, value: `${comparison.benchmarkXirr.toFixed(2)}%` },
        { label: 'Net Alpha', value: `${comparison.netAlpha >= 0 ? '+' : ''}${comparison.netAlpha.toFixed(2)}%` },
        { label: 'Extra Wealth vs Index', value: `${comparison.extraWealthInr >= 0 ? '+' : ''}${formatInrCompact(comparison.extraWealthInr)}` }
      ],
      headers,
      rows,
      filename: `Tanashvi_Benchmark_Review_${entityName.replace(/\s+/g, '_')}.pdf`,
      footerNotes: [
        'Benchmark comparison uses Total Return Index (TRI) variants assuming dividend reinvestment per SEBI Circular SEBI/HO/IMD/DF3/CIR/P/2018/04.',
        `TRI Data As Of ${comparison.benchmarkLastUpdated} (${comparison.benchmarkSource}). Past performance is not indicative of future returns.`
      ]
    });
  };

  const handleExportXls = () => {
    const headers = ['Date', 'Portfolio Value (INR)', 'Benchmark Equiv. Value (INR)', 'Portfolio Base 100', 'Benchmark Base 100', 'Alpha Spread (%)'];
    const rows = comparison.series.map(pt => [
      pt.date,
      pt.portfolioValueInr,
      pt.benchmarkValueInr,
      pt.portfolioBase100,
      pt.benchmarkBase100,
      pt.spreadPct
    ]);
    exportToExcelXls(
      `Tanashvi_Benchmark_${entityName.replace(/\s+/g, '_')}.xls`,
      `${entityName} vs ${comparison.benchmarkName}`,
      headers,
      rows
    );
  };

  // --- SVG Chart Geometry ---
  const svgW = 860;
  const svgH = 300;
  const padL = 72;
  const padR = 24;
  const padT = 22;
  const padB = 38;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const series = comparison.series;
  const portVals = series.map(p => (chartMode === 'INR' ? p.portfolioValueInr : p.portfolioBase100));
  const benchVals = series.map(p => (chartMode === 'INR' ? p.benchmarkValueInr : p.benchmarkBase100));
  const allVals = [...portVals, ...benchVals];
  const minVal = Math.min(...allVals) * 0.96;
  const maxVal = Math.max(...allVals) * 1.04;
  const span = Math.max(1, maxVal - minVal);

  const xPos = (i: number) => padL + (i / Math.max(1, series.length - 1)) * plotW;
  const yPos = (v: number) => padT + plotH - ((v - minVal) / span) * plotH;

  const portPath = series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(chartMode === 'INR' ? pt.portfolioValueInr : pt.portfolioBase100).toFixed(1)}`)
    .join(' ');
  const benchPath = series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(chartMode === 'INR' ? pt.benchmarkValueInr : pt.benchmarkBase100).toFixed(1)}`)
    .join(' ');
  const portAreaPath = `${portPath} L ${xPos(series.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${padL} ${(padT + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minVal + t * span);
  const xTickIndices = [0, Math.floor(series.length * 0.25), Math.floor(series.length * 0.5), Math.floor(series.length * 0.75), series.length - 1];

  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : series[series.length - 1];
  const maxHoldingVal = Math.max(1, ...holdings.map(h => Math.max(h.invested, h.currentValue)));

  const sourceBadgeLabel: Record<string, string> = {
    LIVE_AMFI_PROXY: 'Live AMFI TRI Sync',
    CSV_IMPORT: 'Official NSE/BSE CSV',
    MANUAL_ENTRY: 'Admin Manual TRI',
    LOCAL_SEED_FIXTURE: 'Verified Seed TRI'
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#131d33] to-[#0f172a] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30">
                {isBookLevel ? 'Practice / Platform Book Analytics' : 'Portfolio Visuals & TRI Benchmarking'}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                TRI As Of: {comparison.benchmarkLastUpdated} · {sourceBadgeLabel[comparison.benchmarkSource]}
              </span>
            </div>
            <h3 className="text-xl font-serif text-white font-semibold mt-2">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLiveSync}
              disabled={isSyncing}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Fetch latest EOD Total Return Index proxy values via AMFI open feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing TRI...' : 'Sync Live TRI'}
            </button>

            {canManageTriData && (
              <button
                onClick={() => setShowDataManager(v => !v)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  showDataManager
                    ? 'bg-[#c5a059] text-slate-950 border-[#c5a059]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Update TRI Data
              </button>
            )}

            <button
              onClick={handleExportPdf}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#c5a059] hover:bg-[#d4b26d] text-slate-950 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button
              onClick={handleExportXls}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export XLS
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {syncFeedback && (
          <div
            className={`mt-4 px-3.5 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3 border ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : syncFeedback.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncFeedback.text}</span>
            </div>
            <button onClick={() => setSyncFeedback(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Benchmark TRI Data Update Manager (MFD / Promoter Admin Panel) */}
        {showDataManager && canManageTriData && (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#c5a059]" />
                  Benchmark TRI Data Freshness & Update Center
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Keep Nifty 50 / Nifty 500 / Midcap / Smallcap / Sensex / CRISIL TRI series current via Live AMFI Proxy Sync, official NSE/BSE CSV upload, or manual EOD entry.
                </p>
              </div>
              <button onClick={() => setShowDataManager(false)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            {/* Status Grid of all 6 Benchmarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BENCHMARK_DEFINITIONS.map(def => {
                const entry = store[def.id];
                return (
                  <div key={def.id} className="bg-[#080e1a] border border-slate-800 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
                        {def.shortName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {sourceBadgeLabel[entry.source]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
                      <span>As of: <strong className="text-slate-200">{entry.lastUpdatedDate}</strong></span>
                      <span>Val: <strong className="text-[#c5a059]">{entry.latestValue.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      AMFI Proxy #{def.amfiProxyCode} · {entry.points.length} pts
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Two Update Mechanisms: CSV Upload + Manual Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Official NSE/BSE CSV Import */}
              <div className="bg-[#080e1a] border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-semibold text-white flex items-center gap-2 mb-2">
                  <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                  Upload Official NSE Indices / BSE TRI CSV
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Supports official historical CSV exports from <code className="text-sky-300">niftyindices.com</code> or <code className="text-sky-300">asiaindices.co.in</code> (<code className="text-slate-300">Date, Total Returns Index</code>).
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={csvTargetId}
                    onChange={e => setCsvTargetId(e.target.value as StandardBenchmarkId)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {BENCHMARK_DEFINITIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Choose CSV File
                  </button>
                </div>
              </div>

              {/* Manual Single-Day EOD Entry */}
              <form onSubmit={handleManualUpsert} className="bg-[#080e1a] border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-semibold text-white flex items-center gap-2 mb-2">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Manual EOD TRI Closing Value Override
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <select
                    value={manualTargetId}
                    onChange={e => setManualTargetId(e.target.value as StandardBenchmarkId)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    {BENCHMARK_DEFINITIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.shortName}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="TRI Value"
                    value={manualValue}
                    onChange={e => setManualValue(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-slate-500">
                    Backend server also runs automated nightly cron via <code className="text-slate-400">POST /api/v1/benchmarks/sync</code>.
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                  >
                    Save Point
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Selector + Horizon + Display Mode Controls */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-[#c5a059]" />
            Select Benchmark Index (TRI)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BENCHMARK_DEFINITIONS.map(def => {
              const active = selectedBenchmark === def.id;
              return (
                <button
                  key={def.id}
                  onClick={() => setSelectedBenchmark(def.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#c5a059]/20 border-[#c5a059] text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
                  {def.shortName}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedBenchmark('CUSTOM_BLENDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                selectedBenchmark === 'CUSTOM_BLENDED'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title="Automatically weights Nifty 500 TRI & CRISIL Debt to match this portfolio's exact Equity:Debt allocation"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Blended (Auto-Mix)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Horizon Switcher */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex items-center gap-1">
            {(['6M', '1Y', '3Y', '5Y', 'ALL'] as HorizonKey[]).map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                  horizon === h ? 'bg-[#c5a059] text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Chart Mode Switcher */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex items-center gap-1">
            <button
              onClick={() => setChartMode('INR')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                chartMode === 'INR' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ₹ Growth
            </button>
            <button
              onClick={() => setChartMode('BASE100')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                chartMode === 'BASE100' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Base 100
            </button>
          </div>
        </div>
      </div>

      {/* 4 Institutional Alpha & Benchmark KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Portfolio vs. Benchmark XIRR
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-bold text-[#c5a059]">
              {comparison.portfolioXirr.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500">vs</span>
            <span className="text-lg font-mono font-semibold" style={{ color: comparison.benchmarkColor }}>
              {comparison.benchmarkXirr.toFixed(2)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {comparison.blendedComposition || `${comparison.benchmarkName} (${horizon} CAGR)`}
          </div>
        </div>

        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Net Alpha Generated
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-2xl font-mono font-bold ${
                comparison.outperforming ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {comparison.netAlpha >= 0 ? '+' : ''}
              {comparison.netAlpha.toFixed(2)}%
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                comparison.outperforming
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {comparison.outperforming ? (
                <>
                  <TrendingUp className="w-3 h-3" /> Beating Index
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" /> Trailing Index
                </>
              )}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Annualized excess return over {comparison.benchmarkName}</div>
        </div>

        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Extra Wealth vs. Passive Index
          </div>
          <div
            className={`text-2xl font-mono font-bold mt-2 ${
              comparison.extraWealthInr >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {comparison.extraWealthInr >= 0 ? '+' : ''}
            {formatInrCompact(comparison.extraWealthInr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Port: {formatInrCompact(comparison.portfolioCurrentValue)} · Index Equiv: {formatInrCompact(comparison.benchmarkEquivalentValue)}
          </div>
        </div>

        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Drawdown & Risk Capture
          </div>
          <div className="flex items-baseline gap-2 mt-2 font-mono">
            <span className="text-xl font-bold text-white">{comparison.portfolioMaxDrawdown.toFixed(1)}%</span>
            <span className="text-xs text-slate-500">vs</span>
            <span className="text-sm text-rose-400">{comparison.benchmarkMaxDrawdown.toFixed(1)}%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Beta: <strong className="text-slate-200">{comparison.portfolioBeta}</strong> · Up: <strong className="text-emerald-400">{comparison.upCapturePct}%</strong> · Down: <strong className="text-sky-400">{comparison.downCapturePct}%</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Dual-Series Benchmark Growth Chart */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-base font-serif text-white font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#c5a059]" />
              {chartMode === 'INR'
                ? `${entityName} Wealth Trajectory vs. ${comparison.benchmarkName}`
                : `Normalized Performance (Base 100) vs. ${comparison.benchmarkName}`}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover across the chart to inspect exact point-in-time valuation and alpha spread.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#c5a059] inline-block" />
              <span className="text-slate-200 font-medium">{isBookLevel ? 'Advised AUM Book' : 'Portfolio'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-0.5 border-t-2 border-dashed inline-block"
                style={{ borderColor: comparison.benchmarkColor }}
              />
              <span className="text-slate-300">{comparison.benchmarkName}</span>
            </div>
          </div>
        </div>

        {/* Live Readout Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 bg-[#070d19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Date</span>
            <span className="text-white font-semibold">{activePoint.date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Portfolio</span>
            <span className="text-[#c5a059] font-bold">
              {chartMode === 'INR'
                ? formatInrCompact(activePoint.portfolioValueInr)
                : `${activePoint.portfolioBase100.toFixed(1)}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">{comparison.benchmarkName}</span>
            <span className="font-bold" style={{ color: comparison.benchmarkColor }}>
              {chartMode === 'INR'
                ? formatInrCompact(activePoint.benchmarkValueInr)
                : `${activePoint.benchmarkBase100.toFixed(1)}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Cumulative Spread</span>
            <span
              className={`font-bold ${
                activePoint.spreadPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {activePoint.spreadPct >= 0 ? '+' : ''}
              {activePoint.spreadPct.toFixed(2)} pts
            </span>
          </div>
        </div>

        {/* Responsive Interactive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full min-w-[540px] h-auto select-none"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="tanashviPortFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c5a059" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#c5a059" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((tick, idx) => {
              const y = yPos(tick);
              return (
                <g key={idx}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                    {chartMode === 'INR' ? formatInrCompact(tick) : tick.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Labels */}
            {xTickIndices.map((idx, k) => {
              const pt = series[idx];
              if (!pt) return null;
              return (
                <text
                  key={k}
                  x={xPos(idx)}
                  y={svgH - 12}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {pt.label}
                </text>
              );
            })}

            {/* Portfolio Gradient Area */}
            <path d={portAreaPath} fill="url(#tanashviPortFill)" />

            {/* Benchmark Dashed Line */}
            <path
              d={benchPath}
              fill="none"
              stroke={comparison.benchmarkColor}
              strokeWidth="2.2"
              strokeDasharray="6 4"
            />

            {/* Portfolio Solid Gold Line */}
            <path d={portPath} fill="none" stroke="#c5a059" strokeWidth="2.8" />

            {/* Crosshair & Highlight Dots */}
            {hoveredIdx !== null && series[hoveredIdx] && (
              <g>
                <line
                  x1={xPos(hoveredIdx)}
                  y1={padT}
                  x2={xPos(hoveredIdx)}
                  y2={padT + plotH}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xPos(hoveredIdx)}
                  cy={yPos(chartMode === 'INR' ? series[hoveredIdx].portfolioValueInr : series[hoveredIdx].portfolioBase100)}
                  r="5.5"
                  fill="#c5a059"
                  stroke="#0a111f"
                  strokeWidth="2"
                />
                <circle
                  cx={xPos(hoveredIdx)}
                  cy={yPos(chartMode === 'INR' ? series[hoveredIdx].benchmarkValueInr : series[hoveredIdx].benchmarkBase100)}
                  r="5"
                  fill={comparison.benchmarkColor}
                  stroke="#0a111f"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Invisible Hover Hit Slices */}
            {series.map((_, idx) => {
              const sliceW = plotW / Math.max(1, series.length - 1);
              return (
                <rect
                  key={idx}
                  x={Math.max(padL, xPos(idx) - sliceW / 2)}
                  y={padT}
                  width={sliceW}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Visual Portfolio Composition Charts: Asset Donut + Market-Cap Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InteractiveDonutChart
          title="Asset Allocation Mix"
          subtitle="Interactive visual breakdown across Equity, Hybrid, Debt & Liquid"
          slices={assetSlices}
          totalValueInr={currentValue}
        />
        <InteractiveDonutChart
          title="Market-Cap Exposure"
          subtitle="Underlying Large, Mid & Small Cap equity concentration"
          slices={mcapSlices}
          totalValueInr={currentValue}
        />
      </div>

      {/* Portfolio Diversification & Mutual Fund Overlap Tracker */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-serif text-white font-semibold flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#c5a059]" />
              Portfolio Diversification & Fund Overlap Tracker
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Measures true uniqueness vs. underlying stock duplication across your mutual fund combination.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                diversification.diversificationScore >= 80
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                  : diversification.diversificationScore >= 65
                  ? 'bg-[#c5a059]/15 text-[#c5a059] border-[#c5a059]/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
              }`}
            >
              Score: {diversification.diversificationScore}/100 · {diversification.rating}
            </span>
          </div>
        </div>

        {/* Gauge + Uniqueness vs Overlap Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          {/* Circular Diversification Score Ring */}
          <div className="bg-[#070d19] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={diversification.diversificationScore >= 75 ? '#34d399' : '#c5a059'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(diversification.diversificationScore / 100) * 238.76} 238.76`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-mono font-bold text-white">{diversification.diversificationScore}</span>
                <span className="text-[9px] text-slate-400 uppercase">/ 100</span>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-white">{diversification.rating}</div>
              <div className="text-[11px] text-slate-400">
                ~<strong className="text-slate-200">{diversification.estimatedUniqueStocks}</strong> unique underlying securities across <strong className="text-slate-200">{diversification.assetClassesCount}</strong> asset classes
              </div>
            </div>
          </div>

          {/* Unique vs. Overlapping Stacked Visual Bar */}
          <div className="lg:col-span-2 bg-[#070d19] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Unique / Non-Overlapping Exposure: <strong className="font-mono">{diversification.uniqueExposurePct}%</strong>
              </span>
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Overlapping Exposure: <strong className="font-mono">{diversification.weightedOverlapPct}%</strong>
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#c5a059] transition-all duration-500"
                style={{ width: `${diversification.uniqueExposurePct}%` }}
                title={`Unique Exposure: ${diversification.uniqueExposurePct}%`}
              />
              <div
                className="h-full bg-amber-500/90 transition-all duration-500"
                style={{ width: `${diversification.weightedOverlapPct}%` }}
                title={`Overlapping Holdings: ${diversification.weightedOverlapPct}%`}
              />
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">{diversification.verdict}</p>
          </div>
        </div>

        {/* Pairwise Scheme Overlap Matrix */}
        {diversification.pairs.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Fund-to-Fund Overlap Breakdown ({diversification.pairs.length} Combinations Checked)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diversification.pairs.slice(0, 6).map(pair => (
                <div
                  key={`${pair.fundA}-${pair.fundB}`}
                  className="bg-[#070d19] border border-slate-800/80 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div className="font-medium text-slate-200 leading-snug">
                      {pair.fundA} <span className="text-[#c5a059] font-bold">↔</span> {pair.fundB}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        pair.severity === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : pair.severity === 'MODERATE'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {pair.overlapPct}% Overlap
                    </span>
                  </div>

                  {/* Pair Overlap vs Unique Bar */}
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className={
                        pair.severity === 'HIGH'
                          ? 'bg-rose-500 h-full'
                          : pair.severity === 'MODERATE'
                          ? 'bg-amber-400 h-full'
                          : 'bg-emerald-400 h-full'
                      }
                      style={{ width: `${Math.max(pair.overlapPct > 0 ? 4 : 0, pair.overlapPct)}%` }}
                    />
                    <div className="bg-slate-800 h-full flex-1" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate pr-2">
                      {pair.sharedStocks.length > 0
                        ? `Common: ${pair.sharedStocks.join(', ')}`
                        : 'Zero stock overlap (Cross-asset diversification)'}
                    </span>
                    <span className="font-mono text-emerald-400 shrink-0">{pair.uniquePct}% Unique</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scheme-wise Invested vs. Current Value Bar Chart + Sector Exposure Chart */}
      <div className={`grid grid-cols-1 ${sectorBreakdown && sectorBreakdown.length > 0 ? 'lg:grid-cols-2' : ''} gap-5`}>
        {/* Scheme Gain Bars */}
        <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-serif text-white font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#c5a059]" />
                {isBookLevel ? 'Top Holdings / AMC Cost vs. Valuation' : 'Scheme-Wise Invested vs. Current Value'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Visual wealth creation across each scheme</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" /> Invested
              </span>
              <span className="flex items-center gap-1 text-[#c5a059]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#c5a059] inline-block" /> Current
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {holdings.map(h => {
              const invPct = Math.min(100, (h.invested / maxHoldingVal) * 100);
              const curPct = Math.min(100, (h.currentValue / maxHoldingVal) * 100);
              const gainPct = h.invested > 0 ? ((h.currentValue - h.invested) / h.invested) * 100 : 0;
              return (
                <div key={h.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-200 font-medium truncate" title={h.name}>
                      {h.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="text-emerald-400 font-semibold">
                        +{gainPct.toFixed(1)}%
                      </span>
                      <span className="text-slate-400">({h.xirr.toFixed(1)}% XIRR)</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-600 rounded-full" style={{ width: `${invPct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 w-16 text-right">
                        {formatInrCompact(h.invested)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#c5a059] to-emerald-400 rounded-full"
                          style={{ width: `${curPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white font-semibold w-16 text-right">
                        {formatInrCompact(h.currentValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector Exposure Visual Chart */}
        {sectorBreakdown && sectorBreakdown.length > 0 && (
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5">
            <div className="mb-4">
              <h4 className="text-sm font-serif text-white font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
                Industry Sector Exposure
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Look-through concentration across NSE/SEBI sectors</p>
            </div>
            <div className="space-y-3">
              {sectorBreakdown.map(sec => (
                <div key={sec.sector} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200">{sec.sector}</span>
                    <span className="font-mono text-slate-300 font-semibold">{sec.weight.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sec.color || 'bg-[#c5a059]'}`}
                      style={{ width: `${Math.min(100, sec.weight * 2.4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEBI Compliance & TRI Methodology Notice */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">SEBI Total Return Index (TRI) Benchmarking Standard:</strong> All benchmark comparisons reflect dividend-reinvested TRI trajectories per SEBI Circular <code className="text-slate-300">SEBI/HO/IMD/DF3/CIR/P/2018/04</code>. Benchmark TRI data can be refreshed anytime via one-click Live AMFI Direct Index Sync, official NSE/BSE CSV upload, or automated weekday EOD server cron (<code className="text-slate-300">POST /api/v1/benchmarks/sync</code>).
        </div>
      </div>
    </div>
  );
};
