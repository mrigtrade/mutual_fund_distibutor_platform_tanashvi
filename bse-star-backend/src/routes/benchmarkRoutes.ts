/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 15: Multi-Benchmark TRI & Portfolio Visualization Routes
 */

import { Router } from 'express';
import { BenchmarkController } from '../controllers/benchmarkController.js';

const router = Router();

// List all available TRI benchmarks with freshness metadata & trailing returns
router.get('/', BenchmarkController.listBenchmarks);

// Historical TRI series for a specific benchmark
router.get('/:id/history', BenchmarkController.getBenchmarkHistory);

// Compare a portfolio (Client or Practice AUM Book) against any standard or blended benchmark
router.post('/compare', BenchmarkController.comparePortfolio);

// Trigger EOD live synchronization via AMFI Direct Index Fund TRI proxies
router.post('/sync', BenchmarkController.syncBenchmarks);

// Bulk import official NSE/BSE TRI CSV data
router.post('/import', BenchmarkController.importCsv);

// Single-day manual TRI upsert
router.post('/manual', BenchmarkController.upsertManual);

export default router;
