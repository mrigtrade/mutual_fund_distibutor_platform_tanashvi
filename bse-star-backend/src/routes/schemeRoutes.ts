/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Scheme Catalog & NAV Routes
 */

import { Router } from 'express';
import { SchemeController } from '../controllers/schemeController.js';

const router = Router();

router.get('/search', SchemeController.searchSchemes);
router.get('/categories', SchemeController.getCategories);
router.get('/:code', SchemeController.getSchemeByCode);
router.post('/sync', SchemeController.triggerSync);

export default router;

