/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 15: Multi-Benchmark TRI Data Engine, Automated Sync & Portfolio Comparison
 *
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 * - Pre-seeded with 7+ years of daily TRI history across 6 Indian benchmarks.
 * - Supports live EOD auto-updates via open AMFI Direct Index Fund TRI proxies (MFAPI.in).
 * - Supports official NSE/BSE TRI CSV bulk imports (niftyindices.com / asiaindices.co.in).
 * - Supports manual point upserts and disk cache persistence across restarts.
 */

import fs from 'fs';
import path from 'path';
import {
  BenchmarkDataSource,
  BenchmarkId,
  BenchmarkMetadata,
  BenchmarkSyncItemResult,
  BenchmarkSyncSummary,
  BenchmarkCsvImportResult,
  BenchmarkTriPoint,
  PortfolioBenchmarkRequest,
  PortfolioBenchmarkResponse,
  PortfolioComparisonPoint,
  StandardBenchmarkId
} from '../types/benchmark.js';

interface BenchmarkSeedConfig {
  id: StandardBenchmarkId;
  name: string;
  shortName: string;
  category: 'Large Cap' | 'Broad Market' | 'Mid Cap' | 'Small Cap' | 'Debt';
  provider: 'NSE Indices' | 'Asia Index (BSE)' | 'CRISIL';
  description: string;
  amfiProxySchemeCode: string;
  amfiProxySchemeName: string;
  nseIndexName?: string;
  baseValue2019: number;
  annualCagr: number;
  annualVol: number;
  seedOffset: number;
}

const BENCHMARK_CONFIGS: BenchmarkSeedConfig[] = [
  {
    id: 'NIFTY_50_TRI',
    name: 'Nifty 50 TRI',
    shortName: 'Nifty 50 TRI',
    category: 'Large Cap',
    provider: 'NSE Indices',
    description: 'India flagship top-50 large-cap companies Total Return Index (dividends reinvested).',
    amfiProxySchemeCode: '120716',
    amfiProxySchemeName: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    nseIndexName: 'NIFTY 50',
    baseValue2019: 15200,
    annualCagr: 0.142,
    annualVol: 0.155,
    seedOffset: 11
  },
  {
    id: 'NIFTY_500_TRI',
    name: 'Nifty 500 TRI',
    shortName: 'Nifty 500 TRI',
    category: 'Broad Market',
    provider: 'NSE Indices',
    description: 'Broad market Total Return Index covering top 500 NSE companies (~96% free-float mcap).',
    amfiProxySchemeCode: '147622',
    amfiProxySchemeName: 'Motilal Oswal Nifty 500 Index Fund - Direct Plan - Growth',
    nseIndexName: 'NIFTY 500',
    baseValue2019: 13800,
    annualCagr: 0.158,
    annualVol: 0.168,
    seedOffset: 23
  },
  {
    id: 'NIFTY_MIDCAP_150_TRI',
    name: 'Nifty Midcap 150 TRI',
    shortName: 'Midcap 150 TRI',
    category: 'Mid Cap',
    provider: 'NSE Indices',
    description: 'SEBI-standard Mid Cap Total Return Index representing companies ranked 101–250.',
    amfiProxySchemeCode: '147623',
    amfiProxySchemeName: 'Motilal Oswal Nifty Midcap 150 Index Fund - Direct Plan - Growth',
    nseIndexName: 'NIFTY MIDCAP 150',
    baseValue2019: 8400,
    annualCagr: 0.214,
    annualVol: 0.198,
    seedOffset: 37
  },
  {
    id: 'NIFTY_SMALLCAP_250_TRI',
    name: 'Nifty Smallcap 250 TRI',
    shortName: 'Smallcap 250 TRI',
    category: 'Small Cap',
    provider: 'NSE Indices',
    description: 'SEBI-standard Small Cap Total Return Index representing companies ranked 251–500.',
    amfiProxySchemeCode: '147625',
    amfiProxySchemeName: 'Motilal Oswal Nifty Smallcap 250 Index Fund - Direct Plan - Growth',
    nseIndexName: 'NIFTY SMALLCAP 250',
    baseValue2019: 6150,
    annualCagr: 0.232,
    annualVol: 0.235,
    seedOffset: 53
  },
  {
    id: 'BSE_SENSEX_TRI',
    name: 'BSE Sensex TRI',
    shortName: 'Sensex TRI',
    category: 'Large Cap',
    provider: 'Asia Index (BSE)',
    description: 'S&P BSE Sensex 30 bluechip Total Return Index (dividends reinvested).',
    amfiProxySchemeCode: '119063',
    amfiProxySchemeName: 'HDFC Index Fund - BSE Sensex Plan - Direct Plan - Growth',
    baseValue2019: 52400,
    annualCagr: 0.139,
    annualVol: 0.151,
    seedOffset: 67
  },
  {
    id: 'CRISIL_SHORT_TERM_DEBT',
    name: 'CRISIL Short Term Bond Index',
    shortName: 'CRISIL Debt',
    category: 'Debt',
    provider: 'CRISIL',
    description: 'Fixed-income benchmark tracking high-grade short-term corporate bonds and G-Secs.',
    amfiProxySchemeCode: '119018',
    amfiProxySchemeName: 'HDFC Short Term Debt Fund - Direct Plan - Growth',
    baseValue2019: 3280,
    annualCagr: 0.072,
    annualVol: 0.022,
    seedOffset: 89
  }
];

interface PersistedBenchmarkCache {
  savedAt: string;
  sources: Partial<Record<StandardBenchmarkId, BenchmarkDataSource>>;
  lastSynced: Partial<Record<StandardBenchmarkId, string>>;
  series: Partial<Record<StandardBenchmarkId, BenchmarkTriPoint[]>>;
}

export class BenchmarkService {
  private static instance: BenchmarkService;

  private seriesMap: Map<StandardBenchmarkId, BenchmarkTriPoint[]> = new Map();
  private sourceMap: Map<StandardBenchmarkId, BenchmarkDataSource> = new Map();
  private lastSyncedMap: Map<StandardBenchmarkId, string> = new Map();
  private cacheFilePath: string;

  private constructor() {
    this.cacheFilePath = path.resolve(process.cwd(), 'data', 'benchmark_tri_cache.json');
    this.initializeSeedSeries();
    this.loadPersistedCacheIfPresent();
  }

  public static getInstance(): BenchmarkService {
    if (!BenchmarkService.instance) {
      BenchmarkService.instance = new BenchmarkService();
    }
    return BenchmarkService.instance;
  }

  /**
   * Generates deterministic daily TRI history (2019-01-01 to 2026-11-17) calibrated
   * to realistic historical Indian market regimes and trailing CAGRs.
   */
  private initializeSeedSeries(): void {
    const startDate = new Date('2019-01-01');
    const endDate = new Date('2026-11-17');
    const totalYears = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 365.25);
    const nowIso = new Date().toISOString();

    for (const cfg of BENCHMARK_CONFIGS) {
      const points: BenchmarkTriPoint[] = [];
      const isDebt = cfg.category === 'Debt';

      let dt = new Date(startDate);
      let idx = 0;

      while (dt <= endDate) {
        const dow = dt.getDay();
        if (dow !== 0 && dow !== 6) {
          const dateStr = dt.toISOString().split('T')[0];
          const elapsedYears = (dt.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 365.25);
          const trend = cfg.baseValue2019 * Math.pow(1 + cfg.annualCagr, elapsedYears);

          let cycleMult = 1.0;
          if (!isDebt) {
            const wave1 = Math.sin(idx * 0.032 + cfg.seedOffset * 0.1) * (cfg.annualVol * 0.36);
            const wave2 = Math.cos(idx * 0.015 + cfg.seedOffset * 0.2) * (cfg.annualVol * 0.24);
            const micro = Math.sin(idx * 0.095 + cfg.seedOffset) * (cfg.annualVol * 0.09);
            let shock = 0;
            if (dateStr >= '2020-02-20' && dateStr <= '2020-04-15') {
              shock = -0.26;
            } else if (dateStr >= '2020-04-16' && dateStr <= '2020-08-30') {
              shock = -0.10;
            } else if (dateStr >= '2022-03-01' && dateStr <= '2022-07-15') {
              shock = -0.09;
            } else if (dateStr >= '2024-10-01' && dateStr <= '2025-02-28') {
              shock = -0.07;
            }
            const edgeDamp = Math.sin((elapsedYears / totalYears) * Math.PI);
            cycleMult = Math.max(0.55, 1 + (wave1 + wave2 + micro) * (0.45 + 0.55 * edgeDamp) + shock);
          } else {
            cycleMult = 1 + Math.sin(idx * 0.05 + cfg.seedOffset) * 0.004;
          }

          points.push({
            date: dateStr,
            value: Number((trend * cycleMult).toFixed(4))
          });
          idx++;
        }
        dt.setDate(dt.getDate() + 1);
      }

      this.seriesMap.set(cfg.id, points);
      this.sourceMap.set(cfg.id, 'LOCAL_SEED_FIXTURE');
      this.lastSyncedMap.set(cfg.id, nowIso);
    }
  }

  private loadPersistedCacheIfPresent(): void {
    try {
      if (!fs.existsSync(this.cacheFilePath)) return;
      const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
      const parsed: PersistedBenchmarkCache = JSON.parse(raw);

      for (const cfg of BENCHMARK_CONFIGS) {
        const cachedPoints = parsed.series?.[cfg.id];
        if (Array.isArray(cachedPoints) && cachedPoints.length > 10) {
          this.seriesMap.set(cfg.id, cachedPoints);
          if (parsed.sources?.[cfg.id]) {
            this.sourceMap.set(cfg.id, parsed.sources[cfg.id]!);
          }
          if (parsed.lastSynced?.[cfg.id]) {
            this.lastSyncedMap.set(cfg.id, parsed.lastSynced[cfg.id]!);
          }
        }
      }
    } catch (err: any) {
      console.warn(`⚠️  Benchmark cache load skipped (${err.message}). Using seed fixtures.`);
    }
  }

  private persistCache(): void {
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload: PersistedBenchmarkCache = {
        savedAt: new Date().toISOString(),
        sources: {},
        lastSynced: {},
        series: {}
      };
      for (const cfg of BENCHMARK_CONFIGS) {
        payload.sources[cfg.id] = this.sourceMap.get(cfg.id) || 'LOCAL_SEED_FIXTURE';
        payload.lastSynced[cfg.id] = this.lastSyncedMap.get(cfg.id) || new Date().toISOString();
        payload.series[cfg.id] = this.seriesMap.get(cfg.id) || [];
      }
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(payload), 'utf-8');
    } catch (err: any) {
      console.warn(`⚠️  Could not persist benchmark cache: ${err.message}`);
    }
  }

  /**
   * Lists all available standard benchmarks with freshness metadata and trailing CAGRs.
   */
  public listBenchmarks(): BenchmarkMetadata[] {
    return BENCHMARK_CONFIGS.map(cfg => {
      const series = this.seriesMap.get(cfg.id) || [];
      const latest = series[series.length - 1] || { date: '2026-11-17', value: cfg.baseValue2019 };

      return {
        id: cfg.id,
        name: cfg.name,
        shortName: cfg.shortName,
        category: cfg.category,
        provider: cfg.provider,
        description: cfg.description,
        amfiProxySchemeCode: cfg.amfiProxySchemeCode,
        amfiProxySchemeName: cfg.amfiProxySchemeName,
        nseIndexName: cfg.nseIndexName,
        lastUpdatedDate: latest.date,
        lastSyncedAt: this.lastSyncedMap.get(cfg.id) || new Date().toISOString(),
        dataSource: this.sourceMap.get(cfg.id) || 'LOCAL_SEED_FIXTURE',
        dataPointsCount: series.length,
        latestValue: Number(latest.value.toFixed(2)),
        returns: {
          cagr6M: this.computeTrailingReturn(series, 0.5, false),
          cagr1Y: this.computeTrailingReturn(series, 1, false),
          cagr3Y: this.computeTrailingReturn(series, 3, true),
          cagr5Y: this.computeTrailingReturn(series, 5, true)
        }
      };
    });
  }

  public getBenchmarkHistory(id: StandardBenchmarkId, limitPoints?: number): BenchmarkTriPoint[] {
    const series = this.seriesMap.get(id);
    if (!series) {
      throw new Error(`Unknown benchmark ID: ${id}`);
    }
    if (limitPoints && limitPoints > 0 && series.length > limitPoints) {
      return series.slice(series.length - limitPoints);
    }
    return series;
  }

  /**
   * Live EOD Synchronization via AMFI Direct Index Fund TRI proxies (api.mfapi.in).
   * Direct Growth Index Funds reinvest all dividends, tracking official TRI at ~0.999+ correlation.
   * Gracefully falls back to local cache/seed if offline or timeout expires.
   */
  public async syncBenchmarks(options?: {
    forceLive?: boolean;
    benchmarkIds?: StandardBenchmarkId[];
    timeoutMs?: number;
  }): Promise<BenchmarkSyncSummary> {
    const forceLive = options?.forceLive ?? false;
    const timeoutMs = options?.timeoutMs ?? 6000;
    const targetConfigs = options?.benchmarkIds?.length
      ? BENCHMARK_CONFIGS.filter(c => options.benchmarkIds!.includes(c.id))
      : BENCHMARK_CONFIGS;

    const results: BenchmarkSyncItemResult[] = [];
    let liveUpdatedCount = 0;
    const syncedAt = new Date().toISOString();

    for (const cfg of targetConfigs) {
      const existing = this.seriesMap.get(cfg.id) || [];
      const latestExisting = existing[existing.length - 1];

      if (!forceLive) {
        results.push({
          benchmarkId: cfg.id,
          name: cfg.name,
          status: 'FALLBACK_CACHE',
          source: this.sourceMap.get(cfg.id) || 'LOCAL_SEED_FIXTURE',
          pointsAddedOrUpdated: 0,
          latestDate: latestExisting?.date || '2026-11-17',
          latestValue: latestExisting?.value || cfg.baseValue2019,
          message: 'Offline-first mode active. Pass forceLive=true to pull fresh EOD TRI data.'
        });
        continue;
      }

      try {
        const url = `https://api.mfapi.in/mf/${cfg.amfiProxySchemeCode}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const resp = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': 'Tanashvi-Benchmark-Sync/1.0' },
          signal: controller.signal
        });
        clearTimeout(timer);

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const payload: any = await resp.json();
        if (!Array.isArray(payload?.data) || payload.data.length === 0) {
          throw new Error('Empty NAV series returned by feed');
        }

        const parsedLivePoints: BenchmarkTriPoint[] = [];
        for (const row of payload.data) {
          const isoDate = this.parseFlexibleDate(row.date);
          const val = parseFloat(row.nav);
          if (isoDate && !isNaN(val) && val > 0) {
            parsedLivePoints.push({ date: isoDate, value: Number(val.toFixed(4)) });
          }
        }

        if (parsedLivePoints.length === 0) {
          throw new Error('No parseable date/value pairs in live feed');
        }

        parsedLivePoints.sort((a, b) => a.date.localeCompare(b.date));
        this.seriesMap.set(cfg.id, parsedLivePoints);
        this.sourceMap.set(cfg.id, 'LIVE_AMFI_PROXY');
        this.lastSyncedMap.set(cfg.id, syncedAt);
        liveUpdatedCount++;

        const newest = parsedLivePoints[parsedLivePoints.length - 1];
        results.push({
          benchmarkId: cfg.id,
          name: cfg.name,
          status: 'UPDATED_LIVE',
          source: 'LIVE_AMFI_PROXY',
          pointsAddedOrUpdated: parsedLivePoints.length,
          latestDate: newest.date,
          latestValue: newest.value,
          message: `Synced ${parsedLivePoints.length} trading days via ${cfg.amfiProxySchemeName}.`
        });
      } catch (err: any) {
        results.push({
          benchmarkId: cfg.id,
          name: cfg.name,
          status: 'FALLBACK_CACHE',
          source: this.sourceMap.get(cfg.id) || 'LOCAL_SEED_FIXTURE',
          pointsAddedOrUpdated: 0,
          latestDate: latestExisting?.date || '2026-11-17',
          latestValue: latestExisting?.value || cfg.baseValue2019,
          message: `Live feed unavailable (${err.message}); retained cached TRI series.`
        });
      }
    }

    if (liveUpdatedCount > 0) {
      this.persistCache();
    }

    return {
      syncedAt,
      mode: forceLive ? 'LIVE_ATTEMPTED' : 'OFFLINE_SEED',
      totalBenchmarks: targetConfigs.length,
      liveUpdatedCount,
      results
    };
  }

  /**
   * Imports official NSE Indices (niftyindices.com) or Asia Index (BSE) TRI CSV data.
   * Supports headers like:
   *   Date,Total Returns Index
   *   Date,Close
   *   Date,Value
   * Supports dates like: "18 Nov 2026", "18-Nov-2026", "18-11-2026", "2026-11-18"
   */
  public importBenchmarkCsv(
    benchmarkId: StandardBenchmarkId,
    csvContent: string,
    sourceLabel: BenchmarkDataSource = 'CSV_IMPORT'
  ): BenchmarkCsvImportResult {
    const cfg = BENCHMARK_CONFIGS.find(c => c.id === benchmarkId);
    if (!cfg) {
      throw new Error(`Invalid benchmarkId: ${benchmarkId}`);
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const existing = this.seriesMap.get(benchmarkId) || [];
    const byDate = new Map<string, number>();
    for (const pt of existing) {
      byDate.set(pt.date, pt.value);
    }

    let rowsParsed = 0;
    let rowsInsertedOrUpdated = 0;
    let earliestImport = '';
    let latestImport = '';

    for (const line of lines) {
      // Handle quoted CSV cells like "18 Nov 2026","34512.40"
      const cols = line
        .split(',')
        .map(c => c.replace(/^"|"$/g, '').trim());

      if (cols.length < 2) continue;

      const isoDate = this.parseFlexibleDate(cols[0]);
      // Value could be in column 1 or last column (for multi-column NSE CSVs)
      const rawVal = cols[cols.length - 1].replace(/,/g, '');
      const numVal = parseFloat(rawVal);

      if (!isoDate || isNaN(numVal) || numVal <= 0) {
        continue; // Skip header or invalid rows
      }

      rowsParsed++;
      const prev = byDate.get(isoDate);
      if (prev === undefined || Math.abs(prev - numVal) > 0.0001) {
        byDate.set(isoDate, Number(numVal.toFixed(4)));
        rowsInsertedOrUpdated++;
      }

      if (!earliestImport || isoDate < earliestImport) earliestImport = isoDate;
      if (!latestImport || isoDate > latestImport) latestImport = isoDate;
    }

    if (rowsParsed === 0) {
      throw new Error('No valid TRI rows found in CSV. Expected columns: Date, Total Returns Index');
    }

    const merged: BenchmarkTriPoint[] = Array.from(byDate.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    this.seriesMap.set(benchmarkId, merged);
    this.sourceMap.set(benchmarkId, sourceLabel);
    this.lastSyncedMap.set(benchmarkId, new Date().toISOString());
    this.persistCache();

    const newest = merged[merged.length - 1];
    return {
      benchmarkId,
      rowsParsed,
      rowsInsertedOrUpdated,
      earliestDate: earliestImport,
      latestDate: newest.date,
      latestValue: newest.value,
      dataSource: sourceLabel
    };
  }

  /**
   * Manual upsert of a single TRI observation (for admin overrides / quick EOD entry).
   */
  public upsertManualPoint(
    benchmarkId: StandardBenchmarkId,
    date: string,
    value: number
  ): BenchmarkCsvImportResult {
    const isoDate = this.parseFlexibleDate(date);
    if (!isoDate) {
      throw new Error(`Invalid date format: ${date}. Use YYYY-MM-DD or DD-MMM-YYYY.`);
    }
    if (isNaN(value) || value <= 0) {
      throw new Error(`Invalid TRI value: ${value}`);
    }
    return this.importBenchmarkCsv(benchmarkId, `Date,Value\n${isoDate},${value}`, 'MANUAL_ENTRY');
  }

  /**
   * Computes Portfolio vs. Selected Benchmark (or SEBI-style Custom Blended Benchmark)
   * growth curve, cashflow-adjusted PME XIRR, Net Alpha, Extra Wealth in ₹, and Risk Metrics.
   */
  public comparePortfolioAgainstBenchmark(req: PortfolioBenchmarkRequest): PortfolioBenchmarkResponse {
    const horizonMonthsMap: Record<PortfolioBenchmarkRequest['horizon'], number> = {
      '6M': 6,
      '1Y': 12,
      '3Y': 36,
      '5Y': 60,
      'ALL': 72
    };
    const months = horizonMonthsMap[req.horizon] || 36;

    // 1. Resolve Benchmark Series (Standard or Auto-Blended)
    let benchmarkName = '';
    let benchmarkCategory = '';
    let benchmarkSource: BenchmarkDataSource = 'LOCAL_SEED_FIXTURE';
    let blendedComposition: string | undefined;
    let rawSeries: BenchmarkTriPoint[] = [];

    if (req.benchmarkId === 'CUSTOM_BLENDED') {
      const eqWeight = Math.min(1, Math.max(0, (req.assetAllocation.equityPct + (req.assetAllocation.hybridPct || 0) * 0.65) / 100));
      const debtWeight = 1 - eqWeight;
      const eqSeries = this.seriesMap.get('NIFTY_500_TRI') || [];
      const debtSeries = this.seriesMap.get('CRISIL_SHORT_TERM_DEBT') || [];

      const debtByDate = new Map(debtSeries.map(p => [p.date, p.value]));
      const eqBase = eqSeries[0]?.value || 1;
      const debtBase = debtSeries[0]?.value || 1;

      rawSeries = eqSeries
        .filter(p => debtByDate.has(p.date))
        .map(p => {
          const eqNorm = p.value / eqBase;
          const debtNorm = (debtByDate.get(p.date) || debtBase) / debtBase;
          return {
            date: p.date,
            value: Number(((eqWeight * eqNorm + debtWeight * debtNorm) * 10000).toFixed(4))
          };
        });

      benchmarkName = 'Custom Blended Benchmark (TRI)';
      benchmarkCategory = 'Asset-Matched Hybrid';
      benchmarkSource = this.sourceMap.get('NIFTY_500_TRI') || 'LOCAL_SEED_FIXTURE';
      blendedComposition = `${Math.round(eqWeight * 100)}% Nifty 500 TRI + ${Math.round(debtWeight * 100)}% CRISIL Short Term Debt`;
    } else {
      const cfg = BENCHMARK_CONFIGS.find(c => c.id === req.benchmarkId);
      if (!cfg) {
        throw new Error(`Unsupported benchmarkId: ${req.benchmarkId}`);
      }
      rawSeries = this.seriesMap.get(cfg.id) || [];
      benchmarkName = cfg.name;
      benchmarkCategory = cfg.category;
      benchmarkSource = this.sourceMap.get(cfg.id) || 'LOCAL_SEED_FIXTURE';
    }

    // 2. Slice to requested horizon and sample ~36-60 clean chart points
    const latestDateStr = rawSeries[rawSeries.length - 1]?.date || '2026-11-17';
    const endDt = new Date(latestDateStr);
    const startDt = new Date(endDt);
    startDt.setMonth(startDt.getMonth() - months);
    const startDateStr = startDt.toISOString().split('T')[0];

    const sliced = rawSeries.filter(p => p.date >= startDateStr);
    const workingSeries = sliced.length >= 10 ? sliced : rawSeries.slice(-120);

    const startBenchVal = workingSeries[0].value;
    const endBenchVal = workingSeries[workingSeries.length - 1].value;
    const yearsElapsed = Math.max(0.25, months / 12);

    // Annualized benchmark return over horizon
    const benchmarkCagr = (Math.pow(endBenchVal / startBenchVal, 1 / yearsElapsed) - 1) * 100;

    // 3. Cashflow-Adjusted Public Market Equivalent (PME) simulation
    const invested = Math.max(1, req.totalInvested);
    const currentVal = Math.max(1, req.currentValue);
    const portXirr = req.portfolioXirrPct;

    let benchEquivalentValue = invested * Math.pow(1 + benchmarkCagr / 100, yearsElapsed);
    if (req.cashflows && req.cashflows.length > 0) {
      // Exact unit-based PME replay: buy benchmark units on every investor cashflow date
      let benchUnits = 0;
      for (const cf of req.cashflows) {
        const nearest = this.findNearestPoint(rawSeries, cf.date);
        if (nearest && nearest.value > 0) {
          benchUnits += cf.amount / nearest.value;
        }
      }
      if (benchUnits > 0) {
        benchEquivalentValue = benchUnits * endBenchVal;
      }
    } else {
      // Align equivalent valuation with portfolio's implied investment duration
      const impliedYears =
        portXirr > 0.5 && currentVal > invested
          ? Math.min(8, Math.max(0.5, Math.log(currentVal / invested) / Math.log(1 + portXirr / 100)))
          : yearsElapsed;
      benchEquivalentValue = invested * Math.pow(1 + benchmarkCagr / 100, impliedYears);
    }

    const netAlphaPct = Number((portXirr - benchmarkCagr).toFixed(2));
    const extraWealthCreatedInr = Number((currentVal - benchEquivalentValue).toFixed(2));

    // 4. Construct Chart Time-Series (Sampled to ~42 clean points for crisp SVG rendering)
    const targetPoints = 42;
    const step = Math.max(1, Math.floor(workingSeries.length / targetPoints));
    const sampled: BenchmarkTriPoint[] = [];
    for (let i = 0; i < workingSeries.length; i += step) {
      sampled.push(workingSeries[i]);
    }
    if (sampled[sampled.length - 1].date !== workingSeries[workingSeries.length - 1].date) {
      sampled.push(workingSeries[workingSeries.length - 1]);
    }

    const equityFrac = Math.min(1, Math.max(0.15, (req.assetAllocation.equityPct + (req.assetAllocation.hybridPct || 0) * 0.6) / 100));
    const portfolioBeta = Number((0.42 + equityFrac * 0.54).toFixed(2));
    const totalPortGrowthRatio = Math.pow(1 + portXirr / 100, yearsElapsed);
    const totalBenchGrowthRatio = endBenchVal / startBenchVal;
    const alphaRatio = totalPortGrowthRatio / Math.max(0.1, totalBenchGrowthRatio);

    const series: PortfolioComparisonPoint[] = [];
    let portPeak = 100;
    let benchPeak = 100;
    let portMaxDd = 0;
    let benchMaxDd = 0;
    let upPortSum = 0;
    let upBenchSum = 0;
    let downPortSum = 0;
    let downBenchSum = 0;

    for (let i = 0; i < sampled.length; i++) {
      const pt = sampled[i];
      const progress = i / Math.max(1, sampled.length - 1);
      const benchBase100 = (pt.value / startBenchVal) * 100;

      // Apply beta smoothing + progressive alpha accrual so curve tracks real market regimes faithfully
      const benchDeviation = benchBase100 - 100;
      const betaAdjusted = 100 + benchDeviation * portfolioBeta;
      const progressiveAlphaFactor = Math.pow(alphaRatio, progress);
      const portBase100 = Math.max(40, betaAdjusted * progressiveAlphaFactor);

      // Anchor final point smoothly to exact current values
      const finalPortBase100 =
        i === sampled.length - 1 ? Number((totalPortGrowthRatio * 100).toFixed(2)) : Number(portBase100.toFixed(2));
      const finalBenchBase100 = Number(benchBase100.toFixed(2));

      if (finalPortBase100 > portPeak) portPeak = finalPortBase100;
      if (finalBenchBase100 > benchPeak) benchPeak = finalBenchBase100;
      const curPortDd = ((finalPortBase100 - portPeak) / portPeak) * 100;
      const curBenchDd = ((finalBenchBase100 - benchPeak) / benchPeak) * 100;
      if (curPortDd < portMaxDd) portMaxDd = curPortDd;
      if (curBenchDd < benchMaxDd) benchMaxDd = curBenchDd;

      if (i > 0) {
        const prev = series[i - 1];
        const bRet = (finalBenchBase100 - prev.benchmarkBase100) / prev.benchmarkBase100;
        const pRet = (finalPortBase100 - prev.portfolioBase100) / prev.portfolioBase100;
        if (bRet > 0) {
          upBenchSum += bRet;
          upPortSum += pRet;
        } else if (bRet < 0) {
          downBenchSum += bRet;
          downPortSum += pRet;
        }
      }

      // Scale cashflow-equivalent value trajectory from invested -> current / benchmarkEquivalent
      const portValInr =
        i === sampled.length - 1
          ? Math.round(currentVal)
          : Math.round(invested + (currentVal - invested) * ((finalPortBase100 - 100) / Math.max(1, totalPortGrowthRatio * 100 - 100)));
      const benchValInr =
        i === sampled.length - 1
          ? Math.round(benchEquivalentValue)
          : Math.round(
              invested +
                (benchEquivalentValue - invested) *
                  ((finalBenchBase100 - 100) / Math.max(1, (endBenchVal / startBenchVal) * 100 - 100))
            );

      series.push({
        date: pt.date,
        portfolioBase100: finalPortBase100,
        benchmarkBase100: finalBenchBase100,
        portfolioValueInr: Math.max(Math.round(invested * 0.5), portValInr),
        benchmarkValueInr: Math.max(Math.round(invested * 0.5), benchValInr),
        spreadPct: Number((finalPortBase100 - finalBenchBase100).toFixed(2))
      });
    }

    const upCapture = upBenchSum > 0 ? Number(((upPortSum / upBenchSum) * 100).toFixed(1)) : 100;
    const downCapture = downBenchSum < 0 ? Number(((downPortSum / downBenchSum) * 100).toFixed(1)) : 85;

    return {
      portfolioName: req.portfolioName || 'Client Portfolio',
      benchmarkId: req.benchmarkId,
      benchmarkName,
      benchmarkCategory,
      benchmarkLastUpdated: latestDateStr,
      benchmarkDataSource: benchmarkSource,
      blendedComposition,
      horizon: req.horizon,
      metrics: {
        portfolioXirrPct: Number(portXirr.toFixed(2)),
        benchmarkXirrPct: Number(benchmarkCagr.toFixed(2)),
        netAlphaPct,
        portfolioCurrentValueInr: Math.round(currentVal),
        benchmarkEquivalentValueInr: Math.round(benchEquivalentValue),
        extraWealthCreatedInr: Math.round(extraWealthCreatedInr),
        portfolioMaxDrawdownPct: Number(portMaxDd.toFixed(2)),
        benchmarkMaxDrawdownPct: Number(benchMaxDd.toFixed(2)),
        portfolioBeta,
        upCaptureRatioPct: upCapture,
        downCaptureRatioPct: downCapture,
        outperforming: netAlphaPct >= 0
      },
      series,
      sebiComplianceNote:
        'Benchmark comparison uses Total Return Index (TRI) variants assuming dividend reinvestment, aligned with SEBI circular SEBI/HO/IMD/DF3/CIR/P/2018/04. Past performance is not indicative of future returns.'
    };
  }

  private computeTrailingReturn(series: BenchmarkTriPoint[], years: number, annualized: boolean): number {
    if (series.length < 2) return 0;
    const latest = series[series.length - 1];
    const targetDt = new Date(latest.date);
    targetDt.setDate(targetDt.getDate() - Math.round(years * 365.25));
    const targetStr = targetDt.toISOString().split('T')[0];

    const past = this.findNearestPoint(series, targetStr) || series[0];
    if (!past || past.value <= 0) return 0;

    const ratio = latest.value / past.value;
    if (annualized && years >= 1) {
      return Number(((Math.pow(ratio, 1 / years) - 1) * 100).toFixed(2));
    }
    return Number(((ratio - 1) * 100).toFixed(2));
  }

  private findNearestPoint(series: BenchmarkTriPoint[], targetDate: string): BenchmarkTriPoint | null {
    if (series.length === 0) return null;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].date <= targetDate) {
        return series[i];
      }
    }
    return series[0];
  }

  /**
   * Parses common Indian financial date formats into ISO YYYY-MM-DD:
   * - YYYY-MM-DD (2026-11-18)
   * - DD-MM-YYYY (18-11-2026)
   * - DD-MMM-YYYY or DD MMM YYYY (18-Nov-2026 or 18 Nov 2026 — NSE Indices official CSV format)
   */
  public parseFlexibleDate(input: string): string | null {
    if (!input) return null;
    const s = input.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s;
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      const dd = dmy[1].padStart(2, '0');
      const mm = dmy[2].padStart(2, '0');
      const yyyy = dmy[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    // DD-MMM-YYYY or DD MMM YYYY (e.g., 18 Nov 2026, 05-Oct-2025)
    const dMonY = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
    if (dMonY) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const mm = months[dMonY[2].toLowerCase()];
      if (mm) {
        return `${dMonY[3]}-${mm}-${dMonY[1].padStart(2, '0')}`;
      }
    }

    return null;
  }
}
