/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mandate Registration Controller (eNACH, UPI AutoPay)
 */

import { Request, Response, NextFunction } from 'express';
import { BseGatewayService } from '../services/bseGatewayService.js';
import { MandateRegistration } from '../types/order.js';
import { UccBankAccount } from '../types/ucc.js';
import { AppError } from '../middleware/errorHandler.js';

export class MandateController {
  public static async registerMandate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = req.body;

      const uccClientCode = b.clientCode || b.client_code || b.uccClientCode;
      const bankAccountNumber = b.bankAccountNumber || b.bank_account_number || b.account_number;
      const ifscCode = b.ifscCode || b.ifsc_code;
      const maxAmount = Number(b.maxAmount || b.max_amount || 0);

      if (!uccClientCode || !bankAccountNumber || !ifscCode) {
        throw new AppError('Missing required fields: client_code, bank_account_number, and ifsc_code are mandatory', 400, 'VALIDATION_ERROR');
      }

      if (maxAmount <= 0) {
        throw new AppError('Mandate max_amount must be a positive number', 400, 'VALIDATION_ERROR');
      }

      const rawMandateType = (b.mandateType || b.mandate_type || 'ENACH').toUpperCase();
      const mandateType = rawMandateType.includes('UPI') ? 'UPI_AUTOPAY' : rawMandateType.includes('PAPER') ? 'NACH_PAPER' : 'ENACH';

      const fullMandate: MandateRegistration = {
        id: `man_${Date.now()}`,
        tenantId: req.tenantContext.tenantId,
        uccId: b.uccId || b.ucc_id || 'ucc_default',
        uccClientCode,
        bankAccountId: b.bankAccountId || b.bank_account_id || 'bank_default',
        memMandateId: b.memMandateId || b.mem_mandate_id || `MM-${Date.now()}`,
        mandateType,
        maxAmount,
        startDate: b.startDate || b.start_date || new Date().toISOString().split('T')[0],
        validTill: b.validTill || b.valid_till || '2050-12-31',
        frequency: b.frequency || 'ASNP',
        authMode: b.authMode || b.auth_mode || 'NETBANKING',
        status: 'INITIATED',
        regulatory: {
          subBrArn: req.tenantContext.subBrokerArn || (req.tenantContext.isPlatformOwner ? undefined : req.tenantContext.arnNumber) || req.tenantContext.arnNumber,
          subBrCode: req.tenantContext.subBrokerCode,
          euin: req.tenantContext.euin,
          euinFlag: req.tenantContext.euinFlag
        }
      };

      const bankAccount: UccBankAccount = {
        accountNumber: bankAccountNumber,
        ifscCode,
        bankName: b.bankName || b.bank_name || 'HDFC Bank',
        branchName: b.branchName || b.branch_name,
        accountType: b.accountType || b.bank_acc_type || 'SB',
        accountOwner: 'SELF',
        isDefault: true
      };

      const bseService = BseGatewayService.getInstance();
      const bseResponse = await bseService.registerMandate(fullMandate, bankAccount, req.tenantContext);

      const bseMandateId = bseResponse.data?.bse_mandate_id;
      const umrn = bseResponse.data?.umrn_number || bseResponse.data?.umrn;
      const isSuccess = bseResponse.status === 200 || bseResponse.status === 'success' || !!bseMandateId;

      if (isSuccess && bseMandateId) {
        fullMandate.bseMandateId = bseMandateId;
        fullMandate.umrn = umrn;
        fullMandate.status = 'PENDING_INVESTOR_AUTH';
      }

      res.status(isSuccess ? 201 : 400).json({
        success: isSuccess,
        data: {
          mandate_id: fullMandate.id,
          mem_mandate_id: fullMandate.memMandateId,
          bse_mandate_id: fullMandate.bseMandateId,
          umrn: fullMandate.umrn,
          status: fullMandate.status,
          max_amount: fullMandate.maxAmount,
          auth_url: bseResponse.data?.auth_url,
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
