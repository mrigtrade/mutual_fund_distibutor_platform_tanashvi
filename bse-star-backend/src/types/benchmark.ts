/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 15: Multi-Benchmark TRI Data & Portfolio Visualization Types
 */

export type StandardBenchmarkId =
  | 'NIFTY_50_TRI'
  | 'NIFTY_500_TRI'
  | 'NIFTY_MIDCAP_150_TRI'
  | 'NIFTY_SMALLCAP_250_TRI'
  | 'BSE_SENSEX_TRI'
  | 'CRISIL_SHORT_TERM_DEBT';

export type BenchmarkId = StandardBenchmarkId | 'CUSTOM_BLENDED';

export type BenchmarkDataSource =
  | 'LIVE_NSE_TRI'
  | 'LIVE_AMFI_PROXY'
  | 'CSV_IMPORT'
  | 'MANUAL_ENTRY'
  | 'LOCAL_SEED_FIXTURE';

export interface BenchmarkTriPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface BenchmarkMetadata {
  id: StandardBenchmarkId;
  name: string;
  shortName: string;
  category: 'Large Cap' | 'Broad Market' | 'Mid Cap' | 'Small Cap' | 'Debt';
  provider: 'NSE Indices' | 'Asia Index (BSE)' | 'CRISIL';
  description: string;
  amfiProxySchemeCode: string;
  amfiProxySchemeName: string;
  nseIndexName?: string;
  lastUpdatedDate: string;
  lastSyncedAt: string;
  dataSource: BenchmarkDataSource;
  dataPointsCount: number;
  latestValue: number;
  returns: {
    cagr6M: number;
    cagr1Y: number;
    cagr3Y: number;
    cagr5Y: number;
  };
}

export interface BenchmarkSyncItemResult {
  benchmarkId: StandardBenchmarkId;
  name: string;
  status: 'UPDATED_LIVE' | 'FALLBACK_CACHE' | 'FAILED';
  source: BenchmarkDataSource;
  pointsAddedOrUpdated: number;
  latestDate: string;
  latestValue: number;
  message: string;
}

export interface BenchmarkSyncSummary {
  syncedAt: string;
  mode: 'LIVE_ATTEMPTED' | 'OFFLINE_SEED';
  totalBenchmarks: number;
  liveUpdatedCount: number;
  results: BenchmarkSyncItemResult[];
}

export interface BenchmarkCsvImportResult {
  benchmarkId: StandardBenchmarkId;
  rowsParsed: number;
  rowsInsertedOrUpdated: number;
  earliestDate: string;
  latestDate: string;
  latestValue: number;
  dataSource: BenchmarkDataSource;
}

export interface PortfolioCashflowItem {
  date: string; // YYYY-MM-DD
  amount: number; // Positive = investment inflow, Negative = withdrawal/redemption
}

export interface PortfolioBenchmarkRequest {
  portfolioName?: string;
  benchmarkId: BenchmarkId;
  horizon: '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
  totalInvested: number;
  currentValue: number;
  portfolioXirrPct: number;
  assetAllocation: {
    equityPct: number;
    debtPct: number;
    liquidPct?: number;
    hybridPct?: number;
  };
  cashflows?: PortfolioCashflowItem[];
}

export interface PortfolioComparisonPoint {
  date: string;
  portfolioBase100: number;
  benchmarkBase100: number;
  portfolioValueInr: number;
  benchmarkValueInr: number;
  spreadPct: number;
}

export interface PortfolioBenchmarkResponse {
  portfolioName: string;
  benchmarkId: BenchmarkId;
  benchmarkName: string;
  benchmarkCategory: string;
  benchmarkLastUpdated: string;
  benchmarkDataSource: BenchmarkDataSource;
  blendedComposition?: string;
  horizon: '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
  metrics: {
    portfolioXirrPct: number;
    benchmarkXirrPct: number;
    netAlphaPct: number;
    portfolioCurrentValueInr: number;
    benchmarkEquivalentValueInr: number;
    extraWealthCreatedInr: number;
    portfolioMaxDrawdownPct: number;
    benchmarkMaxDrawdownPct: number;
    portfolioBeta: number;
    upCaptureRatioPct: number;
    downCaptureRatioPct: number;
    outperforming: boolean;
  };
  series: PortfolioComparisonPoint[];
  sebiComplianceNote: string;
}
