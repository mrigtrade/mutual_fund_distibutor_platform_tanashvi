/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 15 Unit & Integration Tests: Multi-Benchmark TRI Engine, Sync & Portfolio Comparison
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { createApp } from '../app.js';
import { BenchmarkService } from '../services/benchmarkService.js';

async function httpJson(
  port: number,
  method: string,
  urlPath: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      res => {
        let chunks = '';
        res.on('data', d => (chunks += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, body: JSON.parse(chunks) });
          } catch (e) {
            reject(new Error(`Invalid JSON (${res.statusCode}): ${chunks}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n====================================================================');
  console.log('🧪 Running Phase 15 Tests: Portfolio Visualization & Benchmark TRI');
  console.log('====================================================================\n');

  // Clean any old disk cache before test so deterministic baseline is verified
  const cachePath = path.resolve(process.cwd(), 'data', 'benchmark_tri_cache.json');
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }

  const svc = BenchmarkService.getInstance();

  // 1. Verify 6 Standard TRI Benchmarks
  console.log('1️⃣  Testing Standard Indian TRI Benchmark Catalog...');
  const benchmarks = svc.listBenchmarks();
  assert.strictEqual(benchmarks.length, 6, 'Expected 6 standard Indian TRI benchmarks');
  const nifty50 = benchmarks.find(b => b.id === 'NIFTY_50_TRI');
  const nifty500 = benchmarks.find(b => b.id === 'NIFTY_500_TRI');
  assert.ok(nifty50 && nifty50.dataPointsCount > 1500, 'Nifty 50 TRI should have >1500 daily data points');
  assert.ok(nifty500 && nifty500.amfiProxySchemeCode === '147622', 'Nifty 500 TRI proxy should be mapped');
  console.log(`   ✅ Loaded ${benchmarks.length} TRI benchmarks (Nifty 50 TRI: ${nifty50.dataPointsCount} trading days, 3Y CAGR: ${nifty50.returns.cagr3Y}%)`);

  // 2. Verify Portfolio vs. Nifty 500 TRI & Custom Blended Benchmark
  console.log('\n2️⃣  Testing Portfolio vs. Nifty 500 TRI & Custom Blended Benchmark...');
  const cmpNifty500 = svc.comparePortfolioAgainstBenchmark({
    portfolioName: 'Ramesh Sharma Portfolio',
    benchmarkId: 'NIFTY_500_TRI',
    horizon: '3Y',
    totalInvested: 208926.24,
    currentValue: 384858.51,
    portfolioXirrPct: 15.46,
    assetAllocation: { equityPct: 90.98, debtPct: 4.4, liquidPct: 4.62 }
  });
  assert.ok(cmpNifty500.series.length >= 20, 'Chart series should contain >= 20 sampled points');
  assert.strictEqual(cmpNifty500.metrics.portfolioXirrPct, 15.46);
  assert.ok(typeof cmpNifty500.metrics.netAlphaPct === 'number', 'Net alpha should be numeric');
  assert.ok(cmpNifty500.sebiComplianceNote.includes('TRI'), 'SEBI TRI disclosure note must be included');
  console.log(
    `   ✅ Nifty 500 TRI Comparison: Port XIRR ${cmpNifty500.metrics.portfolioXirrPct}% vs Bench ${cmpNifty500.metrics.benchmarkXirrPct}% | Alpha: ${cmpNifty500.metrics.netAlphaPct}% | Extra Wealth: ₹${cmpNifty500.metrics.extraWealthCreatedInr.toLocaleString()}`
  );

  const cmpBlended = svc.comparePortfolioAgainstBenchmark({
    portfolioName: 'Col. Vikramaditya Rathore (Conservative)',
    benchmarkId: 'CUSTOM_BLENDED',
    horizon: '3Y',
    totalInvested: 3500000,
    currentValue: 4820500,
    portfolioXirrPct: 11.2,
    assetAllocation: { equityPct: 42.5, debtPct: 45.2, liquidPct: 12.3 }
  });
  assert.ok(cmpBlended.blendedComposition?.includes('Nifty 500 TRI'), 'Blended composition should describe exact Equity/Debt mix');
  console.log(`   ✅ Custom Blended Benchmark: "${cmpBlended.blendedComposition}" | Bench XIRR: ${cmpBlended.metrics.benchmarkXirrPct}%`);

  // 3. Verify Official NSE CSV Bulk Import (DD-MMM-YYYY, DD-MM-YYYY, YYYY-MM-DD)
  console.log('\n3️⃣  Testing Official NSE Indices TRI CSV Bulk Import...');
  const sampleNseCsv = [
    '"Date","Total Returns Index"',
    '"18 Nov 2026","38425.75"',
    '"19-Nov-2026","38610.20"',
    '2026-11-20,38790.50'
  ].join('\n');
  const csvRes = svc.importBenchmarkCsv('NIFTY_50_TRI', sampleNseCsv);
  assert.strictEqual(csvRes.rowsParsed, 3, 'Should parse all 3 NSE CSV rows');
  assert.strictEqual(csvRes.latestDate, '2026-11-20');
  assert.strictEqual(csvRes.latestValue, 38790.5);
  assert.strictEqual(csvRes.dataSource, 'CSV_IMPORT');
  console.log(`   ✅ Imported ${csvRes.rowsParsed} NSE TRI rows -> Latest: ${csvRes.latestDate} (${csvRes.latestValue})`);

  // 4. Verify Manual Single-Day Upsert & Offline-First Sync
  console.log('\n4️⃣  Testing Manual EOD TRI Upsert & Offline Sync Fallback...');
  const manualRes = svc.upsertManualPoint('NIFTY_500_TRI', '2026-11-20', 36950.15);
  assert.strictEqual(manualRes.latestDate, '2026-11-20');
  assert.strictEqual(manualRes.latestValue, 36950.15);
  const syncOffline = await svc.syncBenchmarks({ forceLive: false });
  assert.strictEqual(syncOffline.mode, 'OFFLINE_SEED');
  assert.strictEqual(syncOffline.totalBenchmarks, 6);
  console.log(`   ✅ Manual upsert verified & offline sync returned cleanly (${syncOffline.totalBenchmarks} benchmarks)`);

  // 5. Verify Express REST API Endpoints
  console.log('\n5️⃣  Testing Express REST API Endpoints (/api/v1/benchmarks/*)...');
  const app = createApp();
  const server = await new Promise<http.Server>(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as any).port;

  try {
    const listResp = await httpJson(port, 'GET', '/api/v1/benchmarks');
    assert.strictEqual(listResp.status, 200);
    assert.strictEqual(listResp.body.data.benchmarks.length, 6);

    const compareResp = await httpJson(port, 'POST', '/api/v1/benchmarks/compare', {
      portfolioName: 'Sunita Mehta',
      benchmarkId: 'NIFTY_MIDCAP_150_TRI',
      horizon: '5Y',
      totalInvested: 820000,
      currentValue: 1452400,
      portfolioXirrPct: 24.8,
      assetAllocation: { equityPct: 95.2, debtPct: 0, liquidPct: 4.8 }
    });
    assert.strictEqual(compareResp.status, 200);
    assert.strictEqual(compareResp.body.data.benchmarkId, 'NIFTY_MIDCAP_150_TRI');
    assert.ok(compareResp.body.data.series.length >= 20);

    const syncResp = await httpJson(port, 'POST', '/api/v1/benchmarks/sync', { forceLive: false });
    assert.strictEqual(syncResp.status, 200);
    assert.strictEqual(syncResp.body.data.totalBenchmarks, 6);

    console.log('   ✅ All REST endpoints (/api/v1/benchmarks, /compare, /sync) responded HTTP 200!');
  } finally {
    server.close();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  }

  console.log('\n====================================================================');
  console.log('🎉 PHASE 15 BENCHMARK & TRI SYNC TESTS PASSED 100%!');
  console.log('====================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Phase 15 test failed:', err);
  process.exit(1);
});
