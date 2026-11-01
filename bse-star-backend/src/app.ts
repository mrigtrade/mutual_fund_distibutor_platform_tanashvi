/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Express Application Configuration
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * runs self-contained locally against simulated BSE responses by default, while
 * providing a seamless hot-toggle to live BSE HTTPS endpoints once whitelisted.
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import uccRoutes from './routes/uccRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import sxpRoutes from './routes/sxpRoutes.js';
import mandateRoutes from './routes/mandateRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import calculatorRoutes from './routes/calculatorRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import researchRoutes from './routes/researchRoutes.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { BseGatewayService } from './services/bseGatewayService.js';

export function createApp(): Express {
  const app = express();

  // Core Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // System Health & Diagnostics Endpoint
  app.get('/health', (req: Request, res: Response) => {
    const bseService = BseGatewayService.getInstance();
    res.status(200).json({
      status: 'UP',
      platform: 'Tanashvi B2B Mutual Fund Platform',
      version: '2.0.0',
      bse_gateway_mode: bseService.getGatewayMode(),
      member_code: bseService.getMemberCode(),
      fingerprint_configured: !!bseService.getFingerprint(),
      timestamp: new Date().toISOString()
    });
  });

  // REST API v1 Routes
  app.use('/api/v1/ucc', uccRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/sxp', sxpRoutes);
  app.use('/api/v1/mandates', mandateRoutes);
  app.use('/api/v1/webhooks', webhookRoutes);
  app.use('/api/v1/calculators', calculatorRoutes);
  app.use('/api/v1/schemes', schemeRoutes);
  app.use('/api/v1/portfolio', portfolioRoutes);
  app.use('/api/v1/tax', taxRoutes);
  app.use('/api/v1/proposals', proposalRoutes);
  app.use('/api/v1/research', researchRoutes);

  // 404 Not Found Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`
      },
      timestamp: new Date().toISOString()
    });
  });

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
}

