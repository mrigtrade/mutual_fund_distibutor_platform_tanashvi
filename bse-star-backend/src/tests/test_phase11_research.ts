/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11 Testbench: Mutual Fund Research & Analytics Engine
 * 
 * Verifies parity with AdvisorKhoj MF Research tools:
 * 1. Rolling Returns vs Benchmark Engine (1Y, 3Y, 5Y, 7Y)
 * 2. Return Frequency Distribution & Outperformance Probabilities
 * 3. Risk-Adjusted Ratios (Standard Deviation, Sharpe, Beta, Alpha, Sortino)
 * 4. Multi-Scheme Comparison Matrix (up to 4 schemes)
 * 5. Fund Portfolio Overlap Analysis (Common stocks & overlapping weight %)
 * 6. REST API Gateway Endpoints
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 */

import http from 'http';
import { createApp } from '../app.js';
import { RollingReturnsService } from '../services/rollingReturnsService.js';
import { RiskRatiosService } from '../services/riskRatiosService.js';
import { PortfolioOverlapService } from '../services/portfolioOverlapService.js';
import { ResearchDataService } from '../services/researchDataService.js';

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

async function runPhase11Testbench() {
  console.log('========================================================================');
  console.log('📊 Tanashvi B2B Mutual Fund Platform: MF Research & Analytics (Phase 11)');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('🎯 Parity with AdvisorKhoj: Rolling Returns, Risk Ratios & Fund Overlap');
  console.log('========================================================================\n');

  const dataService = ResearchDataService.getInstance();
  const rollingService = RollingReturnsService.getInstance();
  const riskService = RiskRatiosService.getInstance();
  const overlapService = PortfolioOverlapService.getInstance();

  // ==========================================================================
  // 1. RESEARCH DATA FIXTURES
  // ==========================================================================
  console.log('📥 1. Testing Research Data Engine & Flagship Scheme Profiles...');
  const schemes = dataService.getResearchSchemesList();
  console.log(`   Loaded ${schemes.length} flagship research schemes:`);
  for (const s of schemes) {
    console.log(`     - [${s.schemeCode}] ${s.schemeName} (${s.category})`);
  }
  assert(schemes.length >= 5, 'Should have at least 5 flagship research schemes');

  const benchmarkNavs = dataService.getBenchmarkNavs();
  console.log(`   Benchmark NIFTY 50 TRI: ${benchmarkNavs.length} daily trading points (2019 - 2026)`);
  assert(benchmarkNavs.length > 1000, 'Benchmark should have > 1000 daily points');

  const ppfasHoldings = dataService.getSchemeHoldings('122639');
  console.log(`   Parag Parikh Flexi Cap: ${ppfasHoldings.length} top equity & cash holdings`);
  assert(ppfasHoldings.length >= 10, 'PPFAS should have >= 10 holdings');
  console.log('   ✅ Research data engine initialized.\n');

  // ==========================================================================
  // 2. ROLLING RETURNS ENGINE
  // ==========================================================================
  console.log('📈 2. Testing Rolling Returns vs Benchmark Engine...');
  
  // 2.1 3-Year Rolling Returns for Parag Parikh Flexi Cap Fund
  const rolling3Y = rollingService.calculateRollingReturns('122639', 3);
  console.log(`   Scheme: ${rolling3Y.schemeName}`);
  console.log(`   Benchmark: ${rolling3Y.benchmarkName} | Horizon: ${rolling3Y.horizonYears} Years`);
  console.log(`   Total Rolling Windows: ${rolling3Y.totalPeriods} periods (${rolling3Y.startDate} to ${rolling3Y.endDate})`);
  console.log(`   Scheme Metrics:
       Min Return:      ${rolling3Y.schemeMetrics.minReturnPct}%
       Max Return:      ${rolling3Y.schemeMetrics.maxReturnPct}%
       Average Return:  ${rolling3Y.schemeMetrics.avgReturnPct}%
       Median Return:   ${rolling3Y.schemeMetrics.medianReturnPct}%`);
  console.log(`   Benchmark Metrics:
       Min Return:      ${rolling3Y.benchmarkMetrics.minReturnPct}%
       Max Return:      ${rolling3Y.benchmarkMetrics.maxReturnPct}%
       Average Return:  ${rolling3Y.benchmarkMetrics.avgReturnPct}%
       Median Return:   ${rolling3Y.benchmarkMetrics.medianReturnPct}%`);
  console.log(`   Return Probability Distribution (% of times observed):
       < 0% (Loss):     ${rolling3Y.schemeMetrics.distribution.lessThanZeroPct}%
       0% - 8% (FD):    ${rolling3Y.schemeMetrics.distribution.zeroToEightPct}%
       8% - 12%:        ${rolling3Y.schemeMetrics.distribution.eightToTwelvePct}%
       12% - 15%:       ${rolling3Y.schemeMetrics.distribution.twelveToFifteenPct}%
       > 15% (Alpha):   ${rolling3Y.schemeMetrics.distribution.greaterThanFifteenPct}%`);

  assert(rolling3Y.totalPeriods > 500, '3Y rolling periods should be > 500');
  assert(rolling3Y.schemeMetrics.avgReturnPct > 0, 'Average return should be positive');
  assert(rolling3Y.schemeMetrics.distribution.lessThanZeroPct <= 10, 'Loss probability for 3Y equity should be low');

  // 2.2 5-Year Rolling Returns for Nippon Small Cap
  const rolling5Y = rollingService.calculateRollingReturns('120503', 5);
  console.log(`   Nippon Small Cap 5Y Rolling: Avg Return ${rolling5Y.schemeMetrics.avgReturnPct}%, >15% probability: ${rolling5Y.schemeMetrics.distribution.greaterThanFifteenPct}%`);
  assert(rolling5Y.schemeMetrics.avgReturnPct > 15, 'Small cap 5Y avg return should be attractive');
  console.log('   ✅ Rolling returns engine verified.\n');

  // ==========================================================================
  // 3. RISK RATIOS & VOLATILITY ENGINE
  // ==========================================================================
  console.log('⚖️  3. Testing Risk Ratios & Volatility Metrics Engine...');
  const risk3Y = riskService.calculateRiskRatios('122639', 3, 6.50);

  console.log(`   Scheme: ${risk3Y.schemeName} (3-Year Period, ${risk3Y.dataPoints} trading days)`);
  console.log(`   Annualized Return:          ${risk3Y.annualizedReturnPct}% p.a. vs Benchmark ${risk3Y.benchmarkAnnualizedReturnPct}% p.a.`);
  console.log(`   Standard Deviation:         ${risk3Y.standardDeviationPct}% vs Benchmark ${risk3Y.benchmarkStandardDeviationPct}%`);
  console.log(`   Beta (Market Sensitivity):  ${risk3Y.beta}`);
  console.log(`   Jensen's Alpha (Annual):    ${risk3Y.alphaPct}%`);
  console.log(`   Sharpe Ratio (Excess / SD): ${risk3Y.sharpeRatio}`);
  console.log(`   Sortino Ratio (Downside):   ${risk3Y.sortinoRatio}`);
  console.log(`   Treynor Ratio:              ${risk3Y.treynorRatio}%`);
  console.log(`   R-Squared:                  ${risk3Y.rSquared}`);

  assert(risk3Y.standardDeviationPct > 5 && risk3Y.standardDeviationPct < 30, 'Reasonable equity standard deviation');
  assert(risk3Y.beta > 0.4 && risk3Y.beta < 1.5, 'Beta should be within typical range');
  assert(risk3Y.sharpeRatio > 0, 'Sharpe ratio should be positive');
  assert(risk3Y.sortinoRatio >= risk3Y.sharpeRatio, 'Sortino ratio is typically >= Sharpe due to downside focus');
  console.log('   ✅ Risk ratios engine verified.\n');

  // ==========================================================================
  // 4. PORTFOLIO OVERLAP ANALYSIS
  // ==========================================================================
  console.log('🔍 4. Testing Portfolio Overlap Analysis Engine...');
  // Compare HDFC Top 100 (119551) vs Parag Parikh Flexi Cap (122639)
  const overlap = overlapService.calculateOverlap('119551', '122639');

  console.log(`   Comparing: ${overlap.schemeA.name} vs ${overlap.schemeB.name}`);
  console.log(`   Portfolio Overlap: ${overlap.overlapPercentage}%`);
  console.log(`   Common Holdings Count: ${overlap.commonHoldingsCount}`);
  console.log(`   Unique to Scheme A: ${overlap.uniqueToSchemeACount} | Unique to Scheme B: ${overlap.uniqueToSchemeBCount}`);
  console.log('   Top Shared Common Holdings:');
  for (const c of overlap.commonHoldings.slice(0, 5)) {
    console.log(`     * ${c.companyName} (${c.sector}): A=${c.weightInSchemeA}%, B=${c.weightInSchemeB}% -> Overlap=${c.overlappingWeight}%`);
  }

  assert(overlap.overlapPercentage > 10 && overlap.overlapPercentage < 60, 'Large Cap vs Flexi Cap overlap should be moderate');
  assert(overlap.commonHoldingsCount >= 3, 'Should have common banking/tech bluechips');
  console.log('   ✅ Portfolio overlap engine verified.\n');

  // ==========================================================================
  // 5. REST API GATEWAY ENDPOINTS
  // ==========================================================================
  console.log('🌐 5. Testing AdvisorKhoj Parity REST API Gateway Endpoints...');

  const app = createApp();
  const testServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = testServer.address() as any;
  const port = address.port;

  try {
    // 5.1 GET /api/v1/research/schemes
    const schemesRes = await makeRequest(port, 'GET', '/api/v1/research/schemes');
    assert(schemesRes.status === 200, 'GET /api/v1/research/schemes should return 200 OK');
    assert(schemesRes.body.count >= 5, 'Should return >= 5 schemes');
    console.log(`   GET /api/v1/research/schemes: Found ${schemesRes.body.count} schemes`);

    // 5.2 GET /api/v1/research/rolling-returns?schemeCode=122639&years=3
    const rollingRes = await makeRequest(port, 'GET', '/api/v1/research/rolling-returns?schemeCode=122639&years=3');
    assert(rollingRes.status === 200, 'GET /api/v1/research/rolling-returns should return 200 OK');
    const rollingData = rollingRes.body.data;
    console.log(`   GET /api/v1/research/rolling-returns:
       Horizon: ${rollingData.horizonYears}Y | Periods: ${rollingData.totalPeriods}
       Scheme Avg Return: ${rollingData.schemeMetrics.avgReturnPct}%
       Benchmark Avg Return: ${rollingData.benchmarkMetrics.avgReturnPct}%`);
    assert(rollingData.totalPeriods > 500, 'Expected >500 rolling data points');

    // 5.3 GET /api/v1/research/risk-ratios?schemeCode=122639&periodYears=3
    const riskRes = await makeRequest(port, 'GET', '/api/v1/research/risk-ratios?schemeCode=122639&periodYears=3');
    assert(riskRes.status === 200, 'GET /api/v1/research/risk-ratios should return 200 OK');
    const riskData = riskRes.body.data;
    console.log(`   GET /api/v1/research/risk-ratios:
       Beta: ${riskData.beta} | Sharpe: ${riskData.sharpeRatio} | Alpha: ${riskData.alphaPct}%`);
    assert(riskData.beta > 0, 'Beta should be valid');

    // 5.4 POST /api/v1/research/compare
    const compareRes = await makeRequest(port, 'POST', '/api/v1/research/compare', {
      schemeCodes: ['122639', '119551', '120503', '100033']
    });
    assert(compareRes.status === 200, 'POST /api/v1/research/compare should return 200 OK');
    assert(compareRes.body.count === 4, 'Should return comparison for 4 schemes');
    console.log(`   POST /api/v1/research/compare: Successfully compared 4 funds side-by-side`);

    // 5.5 POST /api/v1/research/overlap
    const overlapRes = await makeRequest(port, 'POST', '/api/v1/research/overlap', {
      schemeCodeA: '119551',
      schemeCodeB: '122639'
    });
    assert(overlapRes.status === 200, 'POST /api/v1/research/overlap should return 200 OK');
    console.log(`   POST /api/v1/research/overlap: Overlap is ${overlapRes.body.data.overlapPercentage}% across ${overlapRes.body.data.commonHoldingsCount} shared stocks`);
    assert(overlapRes.body.data.overlapPercentage > 0, 'Overlap should be positive');

    console.log('   ✅ All REST API research endpoints verified successfully.\n');
  } finally {
    testServer.close();
  }

  console.log('========================================================================');
  console.log('🎉 ALL PHASE 11 RESEARCH & ANALYTICS TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================');
}

runPhase11Testbench().catch((err) => {
  console.error('Fatal testbench failure:', err);
  process.exit(1);
});

