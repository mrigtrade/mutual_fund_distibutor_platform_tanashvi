/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Consolidated Account Statement (CAS) Ingestion & Normalization Engine
 * 
 * Supports CAMS & KFintech CAS formats (JSON payloads and structured CSV/text).
 * Automatically classifies transaction types, infers asset categories, and
 * prepares normalized Folio, Holding, and Transaction records for portfolio tracking.
 */

import { 
  AssetClass, 
  CasStatementPayload, 
  CasFolioPayload, 
  CasTransactionPayload,
  PortfolioTransaction, 
  PortfolioTransactionType,
  InvestorFolio,
  InvestorHolding
} from '../types/portfolio.js';

export interface ParsedCasResult {
  investor_pan: string;
  investor_name: string;
  investor_email?: string;
  statement_source: 'CAMS' | 'KFINTECH' | 'CDSL' | 'NSDL' | 'OTHER';
  statement_period_from?: string;
  statement_period_to?: string;
  folios: InvestorFolio[];
  holdings: InvestorHolding[];
  transactions: PortfolioTransaction[];
  total_folios_count: number;
  total_transactions_count: number;
}

export class CasParserService {

  /**
   * Infers asset class from mutual fund scheme name and subcategory.
   */
  public static inferAssetClass(schemeName: string): AssetClass {
    const s = schemeName.toLowerCase();
    
    // Liquid / Cash funds
    if (s.includes('liquid') || s.includes('overnight') || s.includes('cash fund') || s.includes('treasury')) {
      return 'LIQUID';
    }

    // Hybrid / Balanced / Arbitrage funds
    if (
      s.includes('hybrid') || 
      s.includes('balanced') || 
      s.includes('arbitrage') || 
      s.includes('multi asset') || 
      s.includes('dynamic asset') ||
      s.includes('equity savings')
    ) {
      return 'HYBRID';
    }

    // Debt / Fixed Income funds
    if (
      s.includes('debt') || 
      s.includes('gilt') || 
      s.includes('bond') || 
      s.includes('short term') || 
      s.includes('corporate') || 
      s.includes('money market') || 
      s.includes('banking & psu') ||
      s.includes('credit risk') ||
      s.includes('duration') ||
      s.includes('income fund')
    ) {
      return 'DEBT';
    }

    // Default to Equity (Flexi cap, large cap, mid cap, small cap, elss, index, thematic, etc.)
    return 'EQUITY';
  }

  /**
   * Normalizes raw transaction type strings from CAMS/KFintech statements to standard enum.
   */
  public static normalizeTransactionType(rawType: string, description?: string): PortfolioTransactionType {
    const text = `${rawType} ${description || ''}`.toUpperCase();

    if (text.includes('SIP') || text.includes('SYSTEMATIC INVESTMENT') || text.includes('PURCHASE - SIP')) {
      return 'SIP';
    }
    if (text.includes('SWP') || text.includes('SYSTEMATIC WITHDRAWAL')) {
      return 'SWP';
    }
    if (text.includes('STP IN') || text.includes('SYSTEMATIC TRANSFER IN')) {
      return 'STP_IN';
    }
    if (text.includes('STP OUT') || text.includes('SYSTEMATIC TRANSFER OUT')) {
      return 'STP_OUT';
    }
    if (text.includes('SWITCH IN') || text.includes('SWITCH-IN')) {
      return 'SWITCH_IN';
    }
    if (text.includes('SWITCH OUT') || text.includes('SWITCH-OUT')) {
      return 'SWITCH_OUT';
    }
    if (text.includes('DIVIDEND REINVEST') || text.includes('REINVESTMENT') || text.includes('IDCW REINVEST')) {
      return 'DIVIDEND_REINVESTMENT';
    }
    if (text.includes('DIVIDEND') || text.includes('IDCW')) {
      return 'DIVIDEND_PAYOUT';
    }
    if (text.includes('REDEMPTION') || text.includes('REDEEM')) {
      return 'REDEMPTION';
    }
    if (text.includes('ADDITIONAL') || text.includes('ADDL')) {
      return 'ADDITIONAL_PURCHASE';
    }
    return 'PURCHASE';
  }

  /**
   * Formats raw date string into standard ISO YYYY-MM-DD format.
   * Handles 'DD-MMM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'.
   */
  public static normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Check for DD-MMM-YYYY (e.g. 15-Jan-2024, 05-Nov-2023)
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const partsDash = dateStr.split('-');
    if (partsDash.length === 3 && isNaN(Number(partsDash[1]))) {
      const day = partsDash[0].padStart(2, '0');
      const mon = monthNames[partsDash[1].toLowerCase().substring(0, 3)] || '01';
      const year = partsDash[2].length === 2 ? `20${partsDash[2]}` : partsDash[2];
      return `${year}-${mon}-${day}`;
    }

    // Check for DD/MM/YYYY
    const partsSlash = dateStr.split('/');
    if (partsSlash.length === 3) {
      const day = partsSlash[0].padStart(2, '0');
      const mon = partsSlash[1].padStart(2, '0');
      const year = partsSlash[2].length === 2 ? `20${partsSlash[2]}` : partsSlash[2];
      return `${year}-${mon}-${day}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return dateStr;
  }

  /**
   * Ingests and parses a standard JSON CAS statement.
   */
  public static parseJsonCas(payload: CasStatementPayload, tenantId = '00000000-0000-0000-0000-000000000001', uccId = 'UCC-DEFAULT'): ParsedCasResult {
    const investorPan = (payload.investor_pan || '').trim().toUpperCase();
    const investorName = (payload.investor_name || 'Valued Investor').trim();
    const source = payload.statement_source || 'CAMS';

    const folios: InvestorFolio[] = [];
    const holdings: InvestorHolding[] = [];
    const transactions: PortfolioTransaction[] = [];

    const now = new Date().toISOString();

    for (let fIdx = 0; fIdx < (payload.folios || []).length; fIdx++) {
      const f = payload.folios[fIdx];
      const folioId = `FOLIO-${investorPan}-${fIdx + 1}`;
      const folioNumber = f.folio_number.trim();
      const amcName = f.amc_name.trim();
      const amcCode = f.amc_code || amcName.toUpperCase().replace(/\s+/g, '_').substring(0, 20);

      const folioRecord: InvestorFolio = {
        id: folioId,
        tenant_id: tenantId,
        ucc_id: uccId,
        folio_number: folioNumber,
        amc_code: amcCode,
        amc_name: amcName,
        rta_code: source,
        holding_nature: 'SI',
        pan: investorPan,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now
      };
      folios.push(folioRecord);

      for (let sIdx = 0; sIdx < (f.schemes || []).length; sIdx++) {
        const s = f.schemes[sIdx];
        const schemeCode = s.amfi_code || s.isin || `SCHEME-${fIdx + 1}-${sIdx + 1}`;
        const schemeName = s.scheme_name.trim();
        const assetClass = this.inferAssetClass(schemeName);

        let runningUnits = 0;
        let totalInvestedAmount = 0;
        let lastNav = 10;
        let lastDate = now.split('T')[0];

        for (let tIdx = 0; tIdx < (s.transactions || []).length; tIdx++) {
          const t = s.transactions[tIdx];
          const txDate = this.normalizeDate(t.date);
          const txType = this.normalizeTransactionType(t.type, t.description);
          const units = Number(t.units) || 0;
          const nav = Number(t.nav) || 0;
          const amount = Number(t.amount) || Math.round(units * nav * 100) / 100;

          if (nav > 0) lastNav = nav;
          lastDate = txDate;

          const isPurchase = txType === 'PURCHASE' || 
                             txType === 'ADDITIONAL_PURCHASE' || 
                             txType === 'SIP' || 
                             txType === 'SWITCH_IN' || 
                             txType === 'STP_IN' || 
                             txType === 'DIVIDEND_REINVESTMENT';

          const isRedemption = txType === 'REDEMPTION' || 
                               txType === 'SWITCH_OUT' || 
                               txType === 'STP_OUT' || 
                               txType === 'SWP';

          if (isPurchase) {
            runningUnits += Math.abs(units);
            totalInvestedAmount += Math.abs(amount);
          } else if (isRedemption) {
            runningUnits -= Math.abs(units);
            // Pro-rate invested amount reduction
            const costReduction = runningUnits > 0 ? (Math.abs(units) / (runningUnits + Math.abs(units))) * totalInvestedAmount : totalInvestedAmount;
            totalInvestedAmount = Math.max(0, totalInvestedAmount - costReduction);
          }

          const txId = `TX-${investorPan}-${fIdx + 1}-${sIdx + 1}-${tIdx + 1}`;

          transactions.push({
            id: txId,
            tenant_id: tenantId,
            ucc_id: uccId,
            folio_id: folioId,
            scheme_code: schemeCode,
            scheme_name: schemeName,
            isin: s.isin,
            asset_class: assetClass,
            transaction_date: txDate,
            transaction_type: txType,
            units: Math.abs(units),
            nav: nav,
            amount: Math.abs(amount),
            available_units: isPurchase ? Math.abs(units) : 0,
            fmv_31jan2018: (txDate <= '2018-01-31') ? (nav * 1.15) : undefined, // Estimated seed FMV for grandfathering testing
            source: 'CAS_IMPORT',
            created_at: now
          });
        }

        const currentVal = Math.round(runningUnits * lastNav * 100) / 100;
        const unrealGain = Math.round((currentVal - totalInvestedAmount) * 100) / 100;
        const absReturn = totalInvestedAmount > 0 ? Math.round(((unrealGain / totalInvestedAmount) * 100) * 100) / 100 : 0;

        holdings.push({
          id: `HOLDING-${folioId}-${schemeCode}`,
          tenant_id: tenantId,
          ucc_id: uccId,
          folio_id: folioId,
          folio_number: folioNumber,
          scheme_code: schemeCode,
          scheme_name: schemeName,
          isin: s.isin,
          amfi_code: s.amfi_code,
          asset_class: assetClass,
          total_units: Math.round(runningUnits * 10000) / 10000,
          average_purchase_nav: runningUnits > 0 ? Math.round((totalInvestedAmount / runningUnits) * 10000) / 10000 : 0,
          invested_cost: Math.round(totalInvestedAmount * 100) / 100,
          latest_nav: lastNav,
          latest_nav_date: lastDate,
          current_valuation: currentVal,
          unrealized_gain: unrealGain,
          absolute_return_pct: absReturn,
          last_synced_at: now
        });
      }
    }

    return {
      investor_pan: investorPan,
      investor_name: investorName,
      investor_email: payload.investor_email,
      statement_source: source,
      statement_period_from: payload.statement_period_from,
      statement_period_to: payload.statement_period_to,
      folios,
      holdings,
      transactions,
      total_folios_count: folios.length,
      total_transactions_count: transactions.length
    };
  }

  /**
   * Ingests a structured CSV export of transactions.
   * Format: FolioNumber,AMC,SchemeName,ISIN,Date,Type,Units,NAV,Amount
   */
  public static parseCsvCas(
    csvContent: string, 
    investorPan: string, 
    investorName: string,
    tenantId = '00000000-0000-0000-0000-000000000001',
    uccId = 'UCC-DEFAULT'
  ): ParsedCasResult {
    const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      return {
        investor_pan: investorPan,
        investor_name: investorName,
        statement_source: 'CAMS',
        folios: [],
        holdings: [],
        transactions: [],
        total_folios_count: 0,
        total_transactions_count: 0
      };
    }

    // Skip header line
    const dataLines = lines.slice(1);
    const folioMap = new Map<string, CasFolioPayload>();

    for (const line of dataLines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 7) continue;

      const [folioNumber, amcName, schemeName, isin, dateStr, typeStr, unitsStr, navStr, amountStr] = parts;

      if (!folioMap.has(folioNumber)) {
        folioMap.set(folioNumber, {
          folio_number: folioNumber,
          amc_name: amcName || 'Mutual Fund',
          pan: investorPan,
          schemes: []
        });
      }

      const folio = folioMap.get(folioNumber)!;
      let scheme = folio.schemes.find(s => s.scheme_name === schemeName);
      if (!scheme) {
        scheme = {
          scheme_name: schemeName,
          isin: isin || undefined,
          transactions: []
        };
        folio.schemes.push(scheme);
      }

      scheme.transactions.push({
        date: dateStr,
        type: typeStr,
        units: parseFloat(unitsStr) || 0,
        nav: parseFloat(navStr) || 0,
        amount: parseFloat(amountStr) || (parseFloat(unitsStr) * parseFloat(navStr))
      });
    }

    const payload: CasStatementPayload = {
      investor_pan: investorPan,
      investor_name: investorName,
      statement_source: 'CAMS',
      folios: Array.from(folioMap.values())
    };

    return this.parseJsonCas(payload, tenantId, uccId);
  }
}

