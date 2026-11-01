/**
 * BSE StAR MF v2.0 - Mandate Request Builder
 * 
 * Transforms internal MandateRegistration domain entities into exact BSE v2 /api/mandate_register JSON payload.
 * Fully supports:
 * - eNACH (Netbanking / Debit Card electronic mandate)
 * - UPI AutoPay
 * - Paper NACH
 * - AMFI MFD & SEBI EUIN Regulatory Attribution
 */

import { MandateRegistration } from '../types/order.js';
import { UccBankAccount } from '../types/ucc.js';

export interface BseMandateRegisterRequestPayload {
  data: {
    investor: {
      ucc: string;
    };
    member: string;
    mem_details: {
      euin: string;
      euin_flag: boolean;
      sub_br_code: string;
      sub_br_arn: string;
      partner_id: string;
    };
    investor_bank_details: {
      ifsc: string;
      no: string;
      type: string;
      name: string;
      branch?: string;
      vpa?: string[];
    };
    amount: number;
    start_date: string;
    valid_till: string;
    reg_date: string;
    type: 'X' | 'E';
    mode: 'ACH' | 'ENACH' | 'UPI';
    frequency: string;
    request_type: 'Entry';
    mem_mandate_info?: {
      member_mandate_id: string;
    };
  };
}

export class MandateRequestBuilder {
  /**
   * Builds the official BSE StAR MF v2 /mandate_register JSON payload.
   * 
   * @param mandate Internal MandateRegistration entity
   * @param bankAccount Bank account against which the mandate will be registered
   * @param vpa Optional Virtual Payment Address (UPI ID) for UPI AutoPay mandates
   * @param memberCode Primary BSE Member Code (defaults to Tanashvi '714114')
   */
  public static buildMandateRegisterRequest(
    mandate: MandateRegistration,
    bankAccount: UccBankAccount,
    vpa?: string,
    memberCode = '714114'
  ): BseMandateRegisterRequestPayload {
    let mode: 'ACH' | 'ENACH' | 'UPI' = 'ENACH';
    let typeCode: 'X' | 'E' = 'X';

    if (mandate.mandateType === 'UPI_AUTOPAY') {
      mode = 'UPI';
    } else if (mandate.mandateType === 'NACH_PAPER') {
      mode = 'ACH';
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const payload: BseMandateRegisterRequestPayload = {
      data: {
        investor: {
          ucc: mandate.uccClientCode
        },
        member: memberCode,
        mem_details: {
          euin: mandate.regulatory.euin || '',
          euin_flag: mandate.regulatory.euinFlag,
          sub_br_code: mandate.regulatory.subBrCode || '',
          sub_br_arn: mandate.regulatory.subBrArn || 'ARN-347849',
          partner_id: mandate.regulatory.partnerId || 'TANASHVI'
        },
        investor_bank_details: {
          ifsc: bankAccount.ifscCode,
          no: bankAccount.accountNumber,
          type: bankAccount.accountType,
          name: bankAccount.bankName,
          branch: bankAccount.branchName || 'Main Branch'
        },
        amount: mandate.maxAmount,
        start_date: mandate.startDate,
        valid_till: mandate.validTill,
        reg_date: todayStr,
        type: typeCode,
        mode: mode,
        frequency: mandate.frequency || 'AS AND WHEN PRESENTED',
        request_type: 'Entry',
        mem_mandate_info: {
          member_mandate_id: mandate.memMandateId
        }
      }
    };

    if (vpa && mode === 'UPI') {
      payload.data.investor_bank_details.vpa = [vpa];
    }

    return payload;
  }
}

