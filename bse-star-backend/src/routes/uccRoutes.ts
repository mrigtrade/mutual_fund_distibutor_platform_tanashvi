/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Investor UCC Routes
 */

import { Router } from 'express';
import { UccController } from '../controllers/uccController.js';
import { tenantContextMiddleware } from '../middleware/tenantContext.js';

const router = Router();

router.use(tenantContextMiddleware);
router.post('/register', UccController.registerUcc);

export default router;

