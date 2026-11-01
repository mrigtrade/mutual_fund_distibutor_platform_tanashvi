/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 8 Testbench: Client Portfolio, CAS Ingestion & Capital Gains Tax
 * 
 * Tests:
 * 1. Cashflow-weighted XIRR calculation with Newton-Raphson & Bisection
 * 2. Union Budget 2024 Capital Gains Tax Rules (20% STCG, 12.5% LTCG, ₹1.25L Exemption)
 * 3. Section 112A Grandfathering (Pre-2018 acquisitions)
 * 4. Section 50AA Specified Debt Mutual Funds (Post-01-Apr-2023 slab-rate taxation)
 * 5. FIFO (First-In, First-Out) lot matching engine
 * 6. CAS (Consolidated Account Statement) JSON & CSV parser
 * 7. Portfolio valuation, asset allocation, and XIRR aggregation
 * 8. REST API endpoints ("Generate capital gains report for Ramesh")
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 */

import http from 'http';
import { createApp } from '../app.js';
import { XirrCalculator } from '../services/xirrCalculator.js';
import { CapitalGainsService } from '../services/capitalGainsService.js';
import { CasParserService } from '../services/casParserService.js';
import { PortfolioService } from '../services/portfolioService.js';
import { PortfolioTransaction } from '../types/portfolio.js';

function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase8Testbench() {
  console.log('========================================================================');
  console.log('💼 Tanashvi B2B Mutual Fund Platform: Portfolio & Tax Engine (Phase 8)');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('🏛️  SEBI & Union Budget 2024 Capital Gains Tax Rules Enforced');
  console.log('========================================================================\n');

  // ==========================================================================
  // 1. HIGH-PRECISION XIRR TESTBENCH
  // ==========================================================================
  console.log('📈 1. Testing Cashflow-Weighted XIRR Calculator...');

  // Test 1.1: 1 Year Doubling Investment (₹1,00,000 on 2023-01-01 -> ₹2,00,000 on 2024-01-01)
  const doublingCashflows = [
    { date: '2023-01-01', amount: -100000 },
    { date: '2024-01-01', amount: 200000 }
  ];
  const doublingXirr = XirrCalculator.calculate(doublingCashflows);
  console.log(`   1-Year Doubling (₹1L -> ₹2L in 365 days): XIRR = ${doublingXirr}% (Expected ~100.0%)`);
  assert(doublingXirr >= 99.9 && doublingXirr <= 100.1, '1-Year Doubling XIRR should be 100%');

  // Test 1.2: 3-Year Monthly SIP with 12% Expected Return
  const sipCashflows = [
    { date: '2021-01-01', amount: -10000 },
    { date: '2021-07-01', amount: -10000 },
    { date: '2022-01-01', amount: -10000 },
    { date: '2022-07-01', amount: -10000 },
    { date: '2023-01-01', amount: -10000 },
    { date: '2024-01-01', amount: 65000 } // Terminal valuation
  ];
  const sipXirr = XirrCalculator.calculate(sipCashflows);
  console.log(`   Multi-date Inflows/Outflows: XIRR = ${sipXirr}%`);
  assert(sipXirr > 10.0 && sipXirr < 20.0, 'SIP XIRR should be around 14%');

  // Test 1.3: Boundary handling (all negative or zero days)
  const invalidCashflows = [{ date: '2023-01-01', amount: -10000 }];
  assert(XirrCalculator.calculate(invalidCashflows) === 0, 'Single cashflow should return 0 XIRR');

  console.log('   ✅ High-precision XIRR engine tests passed.\n');

  // ==========================================================================
  // 2. UNION BUDGET 2024 CAPITAL GAINS TAX RULES & STATUTORY LOGIC
  // ==========================================================================
  console.log('⚖️  2. Testing Union Budget 2024 Capital Gains Rules & Grandfathering...');

  // Test 2.1: Equity STCG (< 365 days) sold after July 23, 2024 -> 20% Rate
  const equityStcgPost = CapitalGainsService.classifyGain('EQUITY', '2024-01-15', '2024-08-10', 208);
  console.log(`   Equity STCG (Sold 10-Aug-2024): Gain=${equityStcgPost.gainType}, Rate=${equityStcgPost.taxRatePct}%, Regime=${equityStcgPost.budgetRegime}`);
  assert(equityStcgPost.gainType === 'STCG', 'Holding < 365 days should be STCG');
  assert(equityStcgPost.taxRatePct === 20.0, 'Post Budget 2024 Equity STCG must be 20%');

  // Test 2.2: Equity LTCG (> 365 days) sold after July 23, 2024 -> 12.5% Rate
  const equityLtcgPost = CapitalGainsService.classifyGain('EQUITY', '2022-05-10', '2024-09-01', 845);
  console.log(`   Equity LTCG (Sold 01-Sep-2024): Gain=${equityLtcgPost.gainType}, Rate=${equityLtcgPost.taxRatePct}%, Regime=${equityLtcgPost.budgetRegime}`);
  assert(equityLtcgPost.gainType === 'LTCG', 'Holding > 365 days should be LTCG');
  assert(equityLtcgPost.taxRatePct === 12.5, 'Post Budget 2024 Equity LTCG must be 12.5%');

  // Test 2.3: Section 112A Grandfathering for Pre-2018 Purchase
  // Purchase NAV: 450, 31-Jan-2018 FMV: 540, Sale NAV: 985.42
  // Adjusted Cost = MAX(450, MIN(540, 985.42)) = 540.00
  const gfResult = CapitalGainsService.calculateGrandfatheredNav('2017-06-15', 450.0, 985.42, 540.0);
  console.log(`   Section 112A Grandfathering: Original Cost=₹450, FMV=₹540, Sale=₹985.42 -> Adjusted Cost=₹${gfResult.adjustedCostNav}`);
  assert(gfResult.isGrandfathered === true, 'Pre-2018 acquisition should be grandfathered');
  assert(gfResult.adjustedCostNav === 540.0, 'Grandfathered cost should be FMV (₹540)');

  // Test 2.4: Section 50AA Specified Debt Mutual Funds (Bought post 01-Apr-2023)
  const debtSec50aa = CapitalGainsService.classifyGain('DEBT', '2023-05-10', '2024-11-15', 555);
  console.log(`   Section 50AA Debt (Bought 10-May-2023): Gain=${debtSec50aa.gainType}, Sec50AA=${debtSec50aa.isSec50aaDebt}, Rate=${debtSec50aa.taxRatePct}% (Slab)`);
  assert(debtSec50aa.isSec50aaDebt === true, 'Debt bought after 01-Apr-2023 must be marked as Section 50AA');
  assert(debtSec50aa.gainType === 'STCG', 'Section 50AA debt must be treated as STCG');
  assert(debtSec50aa.taxRatePct === 30.0, 'Section 50AA debt taxed at marginal slab rate');

  console.log('   ✅ Statutory tax classification tests passed.\n');

  // ==========================================================================
  // 3. FIFO LOT MATCHING ENGINE
  // ==========================================================================
  console.log('🔄 3. Testing FIFO (First-In, First-Out) Lot Matching...');

  const sampleTxList: PortfolioTransaction[] = [
    {
      id: 'TX-1',
      tenant_id: 'tenant-1',
      ucc_id: 'ucc-1',
      folio_id: 'folio-1',
      scheme_code: 'INF879O01019',
      scheme_name: 'Parag Parikh Flexi Cap Fund',
      asset_class: 'EQUITY',
      transaction_date: '2022-01-10',
      transaction_type: 'PURCHASE',
      units: 100,
      nav: 50.0,
      amount: 5000,
      available_units: 100,
      source: 'CAS_IMPORT',
      created_at: new Date().toISOString()
    },
    {
      id: 'TX-2',
      tenant_id: 'tenant-1',
      ucc_id: 'ucc-1',
      folio_id: 'folio-1',
      scheme_code: 'INF879O01019',
      scheme_name: 'Parag Parikh Flexi Cap Fund',
      asset_class: 'EQUITY',
      transaction_date: '2022-07-10',
      transaction_type: 'PURCHASE',
      units: 100,
      nav: 55.0,
      amount: 5500,
      available_units: 100,
      source: 'CAS_IMPORT',
      created_at: new Date().toISOString()
    },
    {
      id: 'TX-3',
      tenant_id: 'tenant-1',
      ucc_id: 'ucc-1',
      folio_id: 'folio-1',
      scheme_code: 'INF879O01019',
      scheme_name: 'Parag Parikh Flexi Cap Fund',
      asset_class: 'EQUITY',
      transaction_date: '2024-08-15',
      transaction_type: 'REDEMPTION',
      units: 150, // Redeems 100 from TX-1 and 50 from TX-2
      nav: 80.0,
      amount: 12000,
      available_units: 0,
      source: 'CAS_IMPORT',
      created_at: new Date().toISOString()
    }
  ];

  const { matchedLots, remainingPurchases } = CapitalGainsService.matchFifoLots(sampleTxList, '2024-2025');
  console.log(`   Matched ${matchedLots.length} FIFO lots for 150 units redemption:`);
  for (const m of matchedLots) {
    console.log(`   - Lot from ${m.purchaseDate}: ${m.unitsMatched} units @ ₹${m.purchaseNav} -> Sold @ ₹${m.saleNav} | Gain: ₹${m.grossGain} (${m.gainType} @ ${m.taxRatePct}%)`);
  }

  assert(matchedLots.length === 2, 'Should match across 2 lots');
  assert(matchedLots[0].unitsMatched === 100, 'First lot should be completely matched for 100 units');
  assert(matchedLots[1].unitsMatched === 50, 'Second lot should be partially matched for 50 units');
  assert(remainingPurchases.length === 1 && remainingPurchases[0].available_units === 50, '50 units should remain available on second lot');

  console.log('   ✅ FIFO lot matching tests passed.\n');

  // ==========================================================================
  // 4. CAS STATEMENT PARSER TEST (JSON & CSV)
  // ==========================================================================
  console.log('📑 4. Testing Consolidated Account Statement (CAS) Parser...');

  const sampleCsvCas = `FolioNumber,AMC,SchemeName,ISIN,Date,Type,Units,NAV,Amount
10293847/56,HDFC Mutual Fund,HDFC Top 100 Fund - Regular Plan - Growth,INF769K01010,2023-01-15,PURCHASE,100,750.0,75000
10293847/56,HDFC Mutual Fund,HDFC Top 100 Fund - Regular Plan - Growth,INF769K01010,2024-08-20,REDEMPTION,50,985.42,49271
99887766/01,PPFAS Mutual Fund,Parag Parikh Flexi Cap Fund - Regular Plan - Growth,INF879O01019,2024-02-10,SIP,25,70.0,1750`;

  const parsedCsv = CasParserService.parseCsvCas(
    sampleCsvCas,
    'AAAPS1234K',
    'Ramesh Sharma',
    'tenant-test',
    'UCC-RAMESH-001'
  );

  console.log(`   Parsed CSV CAS: Folios=${parsedCsv.total_folios_count}, Schemes=${parsedCsv.holdings.length}, Transactions=${parsedCsv.total_transactions_count}`);
  assert(parsedCsv.total_folios_count === 2, 'Should have 2 distinct folios');
  assert(parsedCsv.total_transactions_count === 3, 'Should have 3 transactions');
  assert(parsedCsv.holdings[0].total_units === 50, 'HDFC Top 100 remaining units should be 50 (100 - 50)');

  console.log('   ✅ CAS Statement parser tests passed.\n');

  // ==========================================================================
  // 5. REST API SERVER TESTBENCH ("Generate capital gains report for Ramesh")
  // ==========================================================================
  console.log('🌐 5. Testing AdvisorKhoj REST API Gateway Endpoints...');

  const app = createApp();
  const testServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = testServer.address() as any;
  const port = address.port;

  try {
    // 5.1 GET /api/v1/portfolio/summary?client_code=UCC-RAMESH-001
    const summaryRes = await makeRequest(port, 'GET', '/api/v1/portfolio/summary?client_code=UCC-RAMESH-001');
    assert(summaryRes.status === 200, 'Portfolio summary should return 200 OK');
    const summaryData = summaryRes.body.data;
    console.log(`   GET /api/v1/portfolio/summary:
       Investor: ${summaryData.investor_name} (${summaryData.investor_pan})
       Total Invested: ₹${summaryData.total_invested}
       Current Valuation: ₹${summaryData.total_current_value}
       Absolute Gain: ₹${summaryData.total_gain} (${summaryData.absolute_return_pct}%)
       Portfolio XIRR: ${summaryData.portfolio_xirr_pct}% p.a.
       Asset Allocation: Equity ${summaryData.asset_allocation.equity_pct}%, Debt ${summaryData.asset_allocation.debt_pct}%, Liquid ${summaryData.asset_allocation.liquid_pct}%`);
    assert(summaryData.total_current_value > 0, 'Current valuation should be positive');
    assert(summaryData.portfolio_xirr_pct > 0, 'Portfolio XIRR should be positive');

    // 5.2 GET /api/v1/portfolio/holdings?client_code=UCC-RAMESH-001
    const holdingsRes = await makeRequest(port, 'GET', '/api/v1/portfolio/holdings?client_code=UCC-RAMESH-001');
    assert(holdingsRes.status === 200, 'Holdings endpoint should return 200 OK');
    console.log(`   GET /api/v1/portfolio/holdings: Found ${holdingsRes.body.count} active holdings`);
    assert(holdingsRes.body.count >= 3, 'Should have at least 3 holdings for Ramesh');

    // 5.3 GET /api/v1/tax/capital-gains/realized?client_code=UCC-RAMESH-001&fy=2024-2025
    // Tests AdvisorKhoj core banner feature: "Generate capital gains report for Ramesh"
    const taxRes = await makeRequest(port, 'GET', '/api/v1/tax/capital-gains/realized?client_code=UCC-RAMESH-001&fy=2024-2025');
    assert(taxRes.status === 200, 'Realized tax endpoint should return 200 OK');
    const taxData = taxRes.body.data;
    console.log(`   GET /api/v1/tax/capital-gains/realized (FY 2024-2025):
       Total Realized Sales: ₹${taxData.total_realized_sales}
       Total Gross Gain: ₹${taxData.total_gross_gain}
       Equity LTCG Gain: ₹${taxData.equity_ltcg.total_gain}
       Budget 2024 Exemption Applied: ₹${taxData.equity_ltcg.exemption_applied} (Annual limit ₹1,25,000)
       Net Taxable Equity LTCG: ₹${taxData.equity_ltcg.net_taxable_gain} (Tax @ 12.5% = ₹${taxData.equity_ltcg.tax_payable})
       Section 50AA Debt STCG: ₹${taxData.debt_specified_stcg.total_gain} (Slab Tax = ₹${taxData.debt_specified_stcg.estimated_slab_tax})
       Total Tax Liability (incl. 4% cess): ₹${taxData.total_tax_liability}`);
    
    assert(taxData.equity_ltcg.exemption_applied <= 125000, 'LTCG exemption applied cannot exceed ₹1.25 Lakhs');
    assert(taxData.equity_ltcg.tax_rate_pct === 12.5, 'Post-Budget 2024 equity LTCG rate must be 12.5%');

    // 5.4 GET /api/v1/tax/capital-gains/unrealized?client_code=UCC-RAMESH-001
    const unrealizedRes = await makeRequest(port, 'GET', '/api/v1/tax/capital-gains/unrealized?client_code=UCC-RAMESH-001');
    assert(unrealizedRes.status === 200, 'Unrealized tax endpoint should return 200 OK');
    const unrealizedData = unrealizedRes.body.data;
    console.log(`   GET /api/v1/tax/capital-gains/unrealized:
       Total Current Value: ₹${unrealizedData.total_current_value}
       Total Unrealized Gain: ₹${unrealizedData.total_unrealized_gain}
       Unrealized Equity LTCG: ₹${unrealizedData.unrealized_equity_ltcg}
       Remaining ₹1.25L Exemption: ₹${unrealizedData.equity_ltcg_annual_exemption_remaining}`);

    // 5.5 POST /api/v1/portfolio/cas/import (CSV format)
    const importRes = await makeRequest(port, 'POST', '/api/v1/portfolio/cas/import', {
      client_code: 'UCC-TEST-002',
      investor_pan: 'BBBPK9876L',
      investor_name: 'Priya Verma',
      csv_content: sampleCsvCas
    });
    assert(importRes.status === 200, 'CAS CSV import should return 200 OK');
    console.log(`   POST /api/v1/portfolio/cas/import: Successfully imported ${importRes.body.data.total_transactions} transactions for ${importRes.body.data.investor_name}`);

    console.log('   ✅ All REST API endpoints verified successfully.\n');
  } finally {
    testServer.close();
  }

  console.log('========================================================================');
  console.log('🎉 ALL PHASE 8 PORTFOLIO & CAPITAL GAINS TAX TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================');
}

runPhase8Testbench().catch((err) => {
  console.error('❌ Testbench threw unhandled error:', err);
  process.exit(1);
});

