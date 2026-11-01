/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Financial Calculator Routes
 */

import { Router } from 'express';
import { CalculatorController } from '../controllers/calculatorController.js';

const router = Router();

// SIP Engines
router.post('/sip', CalculatorController.calculateSip);
router.post('/step-up-sip', CalculatorController.calculateStepUpSip);
router.post('/target-sip', CalculatorController.calculateTargetSip);

// Goal Planners
router.post('/crorepati', CalculatorController.calculateCrorepati);
router.post('/education', CalculatorController.calculateChildEducation);
router.post('/retirement', CalculatorController.calculateRetirement);

// Wealth Engines
router.post('/lumpsum', CalculatorController.calculateLumpsum);
router.post('/swp', CalculatorController.calculateSwp);
router.post('/stp', CalculatorController.calculateStp);

export default router;

