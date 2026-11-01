/**
 * BSE StAR MF v2.0 - Master Scheme Catalog & NAV Type Definitions
 * 
 * Complies with BSE StAR MF v2 /master_scheme_list and /nav_master_list:
 * - Scheme BSE Code, ISIN, AMFI Code
 * - Cut-off timings for Liquid/Overnight vs. Equity/Debt
 * - Transaction mode permissions (Physical / Demat)
 * - Systematic features (SIP, STP, SWP, Switch)
 */

export type SchemePlan = 'Direct' | 'Regular';
export type SchemeOption = 'Growth' | 'IDCW Payout' | 'IDCW Reinvestment';
export type SchemeOfferStatus = 'NFO' | 'OPEN' | 'CLOSED';
export type SchemeOfferType = 'OPEN_ENDED' | 'CLOSED_ENDED' | 'INTERVAL' | 'NFO';

export interface MasterScheme {
  id?: string;
  schemeBseCode: string; // Unique primary key in BSE StAR MF
  schemeIsin: string;
  schemeAmfiCode?: string;
  schemeCpcCode?: string;

  name: string;
  parentSchemeCode?: string;
  parentSchemeName?: string;

  schemeAmcCode: string;
  schemeAmcName: string;
  schemeRtaCode: string;
  schemeRtaName: string;

  schemePlan: SchemePlan;
  schemeOption: SchemeOption;
  schemeOptionFrequency?: string;
  schemeCategory?: string;
  schemeSubCategory?: string;
  schemeInvestmentMode?: 'ACTIVE' | 'PASSIVE';
  schemeFaceValue?: number;

  schemeOfferStatus: SchemeOfferStatus;
  schemeOfferType: SchemeOfferType;
  schemeRedemptionSettlementDays: string; // 'T1', 'T2', etc.

  isPhysicalAllowed: boolean;
  isDematAllowed: boolean;

  isActive: boolean;
  sipFlag: boolean;
  stpInFlag: boolean;
  stpOutFlag: boolean;
  swpFlag: boolean;
  switchInFlag: boolean;
  switchOutFlag: boolean;

  // Cut-off timings
  cutoffTime: string; // e.g., '13:30:00' for Liquid/Overnight, '15:00:00' for Equity
  navSettlementType: string;

  // Purchase & Redemption Constraints
  minPurchaseAmount: number;
  minAdditionalAmount: number;
  purchaseAmountMultiplier: number;
  maxPurchaseAmount?: number;
  minRedemptionAmount?: number;
  minRedemptionUnits?: number;

  // Systematic Constraints
  minSipAmount?: number;
  sipAllowedFrequencies?: string[]; // ['d', 'w', 'm', 'q']
  sipAllowedDates?: number[];       // [1, 5, 10, 15, 20, 25]
  minInstallments?: number;
  maxInstallments?: number;

  lockinPeriodValue?: number;
  lockinPeriodUnit?: string;
}

export interface SchemeNavRecord {
  schemeBseCode: string;
  navValue: number;
  navDate: string; // YYYY-MM-DD
  repurchasePrice?: number;
  salePrice?: number;
}

