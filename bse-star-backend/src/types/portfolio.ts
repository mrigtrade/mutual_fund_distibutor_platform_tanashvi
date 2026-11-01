/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Portfolio & Capital Gains Type Definitions
 * 
 * Enshrines SEBI Regulations & Union Budget 2024 Income Tax Rules.
 */

export type AssetClass = 'EQUITY' | 'DEBT' | 'HYBRID' | 'LIQUID' | 'OTHER';

export type PortfolioTransactionType = 
  | 'PURCHASE' 
  | 'ADDITIONAL_PURCHASE' 
  | 'SIP' 
  | 'REDEMPTION' 
  | 'SWITCH_IN' 
  | 'SWITCH_OUT' 
  | 'DIVIDEND_PAYOUT' 
  | 'DIVIDEND_REINVESTMENT' 
  | 'STP_IN' 
  | 'STP_OUT' 
  | 'SWP';

export interface InvestorFolio {
  id: string;
  tenant_id: string;
  ucc_id: string;
  folio_number: string;
  amc_code: string;
  amc_name: string;
  rta_code: 'CAMS' | 'KFINTECH' | 'CDSL' | 'NSDL' | 'FRANKLIN' | 'OTHER';
  holding_nature: 'SI' | 'JO' | 'AS';
  pan: string;
  status: 'ACTIVE' | 'CLOSED' | 'DORMANT';
  created_at: string;
  updated_at: string;
}

export interface InvestorHolding {
  id: string;
  tenant_id: string;
  ucc_id: string;
  folio_id: string;
  folio_number: string;
  scheme_code: string;
  scheme_name: string;
  isin?: string;
  amfi_code?: string;
  asset_class: AssetClass;
  sub_category?: string;
  total_units: number;
  average_purchase_nav: number;
  invested_cost: number;
  latest_nav: number;
  latest_nav_date?: string;
  current_valuation: number;
  unrealized_gain: number;
  absolute_return_pct: number;
  xirr_pct?: number;
  last_synced_at: string;
}

export interface PortfolioTransaction {
  id: string;
  tenant_id: string;
  ucc_id: string;
  folio_id: string;
  holding_id?: string;
  scheme_code: string;
  scheme_name: string;
  isin?: string;
  asset_class: AssetClass;
  transaction_date: string; // YYYY-MM-DD
  transaction_type: PortfolioTransactionType;
  units: number;
  nav: number;
  amount: number;
  stamp_duty?: number;
  stt?: number;
  available_units: number; // For FIFO tracking
  fmv_31jan2018?: number; // Pre-2018 grandfathering
  bse_order_no?: string;
  cas_reference_no?: string;
  source: 'BSE' | 'CAS_IMPORT' | 'MANUAL';
  created_at: string;
}

export interface MatchedFifoLot {
  purchaseTxId: string;
  purchaseDate: string;
  purchaseNav: number;
  unitsMatched: number;
  purchaseCost: number;
  saleDate: string;
  saleNav: number;
  saleValue: number;
  holdingDays: number;
  gainType: 'STCG' | 'LTCG';
  grossGain: number;
  isGrandfathered: boolean;
  fmv31Jan2018?: number;
  grandfatheredCost?: number;
  isSec50aaDebt: boolean;
  taxableGain: number;
  taxRatePct: number;
  baseTax: number;
  cessAmount: number;
  totalTax: number;
  budgetRegime: 'BUDGET_2024' | 'PRE_BUDGET_2024';
}

export interface CapitalGainsRealizedRecord {
  id: string;
  tenant_id: string;
  ucc_id: string;
  folio_id: string;
  redemption_tx_id: string;
  purchase_tx_id: string;
  financial_year: string;
  scheme_code: string;
  scheme_name: string;
  isin?: string;
  asset_class: AssetClass;
  units_matched: number;
  purchase_date: string;
  purchase_nav: number;
  purchase_cost: number;
  sale_date: string;
  sale_nav: number;
  sale_value: number;
  holding_days: number;
  gain_type: 'STCG' | 'LTCG';
  gross_gain: number;
  is_grandfathered: boolean;
  fmv_31jan2018?: number;
  grandfathered_cost?: number;
  is_sec_50aa_debt: boolean;
  taxable_gain: number;
  applicable_tax_rate_pct: number;
  base_tax: number;
  cess_amount: number;
  total_tax: number;
  budget_regime: 'BUDGET_2024' | 'PRE_BUDGET_2024';
  created_at: string;
}

export interface CapitalGainsSummary {
  financial_year: string;
  investor_pan: string;
  ucc_id: string;
  client_code: string;
  budget_regime: string;
  total_realized_sales: number;
  total_purchase_cost: number;
  total_gross_gain: number;
  
  // Equity Breakdown
  equity_stcg: {
    total_gain: number;
    tax_rate_pct: number; // 20% post Budget 2024
    tax_payable: number;
  };
  equity_ltcg: {
    total_gain: number;
    exemption_applied: number; // ₹1,25,000 for FY24-25+
    net_taxable_gain: number;
    tax_rate_pct: number; // 12.5% post Budget 2024
    tax_payable: number;
  };
  
  // Debt & Other Breakdown
  debt_specified_stcg: {
    total_gain: number; // Under Sec 50AA (acquired on/after 01-Apr-2023)
    tax_note: string; // Taxed at marginal income slab rate
    estimated_slab_tax: number;
  };
  debt_legacy_ltcg: {
    total_gain: number;
    tax_rate_pct: number; // 12.5% without indexation
    tax_payable: number;
  };
  
  total_base_tax: number;
  total_cess_4pct: number;
  total_tax_liability: number;
  records: MatchedFifoLot[];
}

export interface UnrealizedGainLot {
  scheme_code: string;
  scheme_name: string;
  asset_class: AssetClass;
  folio_number: string;
  units: number;
  purchase_date: string;
  purchase_nav: number;
  invested_cost: number;
  current_nav: number;
  current_value: number;
  holding_days: number;
  potential_gain_type: 'STCG' | 'LTCG';
  unrealized_gain: number;
  is_grandfathered: boolean;
  is_sec_50aa_debt: boolean;
  indicative_tax_rate_pct: number;
  estimated_tax_if_redeemed_today: number;
}

export interface UnrealizedGainsSummary {
  as_of_date: string;
  investor_pan: string;
  ucc_id: string;
  client_code: string;
  total_invested: number;
  total_current_value: number;
  total_unrealized_gain: number;
  unrealized_equity_stcg: number;
  unrealized_equity_ltcg: number;
  equity_ltcg_annual_exemption_remaining: number; // Out of ₹1,25,000
  tax_loss_harvesting_opportunity: number;
  lots: UnrealizedGainLot[];
}

export interface AssetAllocationSummary {
  equity_value: number;
  equity_pct: number;
  debt_value: number;
  debt_pct: number;
  hybrid_value: number;
  hybrid_pct: number;
  liquid_value: number;
  liquid_pct: number;
  other_value: number;
  other_pct: number;
}

export interface PortfolioSummary {
  client_code: string;
  investor_name: string;
  investor_pan: string;
  valuation_date: string;
  total_invested: number;
  total_current_value: number;
  total_gain: number;
  absolute_return_pct: number;
  portfolio_xirr_pct: number;
  total_folios: number;
  total_schemes: number;
  asset_allocation: AssetAllocationSummary;
  holdings: InvestorHolding[];
}

// CAS (Consolidated Account Statement) Structure
export interface CasTransactionPayload {
  date: string; // YYYY-MM-DD
  type: PortfolioTransactionType | string;
  description?: string;
  amount: number;
  units: number;
  nav: number;
  balance_units?: number;
}

export interface CasSchemePayload {
  scheme_name: string;
  isin?: string;
  amfi_code?: string;
  advisor?: string;
  transactions: CasTransactionPayload[];
}

export interface CasFolioPayload {
  folio_number: string;
  amc_name: string;
  amc_code?: string;
  pan: string;
  schemes: CasSchemePayload[];
}

export interface CasStatementPayload {
  investor_pan: string;
  investor_name: string;
  investor_email?: string;
  statement_period_from?: string;
  statement_period_to?: string;
  statement_source?: 'CAMS' | 'KFINTECH' | 'CDSL' | 'NSDL' | 'OTHER';
  folios: CasFolioPayload[];
}
