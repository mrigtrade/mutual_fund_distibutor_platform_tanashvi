/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Systematic Transactions (SIP/STP/SWP) Routes
 */

import { Router } from 'express';
import { SxpController } from '../controllers/sxpController.js';
import { tenantContextMiddleware } from '../middleware/tenantContext.js';

const router = Router();

router.use(tenantContextMiddleware);
router.post('/register', SxpController.registerSxp);

export default router;

