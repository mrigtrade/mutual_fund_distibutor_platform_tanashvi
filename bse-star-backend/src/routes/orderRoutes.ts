/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Order Routes
 */

import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { tenantContextMiddleware } from '../middleware/tenantContext.js';

const router = Router();

router.use(tenantContextMiddleware);
router.post('/create', OrderController.createOrder);

export default router;

