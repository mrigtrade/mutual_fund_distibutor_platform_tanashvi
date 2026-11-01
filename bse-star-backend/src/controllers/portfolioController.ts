/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Portfolio Controller
 */

import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/portfolioService.js';
import { CasParserService } from '../services/casParserService.js';
import { CasStatementPayload } from '../types/portfolio.js';

export class PortfolioController {
  private static portfolioService = PortfolioService.getInstance();

  /**
   * GET /api/v1/portfolio/summary
   * Query params: client_code (optional, defaults to seeded Ramesh Sharma 'UCC-RAMESH-001')
   */
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = (req.query.client_code as string) || 'UCC-RAMESH-001';
      const valuationDate = req.query.valuation_date as string | undefined;

      const summary = await PortfolioController.portfolioService.getPortfolioSummary(
        tenantId,
        clientCode,
        valuationDate
      );

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/portfolio/holdings
   * Query params: client_code
   */
  public static async getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = (req.query.client_code as string) || 'UCC-RAMESH-001';

      const holdings = await PortfolioController.portfolioService.getHoldings(tenantId, clientCode);

      res.status(200).json({
        success: true,
        client_code: clientCode,
        count: holdings.length,
        data: holdings,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/portfolio/transactions
   * Query params: client_code
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = (req.query.client_code as string) || 'UCC-RAMESH-001';

      const transactions = await PortfolioController.portfolioService.getTransactions(tenantId, clientCode);

      res.status(200).json({
        success: true,
        client_code: clientCode,
        count: transactions.length,
        data: transactions,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/portfolio/cas/import
   * Ingests JSON or CSV CAS statement
   */
  public static async importCas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = req.body.client_code || 'UCC-CLIENT-001';

      if (req.body.csv_content) {
        const parsed = CasParserService.parseCsvCas(
          req.body.csv_content,
          req.body.investor_pan || 'AAAPS1234K',
          req.body.investor_name || 'Valued Investor',
          tenantId,
          clientCode
        );

        res.status(200).json({
          success: true,
          message: `Successfully ingested CSV CAS statement for ${parsed.investor_pan}`,
          data: {
            investor_pan: parsed.investor_pan,
            investor_name: parsed.investor_name,
            total_folios: parsed.total_folios_count,
            total_transactions: parsed.total_transactions_count,
            total_schemes: parsed.holdings.length
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!req.body.folios || !Array.isArray(req.body.folios)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CAS_PAYLOAD',
            message: 'Invalid CAS payload. Must provide "folios" array or "csv_content" string.'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const payload: CasStatementPayload = req.body;
      const parsed = await PortfolioController.portfolioService.importCasStatement(
        tenantId,
        clientCode,
        payload
      );

      res.status(200).json({
        success: true,
        message: `Successfully imported CAS statement for ${parsed.investor_name} (${parsed.investor_pan})`,
        data: {
          client_code: clientCode,
          investor_pan: parsed.investor_pan,
          investor_name: parsed.investor_name,
          statement_source: parsed.statement_source,
          total_folios: parsed.total_folios_count,
          total_transactions: parsed.total_transactions_count,
          total_schemes: parsed.holdings.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

