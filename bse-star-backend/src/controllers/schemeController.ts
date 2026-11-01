/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Scheme Catalog & NAV Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AmfiNavService } from '../services/amfiNavService.js';
import { AppError } from '../middleware/errorHandler.js';

export class SchemeController {
  /**
   * GET /api/v1/schemes/search?q=HDFC&category=Large+Cap&plan=Regular&limit=25
   */
  public static async searchSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const amfiService = AmfiNavService.getInstance();

      // Ensure catalog is populated
      if (!amfiService.getLastSyncSummary()) {
        await amfiService.syncSchemes();
      }

      const query = (req.query.q as string) || '';
      const category = req.query.category as string | undefined;
      const amc = req.query.amc as string | undefined;
      const plan = (req.query.plan as string)?.toLowerCase() === 'direct' ? 'Direct' : (req.query.plan as string)?.toLowerCase() === 'regular' ? 'Regular' : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

      const results = amfiService.searchSchemes({ query, category, amc, plan, limit });

      res.status(200).json({
        success: true,
        count: results.length,
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/schemes/categories
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const amfiService = AmfiNavService.getInstance();
      if (!amfiService.getLastSyncSummary()) {
        await amfiService.syncSchemes();
      }

      const categories = amfiService.getAllCategories();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/schemes/:code
   */
  public static async getSchemeByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const amfiService = AmfiNavService.getInstance();
      if (!amfiService.getLastSyncSummary()) {
        await amfiService.syncSchemes();
      }

      const code = String(req.params.code);
      const scheme = amfiService.getScheme(code);

      if (!scheme) {
        throw new AppError(`Scheme with code or ISIN '${code}' not found in AMFI master`, 404, 'SCHEME_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: scheme,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/schemes/sync
   */
  public static async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forceLive = req.body?.forceLive === true;
      const persistToDb = req.body?.persistToDb === true;

      const amfiService = AmfiNavService.getInstance();
      const summary = await amfiService.syncSchemes({ forceLive, persistToDb });

      res.status(200).json({
        success: true,
        message: `Successfully synchronized ${summary.totalParsed} mutual fund schemes across ${summary.uniqueAmcs} AMCs`,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}
