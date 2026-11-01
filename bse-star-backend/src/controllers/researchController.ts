/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Mutual Fund Research & Analytics Controller
 * Parity with AdvisorKhoj Research Tools
 */

import { Request, Response } from 'express';
import { RollingReturnsService } from '../services/rollingReturnsService.js';
import { RiskRatiosService } from '../services/riskRatiosService.js';
import { PortfolioOverlapService } from '../services/portfolioOverlapService.js';
import { ResearchDataService } from '../services/researchDataService.js';

export class ResearchController {
  /**
   * GET /api/v1/research/schemes
   * Returns list of flagship schemes available for research & analytics
   */
  public static async getResearchSchemes(req: Request, res: Response): Promise<void> {
    try {
      const dataService = ResearchDataService.getInstance();
      const schemes = dataService.getResearchSchemesList();
      res.status(200).json({
        success: true,
        count: schemes.length,
        data: schemes
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'RESEARCH_ERROR', message: error.message }
      });
    }
  }

  /**
   * GET /api/v1/research/rolling-returns
   * Query: schemeCode, years (1, 3, 5, 7)
   */
  public static async getRollingReturns(req: Request, res: Response): Promise<void> {
    try {
      const schemeCode = (req.query.schemeCode as string) || '122639'; // Parag Parikh Flexi Cap default
      const years = parseInt(req.query.years as string, 10) || 3;

      const service = RollingReturnsService.getInstance();
      const result = service.calculateRollingReturns(schemeCode, years);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ROLLING_RETURNS_ERROR', message: error.message }
      });
    }
  }

  /**
   * GET /api/v1/research/risk-ratios
   * Query: schemeCode, periodYears, rf
   */
  public static async getRiskRatios(req: Request, res: Response): Promise<void> {
    try {
      const schemeCode = (req.query.schemeCode as string) || '122639';
      const periodYears = parseInt(req.query.periodYears as string, 10) || 3;
      const rf = parseFloat(req.query.rf as string) || 6.50;

      const service = RiskRatiosService.getInstance();
      const result = service.calculateRiskRatios(schemeCode, periodYears, rf);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'RISK_RATIOS_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/research/compare
   * Body: { schemeCodes: string[] } (2 to 4 schemes)
   */
  public static async compareSchemes(req: Request, res: Response): Promise<void> {
    try {
      const { schemeCodes } = req.body;
      if (!Array.isArray(schemeCodes) || schemeCodes.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'schemeCodes array required (up to 4 schemes).' }
        });
        return;
      }

      const dataService = ResearchDataService.getInstance();
      const items = schemeCodes.slice(0, 4).map((code) => dataService.getSchemeProfile(code));

      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SCHEME_COMPARISON_ERROR', message: error.message }
      });
    }
  }

  /**
   * POST /api/v1/research/overlap
   * Body: { schemeCodeA: string, schemeCodeB: string }
   */
  public static async getPortfolioOverlap(req: Request, res: Response): Promise<void> {
    try {
      const { schemeCodeA, schemeCodeB } = req.body;
      if (!schemeCodeA || !schemeCodeB) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'schemeCodeA and schemeCodeB are required.' }
        });
        return;
      }

      const service = PortfolioOverlapService.getInstance();
      const result = service.calculateOverlap(schemeCodeA, schemeCodeB);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'PORTFOLIO_OVERLAP_ERROR', message: error.message }
      });
    }
  }
}

