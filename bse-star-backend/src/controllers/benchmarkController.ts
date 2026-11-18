/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 15: Multi-Benchmark TRI & Portfolio Visualization Controller
 */

import { Request, Response } from 'express';
import { BenchmarkService } from '../services/benchmarkService.js';
import { StandardBenchmarkId } from '../types/benchmark.js';

export class BenchmarkController {
  /**
   * GET /api/v1/benchmarks
   * Returns all available TRI benchmarks with freshness metadata and trailing CAGRs.
   */
  public static listBenchmarks(req: Request, res: Response): void {
    try {
      const svc = BenchmarkService.getInstance();
      const benchmarks = svc.listBenchmarks();
      res.status(200).json({
        success: true,
        data: {
          benchmarks,
          supportsCustomBlended: true,
          updateMechanisms: [
            'POST /api/v1/benchmarks/sync (Automated Live EOD Sync via AMFI Direct Index TRI Proxies)',
            'POST /api/v1/benchmarks/import (Official NSE/BSE TRI CSV Bulk Upload)',
            'POST /api/v1/benchmarks/manual (Single-Day TRI Override / Entry)'
          ]
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  /**
   * GET /api/v1/benchmarks/:id/history?limit=120
   */
  public static getBenchmarkHistory(req: Request, res: Response): void {
    try {
      const id = req.params.id as StandardBenchmarkId;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const svc = BenchmarkService.getInstance();
      const history = svc.getBenchmarkHistory(id, limit);
      res.status(200).json({
        success: true,
        data: {
          benchmarkId: id,
          count: history.length,
          series: history
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/benchmarks/compare
   * Computes portfolio vs. benchmark curve, PME XIRR, Alpha, Drawdown, and Capture Ratios.
   */
  public static comparePortfolio(req: Request, res: Response): void {
    try {
      const {
        portfolioName,
        benchmarkId = 'NIFTY_50_TRI',
        horizon = '3Y',
        totalInvested,
        currentValue,
        portfolioXirrPct,
        assetAllocation,
        cashflows
      } = req.body;

      if (typeof totalInvested !== 'number' || typeof currentValue !== 'number') {
        res.status(400).json({
          success: false,
          error: { message: 'totalInvested and currentValue must be numeric values.' }
        });
        return;
      }

      const svc = BenchmarkService.getInstance();
      const result = svc.comparePortfolioAgainstBenchmark({
        portfolioName,
        benchmarkId,
        horizon,
        totalInvested,
        currentValue,
        portfolioXirrPct: typeof portfolioXirrPct === 'number' ? portfolioXirrPct : 14.0,
        assetAllocation: assetAllocation || { equityPct: 80, debtPct: 15, liquidPct: 5 },
        cashflows
      });

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/benchmarks/sync
   * Triggers live EOD TRI update via AMFI/MFAPI open feeds (with graceful offline fallback).
   */
  public static async syncBenchmarks(req: Request, res: Response): Promise<void> {
    try {
      const { forceLive = true, benchmarkIds } = req.body || {};
      const svc = BenchmarkService.getInstance();
      const summary = await svc.syncBenchmarks({
        forceLive: Boolean(forceLive),
        benchmarkIds
      });
      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/benchmarks/import
   * Ingests official NSE Indices / BSE Sensex TRI CSV export text.
   */
  public static importCsv(req: Request, res: Response): void {
    try {
      const { benchmarkId, csvContent } = req.body || {};
      if (!benchmarkId || !csvContent) {
        res.status(400).json({
          success: false,
          error: { message: 'benchmarkId and csvContent are required.' }
        });
        return;
      }
      const svc = BenchmarkService.getInstance();
      const result = svc.importBenchmarkCsv(benchmarkId as StandardBenchmarkId, csvContent, 'CSV_IMPORT');
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/benchmarks/manual
   * Upserts a single trading day TRI value (for admin EOD manual update).
   */
  public static upsertManual(req: Request, res: Response): void {
    try {
      const { benchmarkId, date, value } = req.body || {};
      if (!benchmarkId || !date || typeof value !== 'number') {
        res.status(400).json({
          success: false,
          error: { message: 'benchmarkId, date, and numeric value are required.' }
        });
        return;
      }
      const svc = BenchmarkService.getInstance();
      const result = svc.upsertManualPoint(benchmarkId as StandardBenchmarkId, date, value);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
}
