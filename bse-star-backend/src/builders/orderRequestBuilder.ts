/**
 * BSE StAR MF v2.0 - Order Request Builder
 * 
 * Transforms internal MutualFundOrder domain entities into exact BSE v2 /api/order_new JSON payload.
 * Fully supports:
 * - Fresh Lumpsum Purchases
 * - Additional Purchases (with Folio)
 * - Redemptions (Amount, Partial Units, All Units)
 * - Switches (Source Scheme -> Destination Scheme)
 * - AMFI MFD & SEBI EUIN Regulatory Attribution
 */

import { MutualFundOrder } from '../types/order.js';
import { UccBankAccount } from '../types/ucc.js';

export interface BseSingleOrderItem {
  type: 'p' | 'r' | 's'; // Purchase, Redemption, Switch
  mem_ord_ref_id: string;
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
  scheme: string;
  dest_scheme: string;
  amount: number;
  cur: 'INR';
  is_units: boolean;
  all_units: boolean;
  min_redeem_flag: boolean;
  folio: string;
  dest_folio: string;
  is_fresh: boolean;
  phys_or_demat: string; // 'p' or 'd'
  src: string;
  bank_acct?: {
    ifsc: string;
    no: string;
    type: string;
    name?: string;
  };
}

export interface BseOrderNewRequestPayload {
  data: {
    orders: BseSingleOrderItem[];
  };
}

export class OrderRequestBuilder {
  /**
   * Builds the official BSE StAR MF v2 /order_new JSON payload.
   * 
   * @param order Internal MutualFundOrder entity
   * @param bankAccount Optional bank account details for settlement
   * @param memberCode Primary BSE Member Code (defaults to Tanashvi '714114')
   */
  public static buildOrderNewRequest(
    order: MutualFundOrder,
    bankAccount?: UccBankAccount,
    memberCode = '714114'
  ): BseOrderNewRequestPayload {
    // Determine BSE Transaction Type Code
    let typeCode: 'p' | 'r' | 's' = 'p';
    if (order.orderType === 'REDEMPTION') {
      typeCode = 'r';
    } else if (order.orderType === 'SWITCH') {
      typeCode = 's';
    }

    const orderItem: BseSingleOrderItem = {
      type: typeCode,
      mem_ord_ref_id: order.memOrdRefId,
      investor: {
        ucc: order.uccClientCode
      },
      member: memberCode,
      mem_details: {
        euin: order.regulatory.euin || '',
        euin_flag: order.regulatory.euinFlag,
        sub_br_code: order.regulatory.subBrCode || '',
        sub_br_arn: order.regulatory.subBrArn || 'ARN-347849',
        partner_id: order.regulatory.partnerId || 'TANASHVI'
      },
      scheme: order.schemeBseCode,
      dest_scheme: order.destSchemeBseCode || '',
      amount: order.amount,
      cur: 'INR',
      is_units: order.isUnits,
      all_units: order.allUnits,
      min_redeem_flag: false,
      folio: order.folioNumber || '',
      dest_folio: order.destFolioNumber || '',
      is_fresh: order.purchaseType === 'FRESH' || !order.folioNumber,
      phys_or_demat: order.physOrDemat.toLowerCase(),
      src: order.orderSource ? order.orderSource.toLowerCase() : 'lumpsum'
    };

    if (bankAccount) {
      orderItem.bank_acct = {
        ifsc: bankAccount.ifscCode,
        no: bankAccount.accountNumber,
        type: bankAccount.accountType,
        name: bankAccount.bankName
      };
    }

    return {
      data: {
        orders: [orderItem]
      }
    };
  }

  /**
   * Builds a batch order_new request containing multiple orders in one call.
   */
  public static buildBatchOrderNewRequest(
    orders: Array<{ order: MutualFundOrder; bankAccount?: UccBankAccount }>,
    memberCode = '714114'
  ): BseOrderNewRequestPayload {
    const orderItems: BseSingleOrderItem[] = orders.map(({ order, bankAccount }) => {
      const single = this.buildOrderNewRequest(order, bankAccount, memberCode);
      return single.data.orders[0];
    });

    return {
      data: {
        orders: orderItems
      }
    };
  }
}

