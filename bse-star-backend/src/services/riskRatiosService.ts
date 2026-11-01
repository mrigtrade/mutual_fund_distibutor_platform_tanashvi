/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Risk Ratios & Volatility Metrics Engine
 * Parity with AdvisorKhoj Risk Analysis (Standard Deviation, Beta, Sharpe, Sortino, Alpha)
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 */

import { ResearchDataService } from './researchDataService.js';
import { RiskRatiosResult } from '../types/research.js';

export class RiskRatiosService {
  private static instance: RiskRatiosService;
  private dataService: ResearchDataService;

  private constructor() {
    this.dataService = ResearchDataService.getInstance();
  }

  public static getInstance(): RiskRatiosService {
    if (!RiskRatiosService.instance) {
      RiskRatiosService.instance = new RiskRatiosService();
    }
    return RiskRatiosService.instance;
  }

  /**
   * Computes comprehensive risk and return analytics for a scheme against benchmark
   * @param schemeCode AMFI scheme code
   * @param periodYears Analysis horizon in years (default 3 years)
   * @param riskFreeRatePct Annualized risk-free rate (default 6.50% RBI T-Bill rate)
   */
  public calculateRiskRatios(
    schemeCode: string,
    periodYears: number = 3,
    riskFreeRatePct: number = 6.50
  ): RiskRatiosResult {
    const schemeNavs = this.dataService.getHistoricalNavs(schemeCode);
    const benchmarkNavs = this.dataService.getBenchmarkNavs();
    const profile = this.dataService.getSchemeProfile(schemeCode);

    const schemeName = profile ? profile.schemeName : `Scheme ${schemeCode}`;
    const benchmarkName = 'NIFTY 50 TRI';

    // Map benchmark NAVs by date
    const benchMap = new Map<string, number>();
    for (const b of benchmarkNavs) {
      benchMap.set(b.date, b.nav);
    }

    // Determine cutoff date for periodYears
    const lastNavDate = new Date(schemeNavs[schemeNavs.length - 1].date);
    const cutoffDate = new Date(lastNavDate);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - periodYears);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Filter aligned time-series
    const alignedSchemeNavs = schemeNavs.filter((s) => s.date >= cutoffDateStr);
    
    // Compute daily log/percentage returns for scheme and benchmark
    const schemeDailyReturns: number[] = [];
    const benchDailyReturns: number[] = [];

    for (let i = 1; i < alignedSchemeNavs.length; i++) {
      const prev = alignedSchemeNavs[i - 1];
      const curr = alignedSchemeNavs[i];

      const prevBench = benchMap.get(prev.date);
      const currBench = benchMap.get(curr.date);

      if (prevBench && currBench && prevBench > 0) {
        const rs = (curr.nav - prev.nav) / prev.nav;
        const rb = (currBench - prevBench) / prevBench;

        schemeDailyReturns.push(rs);
        benchDailyReturns.push(rb);
      }
    }

    const n = schemeDailyReturns.length;
    if (n < 30) {
      throw new Error(`Insufficient historical data points (${n}) to compute 3-year risk ratios.`);
    }

    // Means
    const meanRs = schemeDailyReturns.reduce((sum, r) => sum + r, 0) / n;
    const meanRb = benchDailyReturns.reduce((sum, r) => sum + r, 0) / n;

    // Annualized Returns (Compound Annualized Growth Rate over period)
    const annualReturnScheme = meanRs * 252;
    const annualReturnBench = meanRb * 252;
    const rf = riskFreeRatePct / 100;
    const dailyRf = rf / 252;

    // Variances and Covariance
    let sumSqDiffS = 0;
    let sumSqDiffB = 0;
    let sumCrossDiff = 0;
    let sumDownsideSq = 0;

    for (let i = 0; i < n; i++) {
      const diffS = schemeDailyReturns[i] - meanRs;
      const diffB = benchDailyReturns[i] - meanRb;

      sumSqDiffS += diffS * diffS;
      sumSqDiffB += diffB * diffB;
      sumCrossDiff += diffS * diffB;

      // Downside deviation relative to daily risk-free rate
      const downside = Math.min(0, schemeDailyReturns[i] - dailyRf);
      sumDownsideSq += downside * downside;
    }

    const varS = sumSqDiffS / (n - 1);
    const varB = sumSqDiffB / (n - 1);
    const covSB = sumCrossDiff / (n - 1);

    // Standard Deviations (Annualized)
    const stdDevS = Math.sqrt(varS) * Math.sqrt(252);
    const stdDevB = Math.sqrt(varB) * Math.sqrt(252);

    // Beta
    const beta = varB > 0 ? covSB / varB : 1.0;

    // Correlation & R-Squared
    const correlation = Math.sqrt(varS * varB) > 0 ? covSB / Math.sqrt(varS * varB) : 0;
    const rSquared = Math.pow(correlation, 2);

    // Jensen's Alpha (Annualized %)
    // Alpha = (Rs - Rf) - Beta * (Rb - Rf)
    const alpha = (annualReturnScheme - rf) - beta * (annualReturnBench - rf);

    // Sharpe Ratio = (Rs - Rf) / Annualized Standard Deviation
    const sharpe = stdDevS > 0 ? (annualReturnScheme - rf) / stdDevS : 0;

    // Sortino Ratio = (Rs - Rf) / Annualized Downside Deviation
    const downsideDev = Math.sqrt(sumDownsideSq / n) * Math.sqrt(252);
    const sortino = downsideDev > 0 ? (annualReturnScheme - rf) / downsideDev : 0;

    // Treynor Ratio = (Rs - Rf) / Beta
    const treynor = beta !== 0 ? (annualReturnScheme - rf) / beta : 0;

    return {
      schemeCode,
      schemeName,
      benchmarkName,
      periodYears,
      dataPoints: n,
      annualizedReturnPct: Number((annualReturnScheme * 100).toFixed(2)),
      benchmarkAnnualizedReturnPct: Number((annualReturnBench * 100).toFixed(2)),
      riskFreeRatePct,
      standardDeviationPct: Number((stdDevS * 100).toFixed(2)),
      benchmarkStandardDeviationPct: Number((stdDevB * 100).toFixed(2)),
      beta: Number(beta.toFixed(2)),
      alphaPct: Number((alpha * 100).toFixed(2)),
      sharpeRatio: Number(sharpe.toFixed(2)),
      sortinoRatio: Number(sortino.toFixed(2)),
      treynorRatio: Number((treynor * 100).toFixed(2)),
      rSquared: Number(rSquared.toFixed(2))
    };
  }
}
