/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Mutual Fund Research Data Engine & Seed Fixtures
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 * Provides 7+ years of daily NAV time-series (2019 - 2026) for major flagship schemes
 * and the Nifty 50 TRI benchmark, alongside granular top stock holdings and sector exposures.
 */

import { HistoricalNavPoint, SchemeHolding, SchemeComparisonItem } from '../types/research.js';

export class ResearchDataService {
  private static instance: ResearchDataService;

  // Cache of generated/loaded daily historical NAV points
  private navHistoryMap: Map<string, HistoricalNavPoint[]> = new Map();
  // Benchmark NAV points (NIFTY 50 TRI)
  private benchmarkNavs: HistoricalNavPoint[] = [];

  // Scheme Holdings Database
  private holdingsMap: Map<string, SchemeHolding[]> = new Map();

  // Research Metadata Profiles
  private schemeProfiles: Map<string, SchemeComparisonItem> = new Map();

  private constructor() {
    this.initializeBenchmark();
    this.initializeFlagshipSchemes();
    this.initializeHoldings();
  }

  public static getInstance(): ResearchDataService {
    if (!ResearchDataService.instance) {
      ResearchDataService.instance = new ResearchDataService();
    }
    return ResearchDataService.instance;
  }

  /**
   * Generates benchmark series (NIFTY 50 TRI)
   */
  private initializeBenchmark(): void {
    const points: HistoricalNavPoint[] = [];
    const startDate = new Date('2019-01-01');
    const endDate = new Date('2026-10-30');

    let currentNav = 15200;
    const annualCagr = 0.145; // ~14.5% Nifty TRI CAGR
    const volatilityAnnual = 0.155; // ~15.5% Nifty TRI Volatility
    const dailyDrift = annualCagr / 252;
    const dailyVol = volatilityAnnual / Math.sqrt(252);

    let currentDate = new Date(startDate);
    let dayIndex = 0;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        const u1 = (Math.sin(dayIndex * 12.9898) * 43758.5453) % 1;
        const u2 = (Math.cos(dayIndex * 78.233) * 43758.5453) % 1;
        const posU1 = Math.abs(u1);
        const z0 = Math.sqrt(-2.0 * Math.log(posU1 > 0 ? posU1 : 0.0001)) * Math.cos(2.0 * Math.PI * Math.abs(u2));

        let shock = 0;
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dateStr >= '2020-02-20' && dateStr <= '2020-03-25') {
          shock = -0.015; // Covid crash shock
        } else if (dateStr >= '2020-04-01' && dateStr <= '2020-11-30') {
          shock = 0.0035; // Post-covid rally
        }

        const dailyReturn = dailyDrift + (z0 * dailyVol) + shock;
        currentNav = currentNav * (1 + dailyReturn);
        if (currentNav < 100) currentNav = 100;

        points.push({
          date: dateStr,
          nav: Number(currentNav.toFixed(4))
        });
        dayIndex++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    this.benchmarkNavs = points;
  }

  /**
   * Generates realistic mutual fund NAV trajectory using CAPM factor modeling:
   * r_scheme(t) = (alpha / 252) + beta * r_benchmark(t) + epsilon_idiosyncratic
   */
  private generateSchemeSeries(
    startNav: number,
    targetAlphaAnnual: number,
    targetBeta: number,
    idiosyncraticVolAnnual: number,
    seedOffset: number
  ): HistoricalNavPoint[] {
    const points: HistoricalNavPoint[] = [];
    let currentNav = startNav;
    const dailyAlpha = targetAlphaAnnual / 252;
    const dailyIdioVol = idiosyncraticVolAnnual / Math.sqrt(252);

    for (let i = 0; i < this.benchmarkNavs.length; i++) {
      const benchPoint = this.benchmarkNavs[i];
      let benchReturn = 0;
      if (i > 0) {
        benchReturn = (benchPoint.nav - this.benchmarkNavs[i - 1].nav) / this.benchmarkNavs[i - 1].nav;
      }

      // Idiosyncratic risk
      const u1 = (Math.sin((i + seedOffset) * 17.135) * 43758.5453) % 1;
      const u2 = (Math.cos((i + seedOffset) * 91.421) * 43758.5453) % 1;
      const posU1 = Math.abs(u1);
      const z0 = Math.sqrt(-2.0 * Math.log(posU1 > 0 ? posU1 : 0.0001)) * Math.cos(2.0 * Math.PI * Math.abs(u2));

      const dailySchemeReturn = dailyAlpha + (targetBeta * benchReturn) + (z0 * dailyIdioVol);
      currentNav = currentNav * (1 + dailySchemeReturn);
      if (currentNav < 1) currentNav = 1;

      points.push({
        date: benchPoint.date,
        nav: Number(currentNav.toFixed(4))
      });
    }

    return points;
  }

  private initializeFlagshipSchemes(): void {
    // 1. 122639: Parag Parikh Flexi Cap Fund - Growth
    // Historic high-performer: +5.5% annual alpha, low beta 0.76 (holds cash/US equities), low idiosyncratic vol
    const ppfasNavs = this.generateSchemeSeries(24.50, 0.055, 0.76, 0.065, 202);
    this.navHistoryMap.set('122639', ppfasNavs);

    // 2. 119551: HDFC Top 100 Fund - Growth
    // Large cap index hugger: +1.2% alpha, beta 0.98, low idio vol
    const hdfcTopNavs = this.generateSchemeSeries(475.20, 0.012, 0.98, 0.045, 303);
    this.navHistoryMap.set('119551', hdfcTopNavs);

    // 3. 120503: Nippon India Small Cap Fund - Growth
    // Small cap alpha engine: +8.5% alpha, beta 0.92, higher idio vol 0.11
    const nipponSmallNavs = this.generateSchemeSeries(42.10, 0.085, 0.92, 0.110, 404);
    this.navHistoryMap.set('120503', nipponSmallNavs);

    // 4. 100033: SBI Bluechip Fund - Growth
    // Core large cap: +0.8% alpha, beta 0.94, low idio vol
    const sbiBlueNavs = this.generateSchemeSeries(38.60, 0.008, 0.94, 0.048, 505);
    this.navHistoryMap.set('100033', sbiBlueNavs);

    // 5. 118989: ICICI Prudential Value Discovery Fund - Growth
    // Value strategy: +4.2% alpha, beta 0.86, moderate idio vol
    const iciciValNavs = this.generateSchemeSeries(135.40, 0.042, 0.86, 0.075, 606);
    this.navHistoryMap.set('118989', iciciValNavs);
  }

  private initializeHoldings(): void {
    // Parag Parikh Flexi Cap Fund Holdings
    this.holdingsMap.set('122639', [
      { companyName: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weightPct: 8.45, assetClass: 'EQUITY' },
      { companyName: 'Bajaj Holdings & Investment Ltd.', isin: 'INE118A01012', sector: 'Financial Services', weightPct: 7.82, assetClass: 'EQUITY' },
      { companyName: 'ITC Ltd.', isin: 'INE154A01025', sector: 'Fast Moving Consumer Goods', weightPct: 6.95, assetClass: 'EQUITY' },
      { companyName: 'Power Grid Corporation of India Ltd.', isin: 'INE752E01010', sector: 'Power & Energy', weightPct: 6.42, assetClass: 'EQUITY' },
      { companyName: 'Coal India Ltd.', isin: 'INE522F01014', sector: 'Metals & Mining', weightPct: 5.75, assetClass: 'EQUITY' },
      { companyName: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weightPct: 5.20, assetClass: 'EQUITY' },
      { companyName: 'Alphabet Inc. (Google)', isin: 'US02079K3059', sector: 'Information Technology', weightPct: 4.80, assetClass: 'EQUITY' },
      { companyName: 'Microsoft Corporation', isin: 'US5949181045', sector: 'Information Technology', weightPct: 4.25, assetClass: 'EQUITY' },
      { companyName: 'Maruti Suzuki India Ltd.', isin: 'INE585B01010', sector: 'Automobile and Auto Components', weightPct: 3.90, assetClass: 'EQUITY' },
      { companyName: 'HCL Technologies Ltd.', isin: 'INE860A01027', sector: 'Information Technology', weightPct: 3.65, assetClass: 'EQUITY' },
      { companyName: 'Axis Bank Ltd.', isin: 'INE238A01034', sector: 'Financial Services', weightPct: 3.10, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Cash Equivalents', sector: 'Cash & Overnight', weightPct: 15.20, assetClass: 'CASH_EQUIVALENT' }
    ]);

    // HDFC Top 100 Fund Holdings
    this.holdingsMap.set('119551', [
      { companyName: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weightPct: 9.85, assetClass: 'EQUITY' },
      { companyName: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weightPct: 8.60, assetClass: 'EQUITY' },
      { companyName: 'Reliance Industries Ltd.', isin: 'INE002A01018', sector: 'Oil Gas & Consumable Fuels', weightPct: 7.95, assetClass: 'EQUITY' },
      { companyName: 'Infosys Ltd.', isin: 'INE009A01021', sector: 'Information Technology', weightPct: 6.70, assetClass: 'EQUITY' },
      { companyName: 'Larsen & Toubro Ltd.', isin: 'INE018A01030', sector: 'Construction', weightPct: 5.80, assetClass: 'EQUITY' },
      { companyName: 'ITC Ltd.', isin: 'INE154A01025', sector: 'Fast Moving Consumer Goods', weightPct: 5.25, assetClass: 'EQUITY' },
      { companyName: 'Tata Consultancy Services Ltd.', isin: 'INE467B01029', sector: 'Information Technology', weightPct: 4.80, assetClass: 'EQUITY' },
      { companyName: 'Axis Bank Ltd.', isin: 'INE238A01034', sector: 'Financial Services', weightPct: 4.15, assetClass: 'EQUITY' },
      { companyName: 'State Bank of India', isin: 'INE062A01020', sector: 'Financial Services', weightPct: 3.90, assetClass: 'EQUITY' },
      { companyName: 'Bharti Airtel Ltd.', isin: 'INE397D01024', sector: 'Telecommunication', weightPct: 3.60, assetClass: 'EQUITY' },
      { companyName: 'NTPC Ltd.', isin: 'INE733E01010', sector: 'Power & Energy', weightPct: 3.10, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Net Receivables', sector: 'Cash & Overnight', weightPct: 5.50, assetClass: 'CASH_EQUIVALENT' }
    ]);

    // Nippon India Small Cap Fund Holdings
    this.holdingsMap.set('120503', [
      { companyName: 'Tube Investments of India Ltd.', isin: 'INE974X01010', sector: 'Automobile and Auto Components', weightPct: 3.20, assetClass: 'EQUITY' },
      { companyName: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weightPct: 2.85, assetClass: 'EQUITY' },
      { companyName: 'Apar Industries Ltd.', isin: 'INE372A01015', sector: 'Capital Goods', weightPct: 2.65, assetClass: 'EQUITY' },
      { companyName: 'KPIT Technologies Ltd.', isin: 'INE04I401011', sector: 'Information Technology', weightPct: 2.40, assetClass: 'EQUITY' },
      { companyName: 'Power Mech Projects Ltd.', isin: 'INE211R01019', sector: 'Construction', weightPct: 2.15, assetClass: 'EQUITY' },
      { companyName: 'Multi Commodity Exchange of India Ltd.', isin: 'INE745G01035', sector: 'Financial Services', weightPct: 2.05, assetClass: 'EQUITY' },
      { companyName: 'Cholamandalam Financial Holdings Ltd.', isin: 'INE149A01033', sector: 'Financial Services', weightPct: 1.95, assetClass: 'EQUITY' },
      { companyName: 'CreditAccess Grameen Ltd.', isin: 'INE741K01010', sector: 'Financial Services', weightPct: 1.85, assetClass: 'EQUITY' },
      { companyName: 'Tejas Networks Ltd.', isin: 'INE010J01012', sector: 'Telecommunication', weightPct: 1.70, assetClass: 'EQUITY' },
      { companyName: 'Carborundum Universal Ltd.', isin: 'INE120A01034', sector: 'Capital Goods', weightPct: 1.60, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Cash Equivalents', sector: 'Cash & Overnight', weightPct: 4.80, assetClass: 'CASH_EQUIVALENT' }
    ]);

    // SBI Bluechip Fund Holdings
    this.holdingsMap.set('100033', [
      { companyName: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weightPct: 9.10, assetClass: 'EQUITY' },
      { companyName: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weightPct: 7.80, assetClass: 'EQUITY' },
      { companyName: 'Reliance Industries Ltd.', isin: 'INE002A01018', sector: 'Oil Gas & Consumable Fuels', weightPct: 7.20, assetClass: 'EQUITY' },
      { companyName: 'Infosys Ltd.', isin: 'INE009A01021', sector: 'Information Technology', weightPct: 6.40, assetClass: 'EQUITY' },
      { companyName: 'Larsen & Toubro Ltd.', isin: 'INE018A01030', sector: 'Construction', weightPct: 5.10, assetClass: 'EQUITY' },
      { companyName: 'ITC Ltd.', isin: 'INE154A01025', sector: 'Fast Moving Consumer Goods', weightPct: 4.90, assetClass: 'EQUITY' },
      { companyName: 'Tata Consultancy Services Ltd.', isin: 'INE467B01029', sector: 'Information Technology', weightPct: 4.40, assetClass: 'EQUITY' },
      { companyName: 'State Bank of India', isin: 'INE062A01020', sector: 'Financial Services', weightPct: 3.80, assetClass: 'EQUITY' },
      { companyName: 'Mahindra & Mahindra Ltd.', isin: 'INE121A01024', sector: 'Automobile and Auto Components', weightPct: 3.50, assetClass: 'EQUITY' },
      { companyName: 'Sun Pharmaceutical Industries Ltd.', isin: 'INE044A01036', sector: 'Healthcare', weightPct: 3.20, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Cash Equivalents', sector: 'Cash & Overnight', weightPct: 4.20, assetClass: 'CASH_EQUIVALENT' }
    ]);

    // ICICI Prudential Value Discovery Fund Holdings
    this.holdingsMap.set('118989', [
      { companyName: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weightPct: 8.75, assetClass: 'EQUITY' },
      { companyName: 'NTPC Ltd.', isin: 'INE733E01010', sector: 'Power & Energy', weightPct: 7.40, assetClass: 'EQUITY' },
      { companyName: 'Oil & Natural Gas Corporation Ltd.', isin: 'INE213A01029', sector: 'Oil Gas & Consumable Fuels', weightPct: 6.80, assetClass: 'EQUITY' },
      { companyName: 'Infosys Ltd.', isin: 'INE009A01021', sector: 'Information Technology', weightPct: 5.90, assetClass: 'EQUITY' },
      { companyName: 'State Bank of India', isin: 'INE062A01020', sector: 'Financial Services', weightPct: 5.20, assetClass: 'EQUITY' },
      { companyName: 'Bharti Airtel Ltd.', isin: 'INE397D01024', sector: 'Telecommunication', weightPct: 4.60, assetClass: 'EQUITY' },
      { companyName: 'Larsen & Toubro Ltd.', isin: 'INE018A01030', sector: 'Construction', weightPct: 4.30, assetClass: 'EQUITY' },
      { companyName: 'ITC Ltd.', isin: 'INE154A01025', sector: 'Fast Moving Consumer Goods', weightPct: 3.80, assetClass: 'EQUITY' },
      { companyName: 'Sun Pharmaceutical Industries Ltd.', isin: 'INE044A01036', sector: 'Healthcare', weightPct: 3.40, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Cash Equivalents', sector: 'Cash & Overnight', weightPct: 6.20, assetClass: 'CASH_EQUIVALENT' }
    ]);

    // Scheme Research Metadata Profiles
    this.schemeProfiles.set('122639', {
      schemeCode: '122639',
      schemeName: 'Parag Parikh Flexi Cap Fund - Regular Plan - Growth',
      amc: 'PPFAS Mutual Fund',
      category: 'Equity Scheme - Flexi Cap Fund',
      aumCrores: 68450.25,
      expenseRatioPct: 1.32,
      inceptionDate: '2013-05-28',
      fundManager: 'Rajeev Thakkar, Raunak Onkar, Raj Mehta',
      returns: { m1: 1.85, m3: 4.20, m6: 11.45, y1: 28.60, y3: 20.40, y5: 23.85, sinceInception: 19.65 },
      riskRatios: { standardDeviation: 12.80, sharpe: 1.28, beta: 0.72, alpha: 6.45 },
      topHoldings: this.holdingsMap.get('122639') || [],
      sectorAllocation: [
        { sector: 'Financial Services', weightPct: 24.57 },
        { sector: 'Information Technology', weightPct: 12.70 },
        { sector: 'Fast Moving Consumer Goods', weightPct: 6.95 },
        { sector: 'Power & Energy', weightPct: 6.42 },
        { sector: 'Metals & Mining', weightPct: 5.75 },
        { sector: 'Automobile', weightPct: 3.90 },
        { sector: 'Others / Cash', weightPct: 39.71 }
      ]
    });

    this.schemeProfiles.set('119551', {
      schemeCode: '119551',
      schemeName: 'HDFC Top 100 Fund - Regular Plan - Growth',
      amc: 'HDFC Mutual Fund',
      category: 'Equity Scheme - Large Cap Fund',
      aumCrores: 34120.80,
      expenseRatioPct: 1.65,
      inceptionDate: '1996-09-03',
      fundManager: 'Rahul Baijal',
      returns: { m1: 1.10, m3: 3.15, m6: 8.90, y1: 22.40, y3: 16.80, y5: 18.25, sinceInception: 18.90 },
      riskRatios: { standardDeviation: 14.50, sharpe: 0.88, beta: 0.96, alpha: 2.15 },
      topHoldings: this.holdingsMap.get('119551') || [],
      sectorAllocation: [
        { sector: 'Financial Services', weightPct: 32.50 },
        { sector: 'Information Technology', weightPct: 14.20 },
        { sector: 'Oil Gas & Consumable Fuels', weightPct: 8.40 },
        { sector: 'Fast Moving Consumer Goods', weightPct: 7.10 },
        { sector: 'Construction', weightPct: 6.20 },
        { sector: 'Telecommunication', weightPct: 4.10 },
        { sector: 'Others / Cash', weightPct: 27.50 }
      ]
    });

    this.schemeProfiles.set('120503', {
      schemeCode: '120503',
      schemeName: 'Nippon India Small Cap Fund - Regular Plan - Growth',
      amc: 'Nippon India Mutual Fund',
      category: 'Equity Scheme - Small Cap Fund',
      aumCrores: 55900.10,
      expenseRatioPct: 1.48,
      inceptionDate: '2010-09-16',
      fundManager: 'Samir Rachh, Kinjal Desai',
      returns: { m1: 2.45, m3: 5.80, m6: 15.20, y1: 34.50, y3: 26.20, y5: 29.80, sinceInception: 21.40 },
      riskRatios: { standardDeviation: 18.90, sharpe: 1.34, beta: 0.88, alpha: 8.90 },
      topHoldings: this.holdingsMap.get('120503') || [],
      sectorAllocation: [
        { sector: 'Capital Goods', weightPct: 18.40 },
        { sector: 'Financial Services', weightPct: 14.80 },
        { sector: 'Information Technology', weightPct: 11.20 },
        { sector: 'Automobile', weightPct: 9.10 },
        { sector: 'Chemicals', weightPct: 8.40 },
        { sector: 'Construction', weightPct: 7.20 },
        { sector: 'Others / Cash', weightPct: 30.90 }
      ]
    });

    this.schemeProfiles.set('100033', {
      schemeCode: '100033',
      schemeName: 'SBI Bluechip Fund - Regular Plan - Growth',
      amc: 'SBI Mutual Fund',
      category: 'Equity Scheme - Large Cap Fund',
      aumCrores: 48200.40,
      expenseRatioPct: 1.58,
      inceptionDate: '2006-02-14',
      fundManager: 'Sohini Andani',
      returns: { m1: 0.95, m3: 2.80, m6: 7.60, y1: 19.80, y3: 15.20, y5: 16.90, sinceInception: 14.80 },
      riskRatios: { standardDeviation: 13.90, sharpe: 0.82, beta: 0.92, alpha: 1.45 },
      topHoldings: this.holdingsMap.get('100033') || [],
      sectorAllocation: [
        { sector: 'Financial Services', weightPct: 30.20 },
        { sector: 'Information Technology', weightPct: 13.50 },
        { sector: 'Automobile', weightPct: 8.90 },
        { sector: 'Oil Gas & Consumable Fuels', weightPct: 7.80 },
        { sector: 'Healthcare', weightPct: 6.40 },
        { sector: 'Fast Moving Consumer Goods', weightPct: 5.80 },
        { sector: 'Others / Cash', weightPct: 27.40 }
      ]
    });

    this.schemeProfiles.set('118989', {
      schemeCode: '118989',
      schemeName: 'ICICI Prudential Value Discovery Fund - Regular Plan - Growth',
      amc: 'ICICI Prudential Mutual Fund',
      category: 'Equity Scheme - Value Fund',
      aumCrores: 42100.00,
      expenseRatioPct: 1.54,
      inceptionDate: '2004-08-16',
      fundManager: 'Sankaran Naren, Dharmesh Kakkad',
      returns: { m1: 1.40, m3: 3.90, m6: 10.80, y1: 26.40, y3: 21.10, y5: 22.40, sinceInception: 19.10 },
      riskRatios: { standardDeviation: 15.10, sharpe: 1.15, beta: 0.84, alpha: 5.20 },
      topHoldings: this.holdingsMap.get('118989') || [],
      sectorAllocation: [
        { sector: 'Financial Services', weightPct: 26.40 },
        { sector: 'Power & Energy', weightPct: 12.80 },
        { sector: 'Oil Gas & Consumable Fuels', weightPct: 10.50 },
        { sector: 'Information Technology', weightPct: 9.80 },
        { sector: 'Healthcare', weightPct: 7.20 },
        { sector: 'Telecommunication', weightPct: 6.10 },
        { sector: 'Others / Cash', weightPct: 27.20 }
      ]
    });
  }

  public getHistoricalNavs(schemeCode: string): HistoricalNavPoint[] {
    const navs = this.navHistoryMap.get(schemeCode);
    if (!navs) {
      // Fallback: Generate a standard large-cap equivalent trajectory deterministically
      const codeNum = parseInt(schemeCode, 10) || 100000;
      const fallback = this.generateSchemeSeries(50, 0.02, 0.95, 0.06, codeNum);
      this.navHistoryMap.set(schemeCode, fallback);
      return fallback;
    }
    return navs;
  }

  public getBenchmarkNavs(): HistoricalNavPoint[] {
    return this.benchmarkNavs;
  }

  public getSchemeHoldings(schemeCode: string): SchemeHolding[] {
    return this.holdingsMap.get(schemeCode) || [
      { companyName: 'HDFC Bank Ltd.', sector: 'Financial Services', weightPct: 9.5, assetClass: 'EQUITY' },
      { companyName: 'ICICI Bank Ltd.', sector: 'Financial Services', weightPct: 8.0, assetClass: 'EQUITY' },
      { companyName: 'Reliance Industries Ltd.', sector: 'Oil Gas', weightPct: 7.5, assetClass: 'EQUITY' },
      { companyName: 'Infosys Ltd.', sector: 'Information Technology', weightPct: 6.5, assetClass: 'EQUITY' },
      { companyName: 'TREPS / Cash', sector: 'Cash Equivalents', weightPct: 5.0, assetClass: 'CASH_EQUIVALENT' }
    ];
  }

  public getSchemeProfile(schemeCode: string): SchemeComparisonItem | null {
    const profile = this.schemeProfiles.get(schemeCode);
    if (profile) return profile;

    // Generate dynamic fallback profile
    return {
      schemeCode,
      schemeName: `Mutual Fund Scheme ${schemeCode} - Growth`,
      amc: 'Standard AMC',
      category: 'Equity Scheme - Growth',
      aumCrores: 15400.0,
      expenseRatioPct: 1.60,
      inceptionDate: '2015-01-01',
      fundManager: 'Chief Investment Officer',
      returns: { m1: 1.2, m3: 3.5, m6: 9.1, y1: 22.0, y3: 16.5, y5: 18.0, sinceInception: 16.2 },
      riskRatios: { standardDeviation: 14.8, sharpe: 0.90, beta: 0.95, alpha: 2.0 },
      topHoldings: this.getSchemeHoldings(schemeCode),
      sectorAllocation: [
        { sector: 'Financial Services', weightPct: 30.0 },
        { sector: 'Information Technology', weightPct: 15.0 },
        { sector: 'Others / Cash', weightPct: 55.0 }
      ]
    };
  }

  public getResearchSchemesList(): { schemeCode: string; schemeName: string; category: string; amc: string }[] {
    return Array.from(this.schemeProfiles.values()).map((p) => ({
      schemeCode: p.schemeCode,
      schemeName: p.schemeName,
      category: p.category,
      amc: p.amc
    }));
  }
}
