/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Portfolio Routes
 */

import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolioController.js';

const router = Router();

// Portfolio summary with XIRR, valuation, and asset allocation
router.get('/summary', PortfolioController.getSummary);

// Portfolio holdings breakdown
router.get('/holdings', PortfolioController.getHoldings);

// Historical transactions ledger
router.get('/transactions', PortfolioController.getTransactions);

// Import CAMS / KFintech CAS statement
router.post('/cas/import', PortfolioController.importCas);

export default router;

