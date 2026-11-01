/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Systematic Transactions (SIP, STP, SWP) Controller
 */

import { Request, Response, NextFunction } from 'express';
import { BseGatewayService } from '../services/bseGatewayService.js';
import { SystematicRegistration, SxpFrequency, SxpType } from '../types/order.js';
import { AppError } from '../middleware/errorHandler.js';

export class SxpController {
  public static async registerSxp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = req.body;

      const uccClientCode = b.clientCode || b.client_code || b.uccClientCode;
      const srcSchemeBseCode = b.schemeBseCode || b.scheme_bse_code || b.srcSchemeBseCode;
      const installmentAmount = Number(b.installmentAmount || b.installment_amount || b.amount || 0);

      if (!uccClientCode || !srcSchemeBseCode || installmentAmount <= 0) {
        throw new AppError('Missing required fields: client_code, scheme_bse_code, and a positive installment_amount are mandatory', 400, 'VALIDATION_ERROR');
      }

      const rawFreq = (b.frequency || 'm').toLowerCase();
      const frequency: SxpFrequency = rawFreq.startsWith('m') ? 'm' : rawFreq.startsWith('w') ? 'w' : rawFreq.startsWith('q') ? 'q' : 'd';
      const startDate = b.startDate || b.start_date || '2026-11-10';

      const fullSxp: SystematicRegistration = {
        id: `sxp_${Date.now()}`,
        tenantId: req.tenantContext.tenantId,
        uccId: b.uccId || b.ucc_id || 'ucc_default',
        uccClientCode,
        memSxpRefId: b.memSxpRefId || b.mem_sxp_ref_id || `SIP-TAN-${Date.now()}`,
        sxpType: (b.sxpType || b.sxp_type || 'SIP') as SxpType,
        srcSchemeBseCode,
        destSchemeBseCode: b.destSchemeBseCode || b.dest_scheme_bse_code,
        physOrDemat: (b.physOrDemat || b.order_mode === 'DEMAT') ? 'D' : 'P',
        frequency,
        installmentAmount,
        installmentDay: b.installmentDay || b.installment_day || 10,
        startDate,
        endDate: b.endDate || b.end_date,
        isPerpetual: b.isPerpetual ?? b.is_perpetual ?? true,
        totalInstallments: b.totalInstallments || b.total_installments || 60,
        firstOrderToday: b.firstOrderToday ?? b.first_order_today ?? false,
        mandateId: b.mandateId || b.mandate_id || b.bse_mandate_id,
        hasTopup: false,
        units: 0,
        isUnits: false,
        regulatory: {
          subBrArn: req.tenantContext.subBrokerArn || (req.tenantContext.isPlatformOwner ? undefined : req.tenantContext.arnNumber) || req.tenantContext.arnNumber,
          subBrCode: req.tenantContext.subBrokerCode,
          euin: req.tenantContext.euin,
          euinFlag: req.tenantContext.euinFlag
        },
        status: 'INITIATED'
      };

      const bseService = BseGatewayService.getInstance();
      const bseResponse = await bseService.registerSxp(fullSxp, req.tenantContext);

      const bseRegNo = bseResponse.data?.bse_reg_no || bseResponse.data?.bse_registration_no;
      const isSuccess = bseResponse.status === 200 || bseResponse.status === 'success' || !!bseRegNo;

      if (isSuccess && bseRegNo) {
        fullSxp.bseRegNo = bseRegNo;
        fullSxp.status = 'ACTIVE';
      }

      res.status(isSuccess ? 201 : 400).json({
        success: isSuccess,
        data: {
          sxp_id: fullSxp.id,
          mem_sxp_ref_id: fullSxp.memSxpRefId,
          bse_registration_no: fullSxp.bseRegNo,
          sxp_type: fullSxp.sxpType,
          state: fullSxp.status,
          installment_amount: fullSxp.installmentAmount,
          frequency: fullSxp.frequency,
          tenant: {
            tenant_id: req.tenantContext.tenantId,
            arn: req.tenantContext.arnNumber
          },
          bse_response: bseResponse
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}
