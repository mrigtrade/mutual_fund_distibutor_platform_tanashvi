/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * MFD Proposal Basket Routes
 */

import { Router } from 'express';
import { ProposalController } from '../controllers/proposalController.js';

const router = Router();

// Create proposal basket & generate magic cart link
router.post('/create', ProposalController.create);

// Investor opens magic cart link
router.get('/view', ProposalController.view);

// Investor executes proposal cart
router.post('/execute', ProposalController.execute);

// List proposals created by MFD
router.get('/list', ProposalController.list);

// Get single proposal by ID
router.get('/:id', ProposalController.getById);

export default router;

