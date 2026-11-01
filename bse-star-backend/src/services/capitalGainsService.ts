/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Capital Gains Tax Engine (SEBI & Income Tax Act Compliant)
 * 
 * Implements Union Budget 2024 (Finance Act No. 2, 2024) Amendments:
 * 1. Effective Date: July 23, 2024
 * 2. Equity STCG: 20% (w.e.f. 23-Jul-2024; formerly 15%)
 * 3. Equity LTCG: 12.5% (w.e.f. 23-Jul-2024; formerly 10%)
 * 4. Equity LTCG Annual Exemption: INR 1,25,000 for FY 2024-25 onwards (formerly INR 1,00,000)
 * 5. Section 112A Pre-Jan 31, 2018 Grandfathering
 * 6. Section 50AA Specified Debt Mutual Funds (purchased post 01-Apr-2023 taxed at slab rate)
 * 7. Legacy Debt & Hybrid LTCG: 12.5% without indexation post 23-Jul-2024
 * 8. FIFO (First-In, First-Out) Lot Matching Engine
 */

import { 
  AssetClass, 
  MatchedFifoLot, 
  PortfolioTransaction, 
  CapitalGainsSummary,
  UnrealizedGainLot,
  UnrealizedGainsSummary
} from '../types/portfolio.js';

export class CapitalGainsService {
  // Key Statutory Cut-off Dates
  public static readonly BUDGET_2024_CUTOFF_DATE = '2024-07-23';
  public static readonly SEC_50AA_DEBT_CUTOFF_DATE = '2023-04-01';
  public static readonly GRANDFATHERING_DATE = '2018-01-31';

  // Annual Exemption Limits
  public static readonly LTCG_EXEMPTION_POST_BUDGET_2024 = 125000; // INR 1.25 Lakhs
  public static readonly LTCG_EXEMPTION_PRE_BUDGET_2024 = 100000;  // INR 1.00 Lakh

  // Health & Education Cess
  public static readonly CESS_RATE = 0.04; // 4%

  // Default marginal slab rate for Section 50AA debt STCG calculation
  public static readonly DEFAULT_SLAB_RATE_PCT = 30.0; // 30% individual highest slab

  /**
   * Helper: Determines Indian Financial Year for a given YYYY-MM-DD date.
   * e.g., '2024-08-15' -> '2024-2025'
   * e.g., '2025-02-10' -> '2024-2025'
   */
  public static getFinancialYear(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Calculates difference in calendar days between two dates.
   */
  public static getDaysBetween(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Checks whether a date falls on or after July 23, 2024 (Budget 2024 regime).
   */
  public static isPostBudget2024(dateStr: string): boolean {
    return dateStr >= this.BUDGET_2024_CUTOFF_DATE;
  }

  /**
   * Evaluates Section 112A Grandfathering for equity units bought on/before 31-Jan-2018.
   * Cost of Acquisition = MAX(Actual Purchase NAV, MIN(FMV on 31-Jan-2018, Sale NAV))
   */
  public static calculateGrandfatheredNav(
    purchaseDate: string,
    purchaseNav: number,
    saleNav: number,
    fmv31Jan2018?: number
  ): { isGrandfathered: boolean; adjustedCostNav: number } {
    if (purchaseDate <= this.GRANDFATHERING_DATE && fmv31Jan2018 && fmv31Jan2018 > 0) {
      const lowerOfFmvAndSale = Math.min(fmv31Jan2018, saleNav);
      const adjustedCostNav = Math.max(purchaseNav, lowerOfFmvAndSale);
      return { isGrandfathered: true, adjustedCostNav };
    }
    return { isGrandfathered: false, adjustedCostNav: purchaseNav };
  }

  /**
   * Determines holding classification (STCG vs LTCG) and statutory tax rate.
   */
  public static classifyGain(
    assetClass: AssetClass,
    purchaseDate: string,
    saleDate: string,
    holdingDays: number
  ): {
    gainType: 'STCG' | 'LTCG';
    isSec50aaDebt: boolean;
    taxRatePct: number;
    budgetRegime: 'BUDGET_2024' | 'PRE_BUDGET_2024';
  } {
    const isPostBudget = this.isPostBudget2024(saleDate);
    const regime = isPostBudget ? 'BUDGET_2024' : 'PRE_BUDGET_2024';

    if (assetClass === 'EQUITY') {
      // Equity: 365 days threshold
      const isLtcg = holdingDays > 365;
      if (isLtcg) {
        // Post Budget 2024: 12.5%; Pre Budget 2024: 10%
        return {
          gainType: 'LTCG',
          isSec50aaDebt: false,
          taxRatePct: isPostBudget ? 12.5 : 10.0,
          budgetRegime: regime
        };
      } else {
        // STCG: Post Budget 2024: 20%; Pre Budget 2024: 15%
        return {
          gainType: 'STCG',
          isSec50aaDebt: false,
          taxRatePct: isPostBudget ? 20.0 : 15.0,
          budgetRegime: regime
        };
      }
    } else if (assetClass === 'DEBT' || assetClass === 'LIQUID') {
      // Specified Debt Mutual Funds (Section 50AA):
      // Purchased on or after 01-Apr-2023 -> Always STCG at slab rate
      if (purchaseDate >= this.SEC_50AA_DEBT_CUTOFF_DATE) {
        return {
          gainType: 'STCG',
          isSec50aaDebt: true,
          taxRatePct: this.DEFAULT_SLAB_RATE_PCT,
          budgetRegime: regime
        };
      } else {
        // Legacy Debt (purchased before 01-Apr-2023):
        // 36 months threshold (1095 days)
        const isLtcg = holdingDays > 1095;
        if (isLtcg) {
          // Post Budget 2024: 12.5% without indexation; Pre Budget 2024: 20% with indexation
          return {
            gainType: 'LTCG',
            isSec50aaDebt: false,
            taxRatePct: isPostBudget ? 12.5 : 20.0,
            budgetRegime: regime
          };
        } else {
          return {
            gainType: 'STCG',
            isSec50aaDebt: false,
            taxRatePct: this.DEFAULT_SLAB_RATE_PCT,
            budgetRegime: regime
          };
        }
      }
    } else {
      // HYBRID / OTHER:
      // Post-Budget 2024 holding period: 24 months (730 days)
      const thresholdDays = isPostBudget ? 730 : 1095;
      const isLtcg = holdingDays > thresholdDays;
      return {
        gainType: isLtcg ? 'LTCG' : 'STCG',
        isSec50aaDebt: false,
        taxRatePct: isLtcg ? 12.5 : this.DEFAULT_SLAB_RATE_PCT,
        budgetRegime: regime
      };
    }
  }

  /**
   * Executes FIFO (First-In, First-Out) Lot Matching on portfolio transactions.
   * Matches redemption transactions with available purchase lots chronologically.
   */
  public static matchFifoLots(
    transactions: PortfolioTransaction[],
    targetFy?: string
  ): { matchedLots: MatchedFifoLot[]; remainingPurchases: PortfolioTransaction[] } {
    // Clone and sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Group purchases into FIFO queues keyed by scheme_code
    const purchaseQueues = new Map<string, {
      id: string;
      scheme_code: string;
      scheme_name: string;
      asset_class: AssetClass;
      date: string;
      nav: number;
      available_units: number;
      fmv_31jan2018?: number;
    }[]>();

    const matchedLots: MatchedFifoLot[] = [];

    for (const tx of sorted) {
      const isPurchase = tx.transaction_type === 'PURCHASE' || 
                         tx.transaction_type === 'ADDITIONAL_PURCHASE' || 
                         tx.transaction_type === 'SIP' || 
                         tx.transaction_type === 'SWITCH_IN' || 
                         tx.transaction_type === 'STP_IN' || 
                         tx.transaction_type === 'DIVIDEND_REINVESTMENT';

      const isRedemption = tx.transaction_type === 'REDEMPTION' || 
                           tx.transaction_type === 'SWITCH_OUT' || 
                           tx.transaction_type === 'STP_OUT' || 
                           tx.transaction_type === 'SWP';

      if (isPurchase) {
        if (!purchaseQueues.has(tx.scheme_code)) {
          purchaseQueues.set(tx.scheme_code, []);
        }
        purchaseQueues.get(tx.scheme_code)!.push({
          id: tx.id,
          scheme_code: tx.scheme_code,
          scheme_name: tx.scheme_name,
          asset_class: tx.asset_class,
          date: tx.transaction_date,
          nav: tx.nav,
          available_units: tx.available_units > 0 ? tx.available_units : tx.units,
          fmv_31jan2018: tx.fmv_31jan2018
        });
      } else if (isRedemption) {
        const queue = purchaseQueues.get(tx.scheme_code) || [];
        let unitsToRedeem = Math.abs(tx.units);
        const saleDate = tx.transaction_date;
        const saleNav = tx.nav;
        const saleFy = this.getFinancialYear(saleDate);

        for (const lot of queue) {
          if (unitsToRedeem <= 0.0001) break;
          if (lot.available_units <= 0.0001) continue;

          const unitsMatched = Math.min(unitsToRedeem, lot.available_units);
          lot.available_units -= unitsMatched;
          unitsToRedeem -= unitsMatched;

          // If targetFy is provided, only record matched lots for that FY
          if (!targetFy || targetFy === saleFy) {
            const holdingDays = this.getDaysBetween(lot.date, saleDate);
            const { gainType, isSec50aaDebt, taxRatePct, budgetRegime } = this.classifyGain(
              lot.asset_class,
              lot.date,
              saleDate,
              holdingDays
            );

            // Grandfathering evaluation for Equity
            const { isGrandfathered, adjustedCostNav } = (lot.asset_class === 'EQUITY' && gainType === 'LTCG')
              ? this.calculateGrandfatheredNav(lot.date, lot.nav, saleNav, lot.fmv_31jan2018)
              : { isGrandfathered: false, adjustedCostNav: lot.nav };

            const purchaseCost = Math.round(unitsMatched * lot.nav * 100) / 100;
            const saleValue = Math.round(unitsMatched * saleNav * 100) / 100;
            const grandfatheredCost = Math.round(unitsMatched * adjustedCostNav * 100) / 100;
            const grossGain = Math.round((saleValue - purchaseCost) * 100) / 100;
            const taxableGain = Math.round((saleValue - grandfatheredCost) * 100) / 100;

            // Individual lot base tax
            const baseTax = taxableGain > 0 ? Math.round((taxableGain * (taxRatePct / 100)) * 100) / 100 : 0;
            const cessAmount = Math.round((baseTax * this.CESS_RATE) * 100) / 100;
            const totalTax = Math.round((baseTax + cessAmount) * 100) / 100;

            matchedLots.push({
              purchaseTxId: lot.id,
              purchaseDate: lot.date,
              purchaseNav: lot.nav,
              unitsMatched: Math.round(unitsMatched * 10000) / 10000,
              purchaseCost,
              saleDate,
              saleNav,
              saleValue,
              holdingDays,
              gainType,
              grossGain,
              isGrandfathered,
              fmv31Jan2018: lot.fmv_31jan2018,
              grandfatheredCost: isGrandfathered ? grandfatheredCost : undefined,
              isSec50aaDebt,
              taxableGain,
              taxRatePct,
              baseTax,
              cessAmount,
              totalTax,
              budgetRegime
            });
          }
        }
      }
    }

    // Remaining unredeemed purchase lots for portfolio valuation and unrealized gains
    const remainingPurchases: PortfolioTransaction[] = [];
    for (const [schemeCode, queue] of purchaseQueues.entries()) {
      for (const item of queue) {
        if (item.available_units > 0.0001) {
          remainingPurchases.push({
            id: item.id,
            tenant_id: '',
            ucc_id: '',
            folio_id: '',
            scheme_code: item.scheme_code,
            scheme_name: item.scheme_name,
            asset_class: item.asset_class,
            transaction_date: item.date,
            transaction_type: 'PURCHASE',
            units: item.available_units,
            nav: item.nav,
            amount: Math.round(item.available_units * item.nav * 100) / 100,
            available_units: item.available_units,
            fmv_31jan2018: item.fmv_31jan2018,
            source: 'BSE',
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return { matchedLots, remainingPurchases };
  }

  /**
   * Generates Comprehensive Realized Capital Gains Summary with Budget 2024 Annual Exemption.
   * Applies the INR 1,25,000 exemption across all Equity LTCG in that financial year!
   */
  public static generateRealizedTaxReport(
    financialYear: string,
    investorPan: string,
    clientCode: string,
    uccId: string,
    matchedLots: MatchedFifoLot[]
  ): CapitalGainsSummary {
    let totalRealizedSales = 0;
    let totalPurchaseCost = 0;
    let totalGrossGain = 0;

    let equityStcgGain = 0;
    let equityLtcgGain = 0;
    let debtSpecifiedStcg = 0;
    let debtLegacyLtcg = 0;

    for (const lot of matchedLots) {
      totalRealizedSales += lot.saleValue;
      totalPurchaseCost += lot.purchaseCost;
      totalGrossGain += lot.grossGain;

      if (lot.isSec50aaDebt) {
        debtSpecifiedStcg += Math.max(0, lot.taxableGain);
      } else if (lot.gainType === 'STCG' && lot.taxRatePct >= 15) {
        equityStcgGain += Math.max(0, lot.taxableGain);
      } else if (lot.gainType === 'LTCG' && lot.taxRatePct <= 12.5) {
        equityLtcgGain += Math.max(0, lot.taxableGain);
      } else if (lot.gainType === 'LTCG') {
        debtLegacyLtcg += Math.max(0, lot.taxableGain);
      }
    }

    // Determine Applicable Exemption Limit for Financial Year
    // FY 2024-2025 onwards: ₹1,25,000; Prior: ₹1,00,000
    const startYear = parseInt(financialYear.split('-')[0], 10);
    const exemptionLimit = startYear >= 2024 
      ? this.LTCG_EXEMPTION_POST_BUDGET_2024 
      : this.LTCG_EXEMPTION_PRE_BUDGET_2024;

    const equityLtcgExemptionApplied = Math.min(equityLtcgGain, exemptionLimit);
    const netTaxableEquityLtcg = Math.max(0, equityLtcgGain - equityLtcgExemptionApplied);

    // Rate calculations
    const equityStcgRate = startYear >= 2024 ? 20.0 : 15.0;
    const equityLtcgRate = startYear >= 2024 ? 12.5 : 10.0;

    const equityStcgTax = Math.round((equityStcgGain * (equityStcgRate / 100)) * 100) / 100;
    const equityLtcgTax = Math.round((netTaxableEquityLtcg * (equityLtcgRate / 100)) * 100) / 100;
    const debtLegacyLtcgTax = Math.round((debtLegacyLtcg * 0.125) * 100) / 100;
    const debtSpecifiedTax = Math.round((debtSpecifiedStcg * (this.DEFAULT_SLAB_RATE_PCT / 100)) * 100) / 100;

    const totalBaseTax = Math.round((equityStcgTax + equityLtcgTax + debtLegacyLtcgTax + debtSpecifiedTax) * 100) / 100;
    const totalCess = Math.round((totalBaseTax * this.CESS_RATE) * 100) / 100;
    const totalTaxLiability = Math.round((totalBaseTax + totalCess) * 100) / 100;

    return {
      financial_year: financialYear,
      investor_pan: investorPan,
      ucc_id: uccId,
      client_code: clientCode,
      budget_regime: startYear >= 2024 ? 'BUDGET_2024' : 'PRE_BUDGET_2024',
      total_realized_sales: Math.round(totalRealizedSales * 100) / 100,
      total_purchase_cost: Math.round(totalPurchaseCost * 100) / 100,
      total_gross_gain: Math.round(totalGrossGain * 100) / 100,
      equity_stcg: {
        total_gain: Math.round(equityStcgGain * 100) / 100,
        tax_rate_pct: equityStcgRate,
        tax_payable: equityStcgTax
      },
      equity_ltcg: {
        total_gain: Math.round(equityLtcgGain * 100) / 100,
        exemption_applied: Math.round(equityLtcgExemptionApplied * 100) / 100,
        net_taxable_gain: Math.round(netTaxableEquityLtcg * 100) / 100,
        tax_rate_pct: equityLtcgRate,
        tax_payable: equityLtcgTax
      },
      debt_specified_stcg: {
        total_gain: Math.round(debtSpecifiedStcg * 100) / 100,
        tax_note: `Taxed under Section 50AA at investor's marginal slab rate (indicative ${this.DEFAULT_SLAB_RATE_PCT}%)`,
        estimated_slab_tax: debtSpecifiedTax
      },
      debt_legacy_ltcg: {
        total_gain: Math.round(debtLegacyLtcg * 100) / 100,
        tax_rate_pct: 12.5,
        tax_payable: debtLegacyLtcgTax
      },
      total_base_tax: totalBaseTax,
      total_cess_4pct: totalCess,
      total_tax_liability: totalTaxLiability,
      records: matchedLots
    };
  }

  /**
   * Evaluates Unrealized Capital Gains for remaining active lots.
   * Assesses tax-loss harvesting and remaining ₹1.25L exemption utilization.
   */
  public static evaluateUnrealizedGains(
    investorPan: string,
    clientCode: string,
    uccId: string,
    remainingPurchases: PortfolioTransaction[],
    navMap: Map<string, number>, // scheme_code -> current NAV
    asOfDateStr = new Date().toISOString().split('T')[0]
  ): UnrealizedGainsSummary {
    const lots: UnrealizedGainLot[] = [];
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedGain = 0;
    let unrealizedEquityStcg = 0;
    let unrealizedEquityLtcg = 0;
    let taxLossHarvestingOpportunity = 0;

    for (const p of remainingPurchases) {
      const currentNav = navMap.get(p.scheme_code) || p.nav;
      const holdingDays = this.getDaysBetween(p.transaction_date, asOfDateStr);
      const units = p.available_units > 0 ? p.available_units : p.units;
      const investedCost = Math.round(units * p.nav * 100) / 100;
      const currentValue = Math.round(units * currentNav * 100) / 100;
      const gain = Math.round((currentValue - investedCost) * 100) / 100;

      const { gainType, isSec50aaDebt, taxRatePct } = this.classifyGain(
        p.asset_class,
        p.transaction_date,
        asOfDateStr,
        holdingDays
      );

      totalInvested += investedCost;
      totalCurrentValue += currentValue;
      totalUnrealizedGain += gain;

      if (gain < 0) {
        taxLossHarvestingOpportunity += Math.abs(gain);
      }

      if (p.asset_class === 'EQUITY') {
        if (gainType === 'STCG') {
          unrealizedEquityStcg += gain;
        } else {
          unrealizedEquityLtcg += gain;
        }
      }

      const estimatedTax = gain > 0 ? Math.round((gain * (taxRatePct / 100) * 1.04) * 100) / 100 : 0;

      lots.push({
        scheme_code: p.scheme_code,
        scheme_name: p.scheme_name,
        asset_class: p.asset_class,
        folio_number: p.folio_id || 'DEFAULT',
        units: Math.round(units * 10000) / 10000,
        purchase_date: p.transaction_date,
        purchase_nav: p.nav,
        invested_cost: investedCost,
        current_nav: currentNav,
        current_value: currentValue,
        holding_days: holdingDays,
        potential_gain_type: gainType,
        unrealized_gain: gain,
        is_grandfathered: !!p.fmv_31jan2018 && p.transaction_date <= this.GRANDFATHERING_DATE,
        is_sec_50aa_debt: isSec50aaDebt,
        indicative_tax_rate_pct: taxRatePct,
        estimated_tax_if_redeemed_today: estimatedTax
      });
    }

    const currentFy = this.getFinancialYear(asOfDateStr);
    const startYear = parseInt(currentFy.split('-')[0], 10);
    const maxExemption = startYear >= 2024 
      ? this.LTCG_EXEMPTION_POST_BUDGET_2024 
      : this.LTCG_EXEMPTION_PRE_BUDGET_2024;

    const remainingExemption = Math.max(0, maxExemption - Math.max(0, unrealizedEquityLtcg));

    return {
      as_of_date: asOfDateStr,
      investor_pan: investorPan,
      ucc_id: uccId,
      client_code: clientCode,
      total_invested: Math.round(totalInvested * 100) / 100,
      total_current_value: Math.round(totalCurrentValue * 100) / 100,
      total_unrealized_gain: Math.round(totalUnrealizedGain * 100) / 100,
      unrealized_equity_stcg: Math.round(unrealizedEquityStcg * 100) / 100,
      unrealized_equity_ltcg: Math.round(unrealizedEquityLtcg * 100) / 100,
      equity_ltcg_annual_exemption_remaining: Math.round(remainingExemption * 100) / 100,
      tax_loss_harvesting_opportunity: Math.round(taxLossHarvestingOpportunity * 100) / 100,
      lots
    };
  }
}

