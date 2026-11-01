/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Multi-Tenant Middleware & RLS Context Extractor
 */

import { Request, Response, NextFunction } from 'express';
import { TenantContext, DEFAULT_TANASHVI_TENANT } from '../types/tenant.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      tenantContext: TenantContext;
    }
  }
}

export function tenantContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || DEFAULT_TANASHVI_TENANT.tenantId;
    const tenantCode = (req.headers['x-tenant-code'] as string) || DEFAULT_TANASHVI_TENANT.tenantCode;
    const organizationName = (req.headers['x-org-name'] as string) || DEFAULT_TANASHVI_TENANT.organizationName;
    const arnNumber = (req.headers['x-arn'] as string) || DEFAULT_TANASHVI_TENANT.arnNumber;
    
    // Sub-broker routing for child MFDs
    const subBrokerArn = req.headers['x-sub-broker-arn'] as string | undefined;
    const subBrokerCode = req.headers['x-sub-broker-code'] as string | undefined;

    // SEBI EUIN compliance
    const euin = (req.headers['x-euin'] as string) || DEFAULT_TANASHVI_TENANT.euin;
    const rawEuinFlag = req.headers['x-euin-flag'] as string | undefined;
    const euinFlag = rawEuinFlag ? (rawEuinFlag.toUpperCase() === 'Y' || rawEuinFlag === 'true') : true;

    // AMFI ARN format validation: ARN-XXXXX or numeric
    const cleanArn = arnNumber.startsWith('ARN-') ? arnNumber : `ARN-${arnNumber}`;
    if (!/^ARN-\d+$/i.test(cleanArn)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ARN_FORMAT',
          message: `Invalid AMFI ARN format: '${arnNumber}'. Must be 'ARN-' followed by digits.`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // EUIN format validation if supplied: E followed by 6 digits
    if (euin && !/^E\d{6}$/i.test(euin)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EUIN_FORMAT',
          message: `Invalid SEBI EUIN format: '${euin}'. Must start with 'E' followed by 6 digits.`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const isPlatformOwner = cleanArn === DEFAULT_TANASHVI_TENANT.arnNumber;

    req.tenantContext = {
      tenantId,
      tenantCode,
      organizationName,
      arnNumber: cleanArn,
      isPlatformOwner,
      subBrokerArn: subBrokerArn ? (subBrokerArn.startsWith('ARN-') ? subBrokerArn : `ARN-${subBrokerArn}`) : undefined,
      subBrokerCode,
      euin,
      euinFlag
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_CONTEXT_ERROR',
        message: `Failed to extract tenant context: ${error.message}`
      },
      timestamp: new Date().toISOString()
    });
  }
}

