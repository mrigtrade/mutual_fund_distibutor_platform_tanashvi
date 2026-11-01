/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * HTTP Server Bootstrap Entrypoint
 */

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { BseGatewayService } from './services/bseGatewayService.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  const bseService = BseGatewayService.getInstance();
  console.log('========================================================================');
  console.log(`🚀 Tanashvi B2B Mutual Fund Platform API Server running on port ${PORT}`);
  console.log(`🛡️  BSE StAR MF Gateway Mode: [${bseService.getGatewayMode()}]`);
  console.log(`🏢 Master Member Code:        [${bseService.getMemberCode()}]`);
  console.log(`🌐 Health Check:              http://localhost:${PORT}/health`);
  console.log('========================================================================');
});

export { app, server };

