/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * AMFI Open NAV & Scheme Master Synchronization Testbench
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Operates self-contained locally
 * using pre-bundled AMFI seed fixtures when live networks are inaccessible.
 * 
 * Verifies:
 * 1. AMFI NAVAll semicolon feed parser
 * 2. Plan (Direct/Regular) and Option (Growth/IDCW) extraction
 * 3. SEBI Statutory Cut-off mapping (Liquid: 13:30 IST vs Equity: 15:00 IST)
 * 4. Multi-criteria Scheme Search (Keyword, AMC, Category, Plan)
 * 5. Scheme lookup by AMFI code and ISIN
 * 6. REST API Gateway endpoints (/api/v1/schemes/*)
 */

import { createApp } from '../app.js';
import { Server } from 'http';
import { AmfiNavService } from '../services/amfiNavService.js';

async function runAmfiNavTestbench() {
  console.log('========================================================================');
  console.log('📰 Tanashvi B2B Mutual Fund Platform: AMFI Open NAV & Master Testbench');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('========================================================================\n');

  const amfiService = AmfiNavService.getInstance();

  // --------------------------------------------------------------------------
  // 1. FEED PARSING & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  console.log('📥 1. Testing AMFI NAV Feed Parsing & Synchronization...');
  const summary = await amfiService.syncSchemes();

  console.log(`   Source:              ${summary.source}`);
  console.log(`   Total Schemes:       ${summary.totalParsed}`);
  console.log(`   Unique AMCs:         ${summary.uniqueAmcs}`);
  console.log(`   Distinct Categories: ${summary.categoriesFound.length}`);
  console.log(`   NAV Valuation Date:  ${summary.navDate}`);

  if (summary.totalParsed < 15) throw new Error(`Expected at least 15 schemes, got ${summary.totalParsed}`);
  if (summary.uniqueAmcs < 5) throw new Error(`Expected at least 5 AMCs, got ${summary.uniqueAmcs}`);
  console.log('   ✅ AMFI Feed parsing tests passed.\n');

  // --------------------------------------------------------------------------
  // 2. METADATA & STATUTORY CUT-OFF CLASSIFICATION
  // --------------------------------------------------------------------------
  console.log('⚖️  2. Testing SEBI Cut-Off & Metadata Classification...');

  // Case A: Liquid Fund -> 13:30:00 IST Cut-off
  const hdfcLiquid = amfiService.getScheme('100033'); // HDFC Liquid Fund Regular Growth
  console.log(`   Scheme: ${hdfcLiquid?.schemeName}`);
  console.log(`   Category: ${hdfcLiquid?.category} | Cutoff: ${hdfcLiquid?.cutoffTime}`);
  if (!hdfcLiquid || hdfcLiquid.cutoffTime !== '13:30:00') {
    throw new Error('Liquid fund must have 13:30:00 IST statutory cut-off');
  }

  // Case B: Equity Fund -> 15:00:00 IST Cut-off
  const ppfc = amfiService.getScheme('122639'); // Parag Parikh Flexi Cap Regular
  console.log(`   Scheme: ${ppfc?.schemeName}`);
  console.log(`   Category: ${ppfc?.category} | Cutoff: ${ppfc?.cutoffTime}`);
  if (!ppfc || ppfc.cutoffTime !== '15:00:00') {
    throw new Error('Equity fund must have 15:00:00 IST statutory cut-off');
  }

  // Case C: Direct vs Regular & Growth vs IDCW
  if (ppfc.plan !== 'Regular' || ppfc.option !== 'Growth') {
    throw new Error(`Plan/Option derivation incorrect for Parag Parikh: ${ppfc.plan} ${ppfc.option}`);
  }

  const ppfcDirect = amfiService.getScheme('122640');
  if (!ppfcDirect || ppfcDirect.plan !== 'Direct') {
    throw new Error('Direct plan derivation failed');
  }
  console.log('   ✅ Metadata & statutory cut-off tests passed.\n');

  // --------------------------------------------------------------------------
  // 3. SEARCH & FILTERING ENGINE
  // --------------------------------------------------------------------------
  console.log('🔍 3. Testing Scheme Search & Multi-Criteria Filtering...');

  // Search by keyword "Parag Parikh"
  const ppResults = amfiService.searchSchemes({ query: 'Parag Parikh' });
  console.log(`   Query: 'Parag Parikh' -> Found ${ppResults.length} schemes`);
  if (ppResults.length < 2) throw new Error('Failed to find Parag Parikh schemes');

  // Search by AMC "HDFC" + Category "Liquid"
  const hdfcLiquidResults = amfiService.searchSchemes({ amc: 'HDFC', category: 'Liquid' });
  console.log(`   AMC: 'HDFC' + Category: 'Liquid' -> Found ${hdfcLiquidResults.length} schemes`);
  if (hdfcLiquidResults.length < 2) throw new Error('Failed to filter HDFC Liquid schemes');

  // Lookup by ISIN
  const isinMatch = amfiService.getScheme('INF769K01010'); // HDFC Top 100 Regular
  console.log(`   Lookup ISIN: 'INF769K01010' -> Found: ${isinMatch?.schemeName} (NAV: ₹${isinMatch?.nav})`);
  if (!isinMatch || !isinMatch.schemeName.includes('HDFC Top 100')) {
    throw new Error('ISIN lookup failed');
  }
  console.log('   ✅ Scheme Search & filtering tests passed.\n');

  // --------------------------------------------------------------------------
  // 4. REST API HTTP ENDPOINTS
  // --------------------------------------------------------------------------
  console.log('🌐 4. Testing Scheme Catalog REST API Endpoints...');
  const app = createApp();
  let server: Server;
  let baseUrl = '';

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });

  try {
    // A: GET /api/v1/schemes/search?q=HDFC&plan=Regular
    const searchRes = await fetch(`${baseUrl}/api/v1/schemes/search?q=HDFC&plan=Regular&limit=10`);
    const searchJson = await searchRes.json();
    console.log(`   GET /api/v1/schemes/search: Status ${searchRes.status} (Count: ${searchJson.count})`);
    if (searchRes.status !== 200 || !searchJson.success || searchJson.count === 0) {
      throw new Error('Search API endpoint failed');
    }

    // B: GET /api/v1/schemes/categories
    const catRes = await fetch(`${baseUrl}/api/v1/schemes/categories`);
    const catJson = await catRes.json();
    console.log(`   GET /api/v1/schemes/categories: Status ${catRes.status} (Categories: ${catJson.count})`);
    if (catRes.status !== 200 || catJson.count === 0) {
      throw new Error('Categories API endpoint failed');
    }

    // C: GET /api/v1/schemes/122639 (Parag Parikh Flexi Cap)
    const schemeRes = await fetch(`${baseUrl}/api/v1/schemes/122639`);
    const schemeJson = await schemeRes.json();
    console.log(`   GET /api/v1/schemes/122639: Status ${schemeRes.status} (NAV: ₹${schemeJson.data.nav} on ${schemeJson.data.navDate})`);
    if (schemeRes.status !== 200 || !schemeJson.data.schemeName) {
      throw new Error('Get scheme by code endpoint failed');
    }

    // D: GET /api/v1/schemes/INVALID_CODE -> 404
    const badRes = await fetch(`${baseUrl}/api/v1/schemes/INVALID_NONEXISTENT_9999`);
    const badJson = await badRes.json();
    console.log(`   GET /api/v1/schemes/INVALID_CODE: Status ${badRes.status} (Code: ${badJson.error?.code})`);
    if (badRes.status !== 404 || badJson.error?.code !== 'SCHEME_NOT_FOUND') {
      throw new Error('Expected 404 SCHEME_NOT_FOUND on invalid code');
    }

    // E: POST /api/v1/schemes/sync
    const syncRes = await fetch(`${baseUrl}/api/v1/schemes/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceLive: false })
    });
    const syncJson = await syncRes.json();
    console.log(`   POST /api/v1/schemes/sync: Status ${syncRes.status} (${syncJson.message})`);
    if (syncRes.status !== 200 || !syncJson.success) {
      throw new Error('Trigger sync endpoint failed');
    }

    console.log('   ✅ All REST API scheme catalog endpoints verified successfully.');
  } finally {
    server!.close();
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL AMFI OPEN NAV & SCHEME MASTER TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================');
}

runAmfiNavTestbench().catch((err) => {
  console.error('❌ AMFI NAV testbench failed:', err);
  process.exit(1);
});

