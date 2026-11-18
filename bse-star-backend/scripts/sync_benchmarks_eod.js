#!/usr/bin/env node
/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Automated Weekday EOD Benchmark TRI Sync Script (for Oracle Cloud Cron)
 *
 * Suggested Crontab entry (runs Mon-Fri at 16:30 UTC / 22:00 IST after AMFI/NSE EOD publish):
 *   30 16 * * 1-5 /usr/bin/node /home/ubuntu/bse-backend/scripts/sync_benchmarks_eod.js >> /home/ubuntu/bse-backend/logs/benchmark_sync.log 2>&1
 */

const BACKEND_URL = process.env.TANASHVI_BACKEND_URL || 'http://127.0.0.1:4000';

async function runSync() {
  console.log(`[${new Date().toISOString()}] Starting automated EOD Benchmark TRI Sync against ${BACKEND_URL}...`);
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/benchmarks/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceLive: true }),
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const summary = json.data;
    console.log(
      `[${new Date().toISOString()}] Sync completed: ${summary.liveUpdatedCount}/${summary.totalBenchmarks} benchmarks updated live.`
    );
    for (const item of summary.results || []) {
      console.log(`  - ${item.name}: ${item.status} (${item.source}) | Latest: ${item.latestDate} (${item.latestValue})`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Benchmark TRI Sync Error:`, err.message);
    process.exitCode = 1;
  }
}

runSync();
