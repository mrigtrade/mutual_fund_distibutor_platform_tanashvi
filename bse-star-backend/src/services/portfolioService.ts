/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Portfolio Aggregation, Valuation & Performance Engine
 * 
 * Manages investor holdings, folios, and transaction ledgers.
 * Integrates AmfiNavService for real-time NAV valuation, XirrCalculator for
 * money-weighted returns, and CapitalGainsService for Budget 2024 tax computations.
 * Enshrines Zero Live Dependency with auto-seeded test fixtures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  InvestorFolio, 
  InvestorHolding, 
  PortfolioTransaction, 
  PortfolioSummary, 
  AssetAllocationSummary,
  CapitalGainsSummary,
  UnrealizedGainsSummary,
  CasStatementPayload
} from '../types/portfolio.js';
import { AmfiNavService } from './amfiNavService.js';
import { XirrCalculator, CashFlow } from './xirrCalculator.js';
import { CapitalGainsService } from './capitalGainsService.js';
import { CasParserService, ParsedCasResult } from './casParserService.js';

export class PortfolioService {
  private static instance: PortfolioService;

  // In-memory repositories keyed by `${tenant_id}:${client_code}`
  private foliosMap = new Map<string, InvestorFolio[]>();
  private holdingsMap = new Map<string, InvestorHolding[]>();
  private transactionsMap = new Map<string, PortfolioTransaction[]>();
  private investorMetaMap = new Map<string, { pan: string; name: string; email?: string }>();

  private amfiNavService: AmfiNavService;

  private constructor() {
    this.amfiNavService = AmfiNavService.getInstance();
    this.seedDefaultPortfolio();
  }

  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  /**
   * Seeds default portfolio data (e.g. Ramesh Sharma) for offline mock testing.
   */
  private seedDefaultPortfolio(): void {
    try {
      let fixturePath = path.resolve('src/fixtures/ramesh_portfolio_sample.json');
      if (!fs.existsSync(fixturePath)) {
        fixturePath = path.join(__dirname, '..', 'fixtures', 'ramesh_portfolio_sample.json');
      }

      if (fs.existsSync(fixturePath)) {
        const raw = fs.readFileSync(fixturePath, 'utf-8');
        const payload: CasStatementPayload & { client_code?: string } = JSON.parse(raw);
        const tenantId = '00000000-0000-0000-0000-000000000001';
        const clientCode = payload.client_code || 'UCC-RAMESH-001';

        this.importCasStatement(tenantId, clientCode, payload);
      }
    } catch (err) {
      console.warn('⚠️ PortfolioService: Failed to seed default fixture, continuing with empty store.', err);
    }
  }

  private getKey(tenantId: string, clientCode: string): string {
    return `${tenantId}:${clientCode.trim().toUpperCase()}`;
  }

  /**
   * Ingests a CAS statement and initializes/updates folios, holdings, and transactions.
   */
  public async importCasStatement(
    tenantId: string,
    clientCode: string,
    payload: CasStatementPayload
  ): Promise<ParsedCasResult> {
    const key = this.getKey(tenantId, clientCode);
    const parsed = CasParserService.parseJsonCas(payload, tenantId, clientCode);

    this.investorMetaMap.set(key, {
      pan: parsed.investor_pan,
      name: parsed.investor_name,
      email: parsed.investor_email
    });

    this.foliosMap.set(key, parsed.folios);
    this.holdingsMap.set(key, parsed.holdings);
    this.transactionsMap.set(key, parsed.transactions);

    return parsed;
  }

  /**
   * Retrieves all folios for an investor.
   */
  public async getFolios(tenantId: string, clientCode: string): Promise<InvestorFolio[]> {
    const key = this.getKey(tenantId, clientCode);
    return this.foliosMap.get(key) || [];
  }

  /**
   * Retrieves all historical transactions for an investor.
   */
  public async getTransactions(tenantId: string, clientCode: string): Promise<PortfolioTransaction[]> {
    const key = this.getKey(tenantId, clientCode);
    return this.transactionsMap.get(key) || [];
  }

  /**
   * Retrieves aggregated holdings with real-time NAV valuation and XIRR.
   */
  public async getHoldings(tenantId: string, clientCode: string): Promise<InvestorHolding[]> {
    const key = this.getKey(tenantId, clientCode);
    const holdings = this.holdingsMap.get(key) || [];
    const transactions = this.transactionsMap.get(key) || [];

    // Ensure AMFI NAV catalog is synchronized
    await this.amfiNavService.syncSchemes();

    const todayStr = new Date().toISOString().split('T')[0];

    // Refresh valuation and XIRR for each holding
    for (const h of holdings) {
      // Look up latest NAV by AMFI code, ISIN, or scheme name
      let latestNav = h.latest_nav;
      let navDate = h.latest_nav_date || todayStr;

      if (h.amfi_code) {
        const item = this.amfiNavService.getScheme(h.amfi_code);
        if (item) {
          latestNav = item.nav;
          navDate = item.navDate;
        }
      } else if (h.isin) {
        const item = this.amfiNavService.getScheme(h.isin);
        if (item) {
          latestNav = item.nav;
          navDate = item.navDate;
        }
      }

      h.latest_nav = latestNav;
      h.latest_nav_date = navDate;
      h.current_valuation = Math.round(h.total_units * latestNav * 100) / 100;
      h.unrealized_gain = Math.round((h.current_valuation - h.invested_cost) * 100) / 100;
      h.absolute_return_pct = h.invested_cost > 0
        ? Math.round(((h.unrealized_gain / h.invested_cost) * 100) * 100) / 100
        : 0;

      // Scheme-level XIRR calculation
      const schemeTx = transactions.filter(t => t.scheme_code === h.scheme_code);
      if (schemeTx.length > 0 && h.current_valuation > 0) {
        const cashflows: CashFlow[] = schemeTx.map(t => {
          const isPurchase = t.transaction_type === 'PURCHASE' || 
                             t.transaction_type === 'ADDITIONAL_PURCHASE' || 
                             t.transaction_type === 'SIP' || 
                             t.transaction_type === 'SWITCH_IN' || 
                             t.transaction_type === 'STP_IN';
          return {
            date: t.transaction_date,
            amount: isPurchase ? -Math.abs(t.amount) : Math.abs(t.amount)
          };
        });

        // Add terminal current valuation as positive cashflow
        cashflows.push({
          date: navDate,
          amount: h.current_valuation
        });

        h.xirr_pct = XirrCalculator.calculate(cashflows);
      }
    }

    return holdings;
  }

  /**
   * Generates Comprehensive Portfolio Summary (Valuation, Asset Allocation & Portfolio XIRR).
   */
  public async getPortfolioSummary(
    tenantId: string, 
    clientCode: string, 
    valuationDateStr?: string
  ): Promise<PortfolioSummary> {
    const key = this.getKey(tenantId, clientCode);
    const meta = this.investorMetaMap.get(key) || { pan: 'AAAPS1234K', name: 'Ramesh Sharma' };
    const folios = this.foliosMap.get(key) || [];
    const holdings = await this.getHoldings(tenantId, clientCode);
    const transactions = this.transactionsMap.get(key) || [];

    const valuationDate = valuationDateStr || new Date().toISOString().split('T')[0];

    let totalInvested = 0;
    let totalCurrentValue = 0;

    let equityValue = 0;
    let debtValue = 0;
    let hybridValue = 0;
    let liquidValue = 0;
    let otherValue = 0;

    for (const h of holdings) {
      totalInvested += h.invested_cost;
      totalCurrentValue += h.current_valuation;

      switch (h.asset_class) {
        case 'EQUITY': equityValue += h.current_valuation; break;
        case 'DEBT': debtValue += h.current_valuation; break;
        case 'HYBRID': hybridValue += h.current_valuation; break;
        case 'LIQUID': liquidValue += h.current_valuation; break;
        default: otherValue += h.current_valuation; break;
      }
    }

    const totalGain = Math.round((totalCurrentValue - totalInvested) * 100) / 100;
    const absReturn = totalInvested > 0
      ? Math.round(((totalGain / totalInvested) * 100) * 100) / 100
      : 0;

    // Asset allocation percentages
    const denom = totalCurrentValue > 0 ? totalCurrentValue : 1;
    const assetAllocation: AssetAllocationSummary = {
      equity_value: Math.round(equityValue * 100) / 100,
      equity_pct: Math.round(((equityValue / denom) * 100) * 100) / 100,
      debt_value: Math.round(debtValue * 100) / 100,
      debt_pct: Math.round(((debtValue / denom) * 100) * 100) / 100,
      hybrid_value: Math.round(hybridValue * 100) / 100,
      hybrid_pct: Math.round(((hybridValue / denom) * 100) * 100) / 100,
      liquid_value: Math.round(liquidValue * 100) / 100,
      liquid_pct: Math.round(((liquidValue / denom) * 100) * 100) / 100,
      other_value: Math.round(otherValue * 100) / 100,
      other_pct: Math.round(((otherValue / denom) * 100) * 100) / 100,
    };

    // Calculate Whole-Portfolio XIRR across all historical cashflows
    const allCashflows: CashFlow[] = transactions.map(t => {
      const isPurchase = t.transaction_type === 'PURCHASE' || 
                         t.transaction_type === 'ADDITIONAL_PURCHASE' || 
                         t.transaction_type === 'SIP' || 
                         t.transaction_type === 'SWITCH_IN' || 
                         t.transaction_type === 'STP_IN';
      return {
        date: t.transaction_date,
        amount: isPurchase ? -Math.abs(t.amount) : Math.abs(t.amount)
      };
    });

    if (totalCurrentValue > 0) {
      allCashflows.push({
        date: valuationDate,
        amount: totalCurrentValue
      });
    }

    const portfolioXirr = XirrCalculator.calculate(allCashflows);

    return {
      client_code: clientCode,
      investor_name: meta.name,
      investor_pan: meta.pan,
      valuation_date: valuationDate,
      total_invested: Math.round(totalInvested * 100) / 100,
      total_current_value: Math.round(totalCurrentValue * 100) / 100,
      total_gain: totalGain,
      absolute_return_pct: absReturn,
      portfolio_xirr_pct: portfolioXirr,
      total_folios: folios.length,
      total_schemes: holdings.length,
      asset_allocation: assetAllocation,
      holdings
    };
  }

  /**
   * Generates Realized Capital Gains Report (AdvisorKhoj Feature).
   * Exact Budget 2024 calculation for a given financial year.
   */
  public async getRealizedCapitalGains(
    tenantId: string,
    clientCode: string,
    financialYear: string
  ): Promise<CapitalGainsSummary> {
    const key = this.getKey(tenantId, clientCode);
    const meta = this.investorMetaMap.get(key) || { pan: 'AAAPS1234K', name: 'Ramesh Sharma' };
    const transactions = this.transactionsMap.get(key) || [];

    // Run FIFO Matching
    const { matchedLots } = CapitalGainsService.matchFifoLots(transactions, financialYear);

    return CapitalGainsService.generateRealizedTaxReport(
      financialYear,
      meta.pan,
      clientCode,
      clientCode,
      matchedLots
    );
  }

  /**
   * Generates Unrealized Capital Gains Report.
   */
  public async getUnrealizedCapitalGains(
    tenantId: string,
    clientCode: string,
    asOfDateStr?: string
  ): Promise<UnrealizedGainsSummary> {
    const key = this.getKey(tenantId, clientCode);
    const meta = this.investorMetaMap.get(key) || { pan: 'AAAPS1234K', name: 'Ramesh Sharma' };
    const transactions = this.transactionsMap.get(key) || [];

    // Ensure NAVs are fresh
    await this.amfiNavService.syncSchemes();

    const { remainingPurchases } = CapitalGainsService.matchFifoLots(transactions);

    const navMap = new Map<string, number>();
    for (const p of remainingPurchases) {
      if (!navMap.has(p.scheme_code)) {
        const item = this.amfiNavService.getScheme(p.scheme_code) || 
                     (p.isin ? this.amfiNavService.getScheme(p.isin) : undefined);
        navMap.set(p.scheme_code, item ? item.nav : p.nav);
      }
    }

    return CapitalGainsService.evaluateUnrealizedGains(
      meta.pan,
      clientCode,
      clientCode,
      remainingPurchases,
      navMap,
      asOfDateStr
    );
  }
}
