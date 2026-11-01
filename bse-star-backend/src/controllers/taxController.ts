/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Capital Gains Tax Controller (Budget 2024 Compliance)
 * 
 * Implements the AdvisorKhoj "Generate capital gains report for Ramesh" feature.
 */

import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/portfolioService.js';

export class TaxController {
  private static portfolioService = PortfolioService.getInstance();

  /**
   * GET /api/v1/tax/capital-gains/realized
   * Query params:
   *  - client_code (default: 'UCC-RAMESH-001')
   *  - fy (e.g. '2024-2025', '2025-2026', default: '2024-2025')
   */
  public static async getRealizedReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = (req.query.client_code as string) || 'UCC-RAMESH-001';
      const financialYear = (req.query.fy as string) || '2024-2025';

      const report = await TaxController.portfolioService.getRealizedCapitalGains(
        tenantId,
        clientCode,
        financialYear
      );

      res.status(200).json({
        success: true,
        report_title: `Mutual Fund Capital Gains Statement (FY ${financialYear})`,
        statutory_regime: report.budget_regime,
        notes: [
          'Calculated strictly per Union Budget 2024 (Finance Act No. 2, 2024) provisions.',
          'Equity STCG: 20% on redemptions w.e.f. July 23, 2024 (15% prior).',
          'Equity LTCG: 12.5% on redemptions w.e.f. July 23, 2024 (10% prior) with ₹1,25,000 annual exemption.',
          'Section 112A Grandfathering applied to pre-31-Jan-2018 acquisitions.',
          'Section 50AA applied to specified debt mutual funds acquired on or after April 1, 2023.',
          'Includes 4% Health & Education Cess.'
        ],
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tax/capital-gains/unrealized
   * Query params:
   *  - client_code (default: 'UCC-RAMESH-001')
   *  - as_of_date (optional, YYYY-MM-DD)
   */
  public static async getUnrealizedReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000001';
      const clientCode = (req.query.client_code as string) || 'UCC-RAMESH-001';
      const asOfDate = req.query.as_of_date as string | undefined;

      const report = await TaxController.portfolioService.getUnrealizedCapitalGains(
        tenantId,
        clientCode,
        asOfDate
      );

      res.status(200).json({
        success: true,
        report_title: 'Unrealized Capital Gains & Tax-Loss Harvesting Analysis',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

