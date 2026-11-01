/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Capital Gains Tax Routes
 */

import { Router } from 'express';
import { TaxController } from '../controllers/taxController.js';

const router = Router();

// Realized capital gains tax report (Budget 2024 compliance)
router.get('/capital-gains/realized', TaxController.getRealizedReport);

// Unrealized capital gains & tax harvesting analysis
router.get('/capital-gains/unrealized', TaxController.getUnrealizedReport);

export default router;

