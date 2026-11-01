/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * BSE StAR MF Webhook Callback Routes
 */

import { Router, Request, Response } from 'express';
import { BseWebhookController, BseWebhookCallbackPayload } from '../controllers/bseWebhookController.js';

const router = Router();

router.post('/bse', async (req: Request, res: Response) => {
  try {
    const payload = req.body as BseWebhookCallbackPayload;
    const controller = BseWebhookController.getInstance();
    const result = await controller.processWebhook(payload);

    res.status(result.statusCode).json({
      success: result.status === 'success',
      message: result.message,
      actionTaken: result.actionTaken,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

