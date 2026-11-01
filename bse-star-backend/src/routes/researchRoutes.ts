/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 11: Mutual Fund Research Routes
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/researchController.js';

const router = Router();

// Flagship schemes available for analytics
router.get('/schemes', ResearchController.getResearchSchemes);

// Rolling returns vs Nifty 50 TRI
router.get('/rolling-returns', ResearchController.getRollingReturns);

// Risk-adjusted volatility ratios (Standard Deviation, Sharpe, Beta, Alpha, Sortino)
router.get('/risk-ratios', ResearchController.getRiskRatios);

// 2-to-4 scheme side-by-side comparison matrix
router.post('/compare', ResearchController.compareSchemes);

// Fund portfolio overlap analyzer
router.post('/overlap', ResearchController.getPortfolioOverlap);

export default router;

