/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Mutual Fund Research & Analytics Types
 * Parity with AdvisorKhoj Research Engine
 */

export interface HistoricalNavPoint {
  date: string; // YYYY-MM-DD
  nav: number;
}

export interface RollingReturnPoint {
  date: string;
  schemeReturnPct: number;
  benchmarkReturnPct?: number;
}

export interface ReturnDistribution {
  lessThanZeroPct: number;      // Negative returns (%)
  zeroToEightPct: number;       // 0% - 8% (FD-like returns)
  eightToTwelvePct: number;     // 8% - 12% (Moderate equity)
  twelveToFifteenPct: number;   // 12% - 15% (Healthy equity)
  greaterThanFifteenPct: number;// > 15% (Super-normal equity)
}

export interface RollingReturnsResult {
  schemeCode: string;
  schemeName: string;
  benchmarkName: string;
  horizonYears: number;
  totalPeriods: number;
  startDate: string;
  endDate: string;
  schemeMetrics: {
    minReturnPct: number;
    maxReturnPct: number;
    avgReturnPct: number;
    medianReturnPct: number;
    distribution: ReturnDistribution;
  };
  benchmarkMetrics: {
    minReturnPct: number;
    maxReturnPct: number;
    avgReturnPct: number;
    medianReturnPct: number;
    distribution: ReturnDistribution;
  };
  timeSeries: RollingReturnPoint[];
}

export interface RiskRatiosResult {
  schemeCode: string;
  schemeName: string;
  benchmarkName: string;
  periodYears: number;
  dataPoints: number;
  annualizedReturnPct: number;
  benchmarkAnnualizedReturnPct: number;
  riskFreeRatePct: number; // typically 6.50% (RBI 91-day T-Bill)
  standardDeviationPct: number;
  benchmarkStandardDeviationPct: number;
  beta: number;
  alphaPct: number; // Jensen's Alpha (annualized)
  sharpeRatio: number;
  sortinoRatio: number;
  treynorRatio: number;
  rSquared: number;
}

export interface SchemeHolding {
  companyName: string;
  isin?: string;
  sector: string;
  weightPct: number;
  assetClass: 'EQUITY' | 'DEBT' | 'CASH_EQUIVALENT';
}

export interface SchemeComparisonItem {
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: string;
  aumCrores: number;
  expenseRatioPct: number;
  inceptionDate: string;
  fundManager: string;
  returns: {
    m1: number;
    m3: number;
    m6: number;
    y1: number;
    y3: number;
    y5: number;
    sinceInception: number;
  };
  riskRatios: {
    standardDeviation: number;
    sharpe: number;
    beta: number;
    alpha: number;
  };
  topHoldings: SchemeHolding[];
  sectorAllocation: { sector: string; weightPct: number }[];
}

export interface PortfolioOverlapItem {
  companyName: string;
  sector: string;
  weightInSchemeA: number;
  weightInSchemeB: number;
  overlappingWeight: number; // min(weightA, weightB)
}

export interface PortfolioOverlapResult {
  schemeA: {
    code: string;
    name: string;
    totalHoldingsCount: number;
  };
  schemeB: {
    code: string;
    name: string;
    totalHoldingsCount: number;
  };
  overlapPercentage: number; // Sum of min(weightA, weightB)
  commonHoldingsCount: number;
  uniqueToSchemeACount: number;
  uniqueToSchemeBCount: number;
  commonHoldings: PortfolioOverlapItem[];
  uniqueToSchemeA: { companyName: string; sector: string; weight: number }[];
  uniqueToSchemeB: { companyName: string; sector: string; weight: number }[];
}

