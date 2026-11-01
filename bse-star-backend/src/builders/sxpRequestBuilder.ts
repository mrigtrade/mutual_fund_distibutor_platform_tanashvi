/**
 * BSE StAR MF v2.0 - Systematic (SxP) Request Builder
 * 
 * Transforms internal SystematicRegistration domain entities into exact BSE v2 /api/sxp_register JSON payload.
 * Fully supports:
 * - SIP (Systematic Investment Plan)
 * - XSIP (Exchange SIP via eNACH/eMandate)
 * - STP (Systematic Transfer Plan: Source Scheme -> Destination Scheme)
 * - SWP (Systematic Withdrawal Plan)
 * - Perpetual SIPs, specific transaction days, and EUIN/ARN attribution
 */

import { SystematicRegistration } from '../types/order.js';
import { UccBankAccount } from '../types/ucc.js';

export interface BseSxpRegisterRequestPayload {
  data: {
    sxp_type: 'sip' | 'xsip' | 'stp' | 'swp';
    mem_sxp_ref_id: string;
    investor: {
      ucc: string;
    };
    member: string;
    src_scheme: string;
    dest_scheme: string;
    amc_code?: string;
    exch_mandate_id: number | string;
    parent_client_code?: string;
    isunits: boolean;
    all_units: boolean;
    amount: number;
    cur: 'INR';
    src_folio: string;
    dest_folio: string;
    phys_or_demat: string; // 'P' or 'D'
    dpc?: boolean;
    start_date: string;    // YYYY-MM-DD
    end_date: string;      // YYYY-MM-DD
    freq: string;          // 'm', 'w', 'q', 'd'
    txn_date: number;      // 1 - 31
    is_fresh?: boolean;
    first_order_today: boolean;
    mem_details: {
      euin: string;
      euin_flag: boolean;
      sub_br_code: string;
      sub_br_arn: string;
      partner_id: string;
    };
    bank_acct?: {
      ifsc: string;
      no: string;
      type: string;
      name?: string;
    };
    brokerage?: number;
    remark?: string;
  };
}

export class SxpRequestBuilder {
  /**
   * Builds the official BSE StAR MF v2 /sxp_register JSON payload.
   * 
   * @param systematic Internal SystematicRegistration entity
   * @param bseMandateId BSE Mandate ID linked for automated debit
   * @param bankAccount Optional bank account details
   * @param memberCode Primary BSE Member Code (defaults to Tanashvi '714114')
   */
  public static buildSxpRegisterRequest(
    systematic: SystematicRegistration,
    bseMandateId?: string | number,
    bankAccount?: UccBankAccount,
    memberCode = '714114'
  ): BseSxpRegisterRequestPayload {
    // Perpetual SIPs are typically represented with a distant end date in BSE StAR MF
    const endDate = systematic.isPerpetual || !systematic.endDate
      ? '2099-12-31'
      : systematic.endDate;

    const payload: BseSxpRegisterRequestPayload = {
      data: {
        sxp_type: systematic.sxpType.toLowerCase() as 'sip' | 'xsip' | 'stp' | 'swp',
        mem_sxp_ref_id: systematic.memSxpRefId,
        investor: {
          ucc: systematic.uccClientCode
        },
        member: memberCode,
        src_scheme: systematic.srcSchemeBseCode,
        dest_scheme: systematic.destSchemeBseCode || '',
        exch_mandate_id: bseMandateId || 0,
        isunits: systematic.isUnits,
        all_units: false,
        amount: systematic.installmentAmount,
        cur: 'INR',
        src_folio: systematic.srcFolio || '',
        dest_folio: systematic.destFolio || '',
        phys_or_demat: systematic.physOrDemat.toUpperCase(),
        start_date: systematic.startDate,
        end_date: endDate,
        freq: systematic.frequency.toLowerCase(),
        txn_date: systematic.installmentDay,
        first_order_today: systematic.firstOrderToday,
        is_fresh: !systematic.srcFolio,
        mem_details: {
          euin: systematic.regulatory.euin || '',
          euin_flag: systematic.regulatory.euinFlag,
          sub_br_code: systematic.regulatory.subBrCode || '',
          sub_br_arn: systematic.regulatory.subBrArn || 'ARN-347849',
          partner_id: systematic.regulatory.partnerId || 'TANASHVI'
        }
      }
    };

    if (bankAccount) {
      payload.data.bank_acct = {
        ifsc: bankAccount.ifscCode,
        no: bankAccount.accountNumber,
        type: bankAccount.accountType,
        name: bankAccount.bankName
      };
    }

    return payload;
  }
}

