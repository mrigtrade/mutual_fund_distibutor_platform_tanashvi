/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Rolling Returns Engine
 * Parity with AdvisorKhoj Rolling Returns vs Benchmark Engine
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 * Calculates rolling CAGR returns over 1Y, 3Y, 5Y, and 7Y investment horizons.
 */

import { ResearchDataService } from './researchDataService.js';
import {
  HistoricalNavPoint,
  RollingReturnPoint,
  RollingReturnsResult,
  ReturnDistribution
} from '../types/research.js';

export class RollingReturnsService {
  private static instance: RollingReturnsService;
  private dataService: ResearchDataService;

  private constructor() {
    this.dataService = ResearchDataService.getInstance();
  }

  public static getInstance(): RollingReturnsService {
    if (!RollingReturnsService.instance) {
      RollingReturnsService.instance = new RollingReturnsService();
    }
    return RollingReturnsService.instance;
  }

  /**
   * Helper: Finds closest trading day index on or before target date
   */
  private findClosestIndex(navs: HistoricalNavPoint[], targetDateStr: string): number {
    let low = 0;
    let high = navs.length - 1;
    let bestIndex = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (navs[mid].date === targetDateStr) {
        return mid;
      } else if (navs[mid].date < targetDateStr) {
        bestIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return bestIndex;
  }

  /**
   * Computes statistical distribution and key quantiles for an array of returns
   */
  private computeReturnStatistics(returns: number[]): {
    minReturnPct: number;
    maxReturnPct: number;
    avgReturnPct: number;
    medianReturnPct: number;
    distribution: ReturnDistribution;
  } {
    if (returns.length === 0) {
      return {
        minReturnPct: 0,
        maxReturnPct: 0,
        avgReturnPct: 0,
        medianReturnPct: 0,
        distribution: {
          lessThanZeroPct: 0,
          zeroToEightPct: 0,
          eightToTwelvePct: 0,
          twelveToFifteenPct: 0,
          greaterThanFifteenPct: 0
        }
      };
    }

    const sorted = [...returns].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / sorted.length;

    let median = 0;
    const midIdx = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      median = (sorted[midIdx - 1] + sorted[midIdx]) / 2;
    } else {
      median = sorted[midIdx];
    }

    let countNeg = 0;
    let count0to8 = 0;
    let count8to12 = 0;
    let count12to15 = 0;
    let countAbove15 = 0;

    for (const r of returns) {
      if (r < 0) {
        countNeg++;
      } else if (r >= 0 && r < 8) {
        count0to8++;
      } else if (r >= 8 && r < 12) {
        count8to12++;
      } else if (r >= 12 && r < 15) {
        count12to15++;
      } else {
        countAbove15++;
      }
    }

    const total = returns.length;
    return {
      minReturnPct: Number(min.toFixed(2)),
      maxReturnPct: Number(max.toFixed(2)),
      avgReturnPct: Number(avg.toFixed(2)),
      medianReturnPct: Number(median.toFixed(2)),
      distribution: {
        lessThanZeroPct: Number(((countNeg / total) * 100).toFixed(1)),
        zeroToEightPct: Number(((count0to8 / total) * 100).toFixed(1)),
        eightToTwelvePct: Number(((count8to12 / total) * 100).toFixed(1)),
        twelveToFifteenPct: Number(((count12to15 / total) * 100).toFixed(1)),
        greaterThanFifteenPct: Number(((countAbove15 / total) * 100).toFixed(1))
      }
    };
  }

  /**
   * Computes Rolling Returns over given horizon years (1, 3, 5, 7)
   */
  public calculateRollingReturns(
    schemeCode: string,
    horizonYears: number = 3
  ): RollingReturnsResult {
    const schemeNavs = this.dataService.getHistoricalNavs(schemeCode);
    const benchmarkNavs = this.dataService.getBenchmarkNavs();
    const profile = this.dataService.getSchemeProfile(schemeCode);

    const schemeName = profile ? profile.schemeName : `Scheme ${schemeCode}`;
    const benchmarkName = 'NIFTY 50 TRI';

    // Map benchmark by date for fast lookup
    const benchMap = new Map<string, number>();
    for (const b of benchmarkNavs) {
      benchMap.set(b.date, b.nav);
    }

    const timeSeries: RollingReturnPoint[] = [];
    const schemeReturns: number[] = [];
    const benchReturns: number[] = [];

    // Approximate trading days for horizon
    const daysOffset = Math.round(horizonYears * 250);

    for (let i = daysOffset; i < schemeNavs.length; i++) {
      const currentPoint = schemeNavs[i];
      const currentDate = new Date(currentPoint.date);
      
      // Calculate target date N years prior
      const targetPastDate = new Date(currentDate);
      targetPastDate.setFullYear(targetPastDate.getFullYear() - horizonYears);
      const targetDateStr = targetPastDate.toISOString().split('T')[0];

      // Find closest trading day on or before past date
      const pastIdx = this.findClosestIndex(schemeNavs, targetDateStr);
      if (pastIdx < 0 || pastIdx >= i) continue;

      const pastPoint = schemeNavs[pastIdx];
      const daysDiff = (currentDate.getTime() - new Date(pastPoint.date).getTime()) / (1000 * 3600 * 24);
      const yearsElapsed = daysDiff / 365.25;

      if (yearsElapsed < horizonYears * 0.90 || yearsElapsed > horizonYears * 1.10) {
        continue;
      }

      // Scheme Rolling CAGR
      const schemeCagr = (Math.pow(currentPoint.nav / pastPoint.nav, 1 / yearsElapsed) - 1) * 100;
      schemeReturns.push(schemeCagr);

      // Benchmark Rolling CAGR over same dates
      let benchReturn: number | undefined;
      const currentBenchNav = benchMap.get(currentPoint.date);
      const pastBenchNav = benchMap.get(pastPoint.date);

      if (currentBenchNav && pastBenchNav && pastBenchNav > 0) {
        benchReturn = (Math.pow(currentBenchNav / pastBenchNav, 1 / yearsElapsed) - 1) * 100;
        benchReturns.push(benchReturn);
      }

      timeSeries.push({
        date: currentPoint.date,
        schemeReturnPct: Number(schemeCagr.toFixed(2)),
        benchmarkReturnPct: benchReturn !== undefined ? Number(benchReturn.toFixed(2)) : undefined
      });
    }

    const schemeStats = this.computeReturnStatistics(schemeReturns);
    const benchmarkStats = this.computeReturnStatistics(benchReturns);

    return {
      schemeCode,
      schemeName,
      benchmarkName,
      horizonYears,
      totalPeriods: timeSeries.length,
      startDate: timeSeries.length > 0 ? timeSeries[0].date : '',
      endDate: timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].date : '',
      schemeMetrics: schemeStats,
      benchmarkMetrics: benchmarkStats,
      timeSeries
    };
  }
}
