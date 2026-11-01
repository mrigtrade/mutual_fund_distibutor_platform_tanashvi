/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Portfolio Overlap Analysis Engine
 * Parity with AdvisorKhoj Portfolio Overlap Tool
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 * Calculates the exact percentage overlap and shared stock holdings between two mutual funds.
 */

import { ResearchDataService } from './researchDataService.js';
import {
  PortfolioOverlapResult,
  PortfolioOverlapItem
} from '../types/research.js';

export class PortfolioOverlapService {
  private static instance: PortfolioOverlapService;
  private dataService: ResearchDataService;

  private constructor() {
    this.dataService = ResearchDataService.getInstance();
  }

  public static getInstance(): PortfolioOverlapService {
    if (!PortfolioOverlapService.instance) {
      PortfolioOverlapService.instance = new PortfolioOverlapService();
    }
    return PortfolioOverlapService.instance;
  }

  /**
   * Computes portfolio overlap between two mutual fund schemes
   */
  public calculateOverlap(schemeCodeA: string, schemeCodeB: string): PortfolioOverlapResult {
    const profileA = this.dataService.getSchemeProfile(schemeCodeA);
    const profileB = this.dataService.getSchemeProfile(schemeCodeB);

    const nameA = profileA ? profileA.schemeName : `Scheme ${schemeCodeA}`;
    const nameB = profileB ? profileB.schemeName : `Scheme ${schemeCodeB}`;

    const holdingsA = this.dataService.getSchemeHoldings(schemeCodeA);
    const holdingsB = this.dataService.getSchemeHoldings(schemeCodeB);

    // Map company -> holding
    const mapA = new Map<string, { weight: number; sector: string; isin?: string }>();
    for (const h of holdingsA) {
      if (h.assetClass === 'EQUITY') {
        mapA.set(h.companyName.trim().toLowerCase(), {
          weight: h.weightPct,
          sector: h.sector,
          isin: h.isin
        });
      }
    }

    const mapB = new Map<string, { weight: number; sector: string; isin?: string }>();
    for (const h of holdingsB) {
      if (h.assetClass === 'EQUITY') {
        mapB.set(h.companyName.trim().toLowerCase(), {
          weight: h.weightPct,
          sector: h.sector,
          isin: h.isin
        });
      }
    }

    const commonHoldings: PortfolioOverlapItem[] = [];
    const uniqueToA: { companyName: string; sector: string; weight: number }[] = [];
    const uniqueToB: { companyName: string; sector: string; weight: number }[] = [];

    let totalOverlapPct = 0;

    // Check all holdings in A
    for (const h of holdingsA) {
      if (h.assetClass !== 'EQUITY') continue;
      const key = h.companyName.trim().toLowerCase();
      const inB = mapB.get(key);

      if (inB) {
        const overlap = Math.min(h.weightPct, inB.weight);
        totalOverlapPct += overlap;
        commonHoldings.push({
          companyName: h.companyName,
          sector: h.sector,
          weightInSchemeA: h.weightPct,
          weightInSchemeB: inB.weight,
          overlappingWeight: Number(overlap.toFixed(2))
        });
      } else {
        uniqueToA.push({
          companyName: h.companyName,
          sector: h.sector,
          weight: h.weightPct
        });
      }
    }

    // Check unique holdings in B
    for (const h of holdingsB) {
      if (h.assetClass !== 'EQUITY') continue;
      const key = h.companyName.trim().toLowerCase();
      if (!mapA.has(key)) {
        uniqueToB.push({
          companyName: h.companyName,
          sector: h.sector,
          weight: h.weightPct
        });
      }
    }

    // Sort common holdings by overlapping weight descending
    commonHoldings.sort((a, b) => b.overlappingWeight - a.overlappingWeight);
    uniqueToA.sort((a, b) => b.weight - a.weight);
    uniqueToB.sort((a, b) => b.weight - a.weight);

    return {
      schemeA: {
        code: schemeCodeA,
        name: nameA,
        totalHoldingsCount: holdingsA.filter((h) => h.assetClass === 'EQUITY').length
      },
      schemeB: {
        code: schemeCodeB,
        name: nameB,
        totalHoldingsCount: holdingsB.filter((h) => h.assetClass === 'EQUITY').length
      },
      overlapPercentage: Number(totalOverlapPct.toFixed(2)),
      commonHoldingsCount: commonHoldings.length,
      uniqueToSchemeACount: uniqueToA.length,
      uniqueToSchemeBCount: uniqueToB.length,
      commonHoldings,
      uniqueToSchemeA: uniqueToA,
      uniqueToSchemeB: uniqueToB
    };
  }
}
