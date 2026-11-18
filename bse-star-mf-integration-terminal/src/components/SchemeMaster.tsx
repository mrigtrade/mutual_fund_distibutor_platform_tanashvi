import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Scheme } from '../types/bse';
import {
  LiveBseStatus,
  LiveBseSchemeRecord,
  LiveBseNavRecord,
  fetchLiveBseSchemes,
  fetchLiveBseNavs,
  liveBseSchemeToAppScheme
} from '../services/liveBseUatClient';
import {
  Search,
  Clock,
  Radio,
  Database,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  IndianRupee
} from 'lucide-react';

interface SchemeMasterProps {
  schemes: Scheme[];
  liveBseStatus?: LiveBseStatus | null;
  onSelectSchemeForOrder: (scheme: Scheme, type: 'LUMPSUM' | 'SIP') => void;
}

type CatalogMode = 'LIVE_SCHEMES' | 'LIVE_NAV' | 'SANDBOX';

const QUICK_AMC_CHIPS = [
  'PARAG PARIKH',
  'HDFC',
  'SBI',
  'NIPPON',
  'KOTAK',
  'ICICI PRUDENTIAL',
  'AXIS',
  'QUANT'
];

const VERIFIED_UAT_NAV_CODES = [
  { code: 'KO03G-GR', label: 'Kotak Infra (KO03G-GR)' },
  { code: 'IC3501-GR', label: 'ICICI Auto Index (IC3501-GR)' },
  { code: 'SB114D-DP', label: 'SBI Arbitrage (SB114D-DP)' },
  { code: 'BXBA075-GR', label: 'BOI Hybrid (BXBA075-GR)' }
];

export const SchemeMaster: React.FC<SchemeMasterProps> = ({
  schemes,
  liveBseStatus,
  onSelectSchemeForOrder
}) => {
  const [mode, setMode] = useState<CatalogMode>('LIVE_SCHEMES');

  // --- Sandbox Catalog state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // --- Live BSE UAT Schemes state (28,128) ---
  const [liveSearch, setLiveSearch] = useState('PARAG PARIKH');
  const [livePlan, setLivePlan] = useState('');
  const [liveOption, setLiveOption] = useState('');
  const [liveSchemes, setLiveSchemes] = useState<LiveBseSchemeRecord[]>([]);
  const [liveTotalCount, setLiveTotalCount] = useState<number>(0);
  const [liveLatencyMs, setLiveLatencyMs] = useState<number>(0);
  const [isLoadingLiveSchemes, setIsLoadingLiveSchemes] = useState<boolean>(false);
  const [liveSchemesError, setLiveSchemesError] = useState<string | null>(null);
  const [inlineNavMap, setInlineNavMap] = useState<
    Record<string, { loading: boolean; nav?: number; navDate?: string; notFound?: boolean }>
  >({});

  // --- Live BSE UAT NAV Master state (15,692) ---
  const [navSchemeCode, setNavSchemeCode] = useState('');
  const [navDateFilter, setNavDateFilter] = useState('');
  const [navClientFilter, setNavClientFilter] = useState('');
  const [liveNavs, setLiveNavs] = useState<LiveBseNavRecord[]>([]);
  const [liveNavTotalCount, setLiveNavTotalCount] = useState<number>(0);
  const [liveNavLatencyMs, setLiveNavLatencyMs] = useState<number>(0);
  const [isLoadingLiveNavs, setIsLoadingLiveNavs] = useState<boolean>(false);
  const [liveNavError, setLiveNavError] = useState<string | null>(null);

  const loadLiveSchemes = useCallback(
    async (opts?: { search?: string; plan?: string; option?: string }) => {
      const q = opts?.search !== undefined ? opts.search : liveSearch;
      const p = opts?.plan !== undefined ? opts.plan : livePlan;
      const o = opts?.option !== undefined ? opts.option : liveOption;

      setIsLoadingLiveSchemes(true);
      setLiveSchemesError(null);
      const res = await fetchLiveBseSchemes({
        search: q.trim(),
        plan: p,
        option: o,
        length: 20
      });
      setIsLoadingLiveSchemes(false);
      setLiveLatencyMs(res.latencyMs);

      if (res.live) {
        setLiveSchemes(res.schemes);
        setLiveTotalCount(res.totalCount);
      } else {
        setLiveSchemesError(
          res.error || 'Live BSE UAT Scheme Master is currently unreachable.'
        );
      }
    },
    [liveSearch, livePlan, liveOption]
  );

  const loadLiveNavs = useCallback(
    async (opts?: { bseSchemeCode?: string; navDate?: string }) => {
      const code = opts?.bseSchemeCode !== undefined ? opts.bseSchemeCode : navSchemeCode;
      const dt = opts?.navDate !== undefined ? opts.navDate : navDateFilter;

      setIsLoadingLiveNavs(true);
      setLiveNavError(null);
      const res = await fetchLiveBseNavs({
        bseSchemeCode: code.trim() || undefined,
        navDate: dt.trim() || undefined,
        length: 40
      });
      setIsLoadingLiveNavs(false);
      setLiveNavLatencyMs(res.latencyMs);

      if (res.live) {
        setLiveNavs(res.records);
        setLiveNavTotalCount(res.totalCount);
      } else {
        setLiveNavError(res.error || 'Live BSE UAT NAV Master is currently unreachable.');
      }
    },
    [navSchemeCode, navDateFilter]
  );

  // Initial live loads when switching tabs
  useEffect(() => {
    if (mode === 'LIVE_SCHEMES' && liveSchemes.length === 0 && !liveSchemesError) {
      loadLiveSchemes({ search: liveSearch, plan: livePlan, option: liveOption });
    }
    if (mode === 'LIVE_NAV' && liveNavs.length === 0 && !liveNavError) {
      loadLiveNavs({ bseSchemeCode: navSchemeCode, navDate: navDateFilter });
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInlineCheckNav = async (bseCode: string) => {
    setInlineNavMap((prev) => ({ ...prev, [bseCode]: { loading: true } }));
    const res = await fetchLiveBseNavs({ bseSchemeCode: bseCode, length: 3 });
    if (res.live && res.records.length > 0) {
      setInlineNavMap((prev) => ({
        ...prev,
        [bseCode]: {
          loading: false,
          nav: res.records[0].nav,
          navDate: res.records[0].navDate
        }
      }));
    } else {
      setInlineNavMap((prev) => ({
        ...prev,
        [bseCode]: { loading: false, notFound: true }
      }));
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Schemes' },
    { id: 'Equity: Large Cap', label: 'Large Cap' },
    { id: 'Equity: Flexi Cap', label: 'Flexi Cap' },
    { id: 'Equity: Mid Cap', label: 'Mid Cap' },
    { id: 'Equity: Small Cap', label: 'Small Cap' },
    { id: 'Debt: Liquid', label: 'Liquid' },
    { id: 'Index / ETF', label: 'Index Funds' }
  ];

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const matchesSearch =
        s.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.schemeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.isin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.amc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [schemes, searchQuery, selectedCategory]);

  const filteredLiveNavs = useMemo(() => {
    const q = navClientFilter.trim().toLowerCase();
    if (!q) return liveNavs;
    return liveNavs.filter(
      (r) =>
        r.schemeName.toLowerCase().includes(q) ||
        r.bseSchemeCode.toLowerCase().includes(q) ||
        r.isin.toLowerCase().includes(q)
    );
  }, [liveNavs, navClientFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                BSE StAR MF v2.0 Scheme &amp; NAV Master
              </h1>
              {liveBseStatus?.authenticated ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE BSE UAT · Member {liveBseStatus.memberId}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Sandbox / Live Bridge Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Query BSE StAR MF&apos;s live 28,128-scheme catalog &amp; 15,692-NAV feed directly via Tanashvi&apos;s whitelisted static IP (130.210.57.235)
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cutoff: <strong className="text-white">15:00 IST</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700/60 font-mono">
              <span>Settlement: <strong className="text-emerald-400">T+1 / T+2</strong></span>
            </div>
          </div>
        </div>

        {/* 3-Tab Data Source Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setMode('LIVE_SCHEMES')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              mode === 'LIVE_SCHEMES'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/60 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live BSE UAT Schemes</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/30">
              28,128
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('LIVE_NAV')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              mode === 'LIVE_NAV'
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/60 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Live BSE NAV Master</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-950/90 text-amber-300 border border-amber-500/30">
              15,692
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('SANDBOX')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              mode === 'SANDBOX'
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/60 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Curated Sandbox Catalog</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
              {schemes.length}
            </span>
          </button>
        </div>

        {/* === CONTROLS FOR MODE 1: LIVE BSE UAT SCHEMES === */}
        {mode === 'LIVE_SCHEMES' && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadLiveSchemes();
              }}
              className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={liveSearch}
                  onChange={(e) => setLiveSearch(e.target.value)}
                  placeholder="Search all 28,128 live BSE schemes (e.g. PARAG PARIKH, HDFC FLEXI, SBI SMALL CAP, NIFTY 50)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={livePlan}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLivePlan(val);
                    loadLiveSchemes({ plan: val });
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 cursor-pointer focus:outline-hidden focus:border-emerald-400"
                >
                  <option value="">All Plans</option>
                  <option value="Regular">Regular Plan (MFD)</option>
                  <option value="Direct">Direct Plan</option>
                </select>

                <select
                  value={liveOption}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLiveOption(val);
                    loadLiveSchemes({ option: val });
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 cursor-pointer focus:outline-hidden focus:border-emerald-400"
                >
                  <option value="">All Options</option>
                  <option value="Growth">Growth</option>
                  <option value="IDCW Payout">IDCW Payout</option>
                  <option value="IDCW Reinvestment">IDCW Reinvestment</option>
                </select>

                <button
                  type="submit"
                  disabled={isLoadingLiveSchemes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveSchemes ? 'animate-spin' : ''}`} />
                  <span>{isLoadingLiveSchemes ? 'Querying BSE...' : 'Search BSE Live'}</span>
                </button>
              </div>
            </form>

            {/* Quick-pick AMC chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 mr-1">Quick Search:</span>
              {QUICK_AMC_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setLiveSearch(chip);
                    loadLiveSchemes({ search: chip });
                  }}
                  className={`px-2.5 py-1 rounded-md font-mono transition-colors cursor-pointer border ${
                    liveSearch.toUpperCase() === chip
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {chip}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLiveSearch('');
                  setLivePlan('');
                  setLiveOption('');
                  loadLiveSchemes({ search: '', plan: '', option: '' });
                }}
                className="px-2.5 py-1 rounded-md font-mono bg-slate-950 text-amber-300 border border-slate-800 hover:border-amber-500/50 cursor-pointer"
              >
                ALL (28,128)
              </button>
            </div>
          </div>
        )}

        {/* === CONTROLS FOR MODE 2: LIVE BSE NAV MASTER === */}
        {mode === 'LIVE_NAV' && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadLiveNavs();
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-2.5"
            >
              <input
                type="text"
                value={navSchemeCode}
                onChange={(e) => setNavSchemeCode(e.target.value)}
                placeholder="Exact BSE Scheme Code (e.g. KO03G-GR)"
                className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
              <input
                type="text"
                value={navDateFilter}
                onChange={(e) => setNavDateFilter(e.target.value)}
                placeholder="NAV Date (e.g. 08-Oct-2026)"
                className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
              <input
                type="text"
                value={navClientFilter}
                onChange={(e) => setNavClientFilter(e.target.value)}
                placeholder="Filter loaded rows by name / ISIN..."
                className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isLoadingLiveNavs}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveNavs ? 'animate-spin' : ''}`} />
                <span>{isLoadingLiveNavs ? 'Fetching NAVs...' : 'Fetch Live BSE NAVs'}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 mr-1">Verified UAT Sample Codes:</span>
              {VERIFIED_UAT_NAV_CODES.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setNavSchemeCode(sample.code);
                    setNavDateFilter('');
                    loadLiveNavs({ bseSchemeCode: sample.code, navDate: '' });
                  }}
                  className="px-2.5 py-1 rounded-md font-mono bg-slate-950 text-amber-300 border border-slate-800 hover:border-amber-400/60 cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setNavSchemeCode('');
                  setNavDateFilter('');
                  setNavClientFilter('');
                  loadLiveNavs({ bseSchemeCode: '', navDate: '' });
                }}
                className="px-2.5 py-1 rounded-md font-mono bg-slate-950 text-slate-300 border border-slate-800 hover:text-white cursor-pointer"
              >
                Browse Latest 40
              </button>
            </div>
          </div>
        )}

        {/* === CONTROLS FOR MODE 3: SANDBOX CATALOG === */}
        {mode === 'SANDBOX' && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curated sandbox schemes by name, code, ISIN, or AMC..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="flex items-center overflow-x-auto gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: LIVE BSE UAT 28,128 SCHEMES RESULTS                  */}
      {/* ============================================================ */}
      {mode === 'LIVE_SCHEMES' && (
        <div className="space-y-3.5">
          {/* Live Result Summary Bar */}
          {!liveSchemesError && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-emerald-950/25 border border-emerald-500/25 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Live response from <strong className="font-mono text-white">POST /api/master_scheme_list</strong>:{' '}
                  <strong className="font-mono text-white">{liveTotalCount.toLocaleString('en-IN')}</strong> matching schemes on BSE StAR MF v2.0 UAT
                  {liveSchemes.length > 0 && ` (showing top ${liveSchemes.length})`}
                </span>
              </div>
              {liveLatencyMs > 0 && (
                <span className="font-mono text-[11px] text-slate-400">
                  Roundtrip: <strong className="text-emerald-300">{liveLatencyMs}ms</strong>
                </span>
              )}
            </div>
          )}

          {/* Error + Graceful Fallback Banner */}
          {liveSchemesError && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Live BSE UAT Bridge Unavailable</div>
                  <div className="text-amber-200/80 mt-0.5">
                    {liveSchemesError}. You can retry or switch to the Curated Sandbox Catalog for offline demoing.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => loadLiveSchemes()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium cursor-pointer"
                >
                  Retry Live
                </button>
                <button
                  type="button"
                  onClick={() => setMode('SANDBOX')}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md cursor-pointer"
                >
                  Open Sandbox Catalog
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingLiveSchemes && (
            <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
              <div>Querying live BSE StAR MF v2.0 UAT Scheme Master (28,128 schemes)...</div>
            </div>
          )}

          {/* Live Scheme Cards */}
          {!isLoadingLiveSchemes &&
            liveSchemes.map((rec) => {
              const inlineNav = inlineNavMap[rec.bseCode];
              return (
                <div
                  key={`${rec.bseCode}-${rec.isin}`}
                  className="bg-slate-900 border border-slate-800/90 hover:border-emerald-500/40 rounded-xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-semibold">
                          BSE: {rec.bseCode}
                        </span>
                        <span className="text-slate-400">ISIN: <strong className="text-slate-200">{rec.isin}</strong></span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-amber-300">{rec.amcName}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-300">RTA: {rec.rtaName}</span>
                      </div>

                      <h3 className="text-base font-semibold text-white tracking-tight">
                        {rec.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] pt-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                          {rec.plan} Plan
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                          {rec.option}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300">
                          {rec.category}{rec.subCategory && rec.subCategory !== rec.category ? ` · ${rec.subCategory}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 font-mono">
                          Modes: {rec.modesAllowed.join(' / ')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/70 text-emerald-300 font-mono">
                          {rec.offerStatus} · {rec.settlementDays}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span>Min Lumpsum: <strong className="text-slate-200 font-mono">₹{rec.minLumpsum.toLocaleString('en-IN')}</strong></span>
                        <span>Min SIP: <strong className="text-slate-200 font-mono">₹{rec.minSip.toLocaleString('en-IN')}</strong></span>
                        <span>SIP Freq: <strong className="text-slate-300">{rec.sipFrequencies.slice(0, 3).join(', ')}</strong></span>
                        <span>Cutoff: <strong className="text-slate-300 font-mono">{rec.cutoffTime}</strong></span>
                      </div>
                    </div>

                    {/* Inline Live NAV Box */}
                    <div className="flex items-center gap-4 border-y lg:border-y-0 lg:border-x border-slate-800/80 py-3 lg:py-0 lg:px-5 shrink-0">
                      <div className="min-w-[125px]">
                        <div className="text-[11px] text-slate-400">BSE UAT NAV</div>
                        {inlineNav?.loading ? (
                          <div className="text-xs text-amber-300 font-mono mt-1 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
                          </div>
                        ) : inlineNav?.nav !== undefined ? (
                          <>
                            <div className="text-lg font-bold font-mono text-emerald-300 tabular-nums">
                              ₹{inlineNav.nav.toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{inlineNav.navDate}</div>
                          </>
                        ) : inlineNav?.notFound ? (
                          <div className="text-[11px] text-slate-500 mt-1">
                            No UAT NAV row for this code
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleInlineCheckNav(rec.bseCode)}
                            className="mt-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded cursor-pointer flex items-center gap-1"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Check Live NAV</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order CTAs */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectSchemeForOrder(
                            liveBseSchemeToAppScheme(rec, inlineNav?.nav, inlineNav?.navDate),
                            'LUMPSUM'
                          )
                        }
                        className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Buy Lumpsum
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectSchemeForOrder(
                            liveBseSchemeToAppScheme(rec, inlineNav?.nav, inlineNav?.navDate),
                            'SIP'
                          )
                        }
                        className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Start XSIP
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {!isLoadingLiveSchemes && !liveSchemesError && liveSchemes.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              <p className="text-sm font-medium">No live BSE UAT schemes matched &ldquo;{liveSearch}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try a broader keyword (e.g. HDFC, SBI, PARAG) or clear Plan/Option filters</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: LIVE BSE UAT 15,692 NAV MASTER TABLE                 */}
      {/* ============================================================ */}
      {mode === 'LIVE_NAV' && (
        <div className="space-y-3.5">
          {!liveNavError && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-amber-950/20 border border-amber-500/25 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-amber-200">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Live response from <strong className="font-mono text-white">POST /api/nav_master_list</strong>:{' '}
                  <strong className="font-mono text-white">{liveNavTotalCount.toLocaleString('en-IN')}</strong> matching NAV records on BSE StAR MF v2.0 UAT
                  {filteredLiveNavs.length > 0 && ` (displaying ${filteredLiveNavs.length})`}
                </span>
              </div>
              {liveNavLatencyMs > 0 && (
                <span className="font-mono text-[11px] text-slate-400">
                  Roundtrip: <strong className="text-amber-300">{liveNavLatencyMs}ms</strong>
                </span>
              )}
            </div>
          )}

          {liveNavError && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{liveNavError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadLiveNavs()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoadingLiveNavs ? (
            <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin mx-auto" />
              <div>Fetching live BSE StAR MF v2.0 NAV Master (15,692 records)...</div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">BSE Scheme Code</th>
                      <th className="py-3 px-4">ISIN</th>
                      <th className="py-3 px-4">Official BSE Scheme Name</th>
                      <th className="py-3 px-4 text-right">Live BSE NAV</th>
                      <th className="py-3 px-4 text-right">NAV Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLiveNavs.map((row, idx) => (
                      <tr key={`${row.bseSchemeCode}-${row.navDate}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {row.bseSchemeCode}
                          {row.rtaSchemeCode && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              RTA: {row.rtaSchemeCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">{row.isin}</td>
                        <td className="py-3 px-4 text-white font-medium">{row.schemeName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-300 text-right tabular-nums whitespace-nowrap">
                          ₹{row.nav.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-right whitespace-nowrap">
                          {row.navDate}
                        </td>
                      </tr>
                    ))}
                    {filteredLiveNavs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          No NAV records matched. Click one of the verified UAT sample codes above or &ldquo;Browse Latest 40&rdquo;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 3: CURATED SANDBOX CATALOG (100% FALLBACK SAFE)         */}
      {/* ============================================================ */}
      {mode === 'SANDBOX' && (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.schemeCode}
              className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="text-amber-400 font-semibold">BSE Code: {scheme.schemeCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>ISIN: {scheme.isin}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">{scheme.amc}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scheme.category}</span>
                  </div>

                  <h3 className="text-base font-semibold text-white tracking-tight truncate">
                    {scheme.schemeName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Min Purchase: <strong className="text-slate-200 font-mono">₹{scheme.minLumpsum.toLocaleString('en-IN')}</strong></span>
                    <span>Min SIP: <strong className="text-slate-200 font-mono">₹{scheme.minSip.toLocaleString('en-IN')}</strong></span>
                    <span>Expense: <strong className="text-slate-200 font-mono">{scheme.expenseRatio}%</strong></span>
                    <span>Risk: <strong className="text-slate-300">{scheme.riskLevel}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-8 border-y lg:border-y-0 lg:border-x border-slate-800/80 py-3 lg:py-0 lg:px-6">
                  <div>
                    <div className="text-xs text-slate-400">Current NAV</div>
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      ₹{scheme.nav.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{scheme.navDate}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">3Y CAGR</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums flex items-center justify-end">
                      +{scheme.threeYearReturn}%
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">1Y: +{scheme.oneYearReturn}%</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectSchemeForOrder(scheme, 'LUMPSUM')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    Buy Lumpsum
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectSchemeForOrder(scheme, 'SIP')}
                    className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Start XSIP
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSchemes.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              <p className="text-sm font-medium">No mutual fund schemes match your search criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by BSE scheme code, fund house name, or category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
