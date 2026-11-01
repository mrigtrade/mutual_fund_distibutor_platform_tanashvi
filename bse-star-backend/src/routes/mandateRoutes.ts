/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mandate Routes (eNACH, UPI AutoPay)
 */

import { Router } from 'express';
import { MandateController } from '../controllers/mandateController.js';
import { tenantContextMiddleware } from '../middleware/tenantContext.js';

const router = Router();

router.use(tenantContextMiddleware);
router.post('/create', MandateController.registerMandate);

export default router;

