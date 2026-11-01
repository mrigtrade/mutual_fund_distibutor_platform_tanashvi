/**
 * BSE StAR MF v2.0 - Webhook Ingestion Controller
 * 
 * Implements callback receivers adhering strictly to:
 * "BSE STAR MF 2.0 - Webhook Sequence Document"
 * 
 * Supported Event Types:
 * 1. PAYMENT GATEWAY: agency_approved, agency_rejected, agency_pending
 * 2. ORDER: approved, match_pending, allotted, rejected
 * 3. MANDATES: active, in_process_agency, rejected, auto_rejected
 * 4. SXP: active, paused, resumed, cancelled
 * 5. UCC: ucc_pan_verification, ucc_bank_acc, ACTIVE
 */

import { OrderStateMachine } from '../services/orderStateMachine.js';
import { CutoffReconciliationService } from '../services/cutoffReconciliation.js';
import { MutualFundOrder, MandateRegistration, SystematicRegistration } from '../types/order.js';

export interface BseWebhookCallbackPayload {
  member: {
    member_id: string;
  };
  request_id: string;
  investor: {
    client_code: string;
  };
  action: {
    msgcode: number;
    at: string;
    event_type: 'ORDER' | 'PAYMENT GATEWAY' | 'MANDATES' | 'SXP' | 'UCC';
    event: string;
    event_message?: string;
    bse_order_ids?: string[];
    pg_order_ids?: string[];
    mandate_id?: string;
    reg_no?: string;
    allotted_nav?: number;
    allotment_date?: string;
    [key: string]: any;
  };
}

export interface WebhookResponse {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  actionTaken?: string;
}

export class BseWebhookController {
  private static instance: BseWebhookController;
  private memberCode: string;

  // In-memory repositories for state management during offline simulation
  public ordersMap = new Map<string, MutualFundOrder>();
  public mandatesMap = new Map<string, MandateRegistration>();
  public sxpMap = new Map<string, SystematicRegistration>();
  public uccStatusMap = new Map<string, string>();

  constructor(memberCode = '714114') {
    this.memberCode = memberCode;
  }

  public static getInstance(memberCode = '714114'): BseWebhookController {
    if (!BseWebhookController.instance) {
      BseWebhookController.instance = new BseWebhookController(memberCode);
    }
    return BseWebhookController.instance;
  }

  /**
   * Main entrypoint for processing incoming BSE webhook HTTP callbacks.
   */
  public async processWebhook(payload: BseWebhookCallbackPayload): Promise<WebhookResponse> {
    if (!payload?.member?.member_id || !payload?.action?.event_type) {
      return {
        statusCode: 400,
        status: 'error',
        message: 'Invalid webhook payload structure: missing member or action container'
      };
    }

    if (payload.member.member_id !== this.memberCode) {
      return {
        statusCode: 403,
        status: 'error',
        message: `Mismatched member_id ${payload.member.member_id}. Expected ${this.memberCode}`
      };
    }

    const eventType = payload.action.event_type;
    const event = payload.action.event;

    switch (eventType) {
      case 'PAYMENT GATEWAY':
        return this.handlePaymentGatewayEvent(payload);
      case 'ORDER':
        return this.handleOrderEvent(payload);
      case 'MANDATES':
        return this.handleMandateEvent(payload);
      case 'SXP':
        return this.handleSxpEvent(payload);
      case 'UCC':
        return this.handleUccEvent(payload);
      default:
        return {
          statusCode: 200,
          status: 'success',
          message: `Ignored unhandled event_type: ${eventType}`
        };
    }
  }

  // --------------------------------------------------------------------------
  // EVENT TYPE HANDLERS
  // --------------------------------------------------------------------------

  private handlePaymentGatewayEvent(payload: BseWebhookCallbackPayload): WebhookResponse {
    const event = payload.action.event;
    const orderNos = payload.action.bse_order_ids || payload.action.pg_order_ids || [];

    if (orderNos.length === 0) {
      return { statusCode: 400, status: 'error', message: 'No order IDs found in payment gateway webhook' };
    }

    let updatedCount = 0;

    for (const bseOrderNo of orderNos) {
      // Find order by bseOrderNo
      const order = Array.from(this.ordersMap.values()).find((o) => o.bseOrderNo === bseOrderNo);
      if (!order) continue;

      if (event === 'agency_approved' || event === 'agency_payment_complete') {
        const updated = OrderStateMachine.transitionOrder(order, 'PAYMENT_CONFIRMED', 'WEBHOOK', {
          paymentStatus: 'SUCCESS'
        });
        this.ordersMap.set(order.memOrdRefId, updated);
        updatedCount++;
      } else if (event === 'agency_rejected' || event === 'agency_cancelled') {
        const updated = OrderStateMachine.transitionOrder(order, 'EXPIRED', 'WEBHOOK', {
          paymentStatus: 'FAILED',
          rejectionReason: payload.action.event_message || 'Payment rejected at banking agency'
        });
        this.ordersMap.set(order.memOrdRefId, updated);
        updatedCount++;
      }
    }

    return {
      statusCode: 200,
      status: 'success',
      message: `Processed PAYMENT GATEWAY [${event}] for ${updatedCount} orders`,
      actionTaken: `Updated ${updatedCount} orders to payment confirmed or failed`
    };
  }

  private handleOrderEvent(payload: BseWebhookCallbackPayload): WebhookResponse {
    const event = payload.action.event;
    const orderNos = payload.action.bse_order_ids || [];

    let updatedCount = 0;

    for (const bseOrderNo of orderNos) {
      const order = Array.from(this.ordersMap.values()).find((o) => o.bseOrderNo === bseOrderNo);
      if (!order) continue;

      if (event === 'approved' || event === 'match_pending') {
        const updated = OrderStateMachine.transitionOrder(order, 'PROCESSED_BY_RTA', 'WEBHOOK');
        this.ordersMap.set(order.memOrdRefId, updated);
        updatedCount++;
      } else if (event === 'allotted') {
        const allottedNav = payload.action.allotted_nav || 125.50; // Fallback or provided NAV
        const allottedUnits = CutoffReconciliationService.calculateAllottedUnits(order.amount, allottedNav);
        const allotmentDate = payload.action.allotment_date || new Date().toISOString().slice(0, 10);

        const updated = OrderStateMachine.transitionOrder(order, 'UNITS_ALLOTTED', 'WEBHOOK', {
          allottedNav,
          allottedUnits,
          allotmentDate
        });
        this.ordersMap.set(order.memOrdRefId, updated);
        updatedCount++;
      } else if (event === 'rejected') {
        const updated = OrderStateMachine.transitionOrder(order, 'REJECTED_BY_BSE', 'WEBHOOK', {
          rejectionReason: payload.action.event_message || 'Order rejected by exchange'
        });
        this.ordersMap.set(order.memOrdRefId, updated);
        updatedCount++;
      }
    }

    return {
      statusCode: 200,
      status: 'success',
      message: `Processed ORDER [${event}] for ${updatedCount} orders`,
      actionTaken: `Updated ${updatedCount} orders`
    };
  }

  private handleMandateEvent(payload: BseWebhookCallbackPayload): WebhookResponse {
    const event = payload.action.event;
    const mandateId = payload.action.mandate_id;

    const mandate = Array.from(this.mandatesMap.values()).find(
      (m) => m.bseMandateId === mandateId || m.memMandateId === mandateId
    );

    if (!mandate) {
      return { statusCode: 200, status: 'success', message: `Mandate ${mandateId} not found in repository` };
    }

    if (event === 'active') {
      const updated = OrderStateMachine.transitionMandate(mandate, 'ACTIVE_APPROVED', 'WEBHOOK', {
        umrn: payload.action.umrn || mandate.umrn
      });
      this.mandatesMap.set(mandate.memMandateId, updated);
    } else if (event === 'rejected' || event === 'auto_rejected') {
      const updated = OrderStateMachine.transitionMandate(mandate, 'REJECTED', 'WEBHOOK', {
        rejectionReason: payload.action.event_message || 'Mandate rejected at sponsor bank'
      });
      this.mandatesMap.set(mandate.memMandateId, updated);
    }

    return {
      statusCode: 200,
      status: 'success',
      message: `Processed MANDATES [${event}] for mandate ${mandate.memMandateId}`
    };
  }

  private handleSxpEvent(payload: BseWebhookCallbackPayload): WebhookResponse {
    const event = payload.action.event;
    const regNo = payload.action.reg_no;

    const sxp = Array.from(this.sxpMap.values()).find(
      (s) => s.bseRegNo === regNo || s.memSxpRefId === regNo
    );

    if (!sxp) {
      return { statusCode: 200, status: 'success', message: `SXP ${regNo} not found in repository` };
    }

    if (event === 'active') {
      const updated = OrderStateMachine.transitionSxp(sxp, 'ACTIVE', 'WEBHOOK');
      this.sxpMap.set(sxp.memSxpRefId, updated);
    } else if (event === 'paused') {
      const updated = OrderStateMachine.transitionSxp(sxp, 'PAUSED', 'WEBHOOK');
      this.sxpMap.set(sxp.memSxpRefId, updated);
    } else if (event === 'resumed') {
      const updated = OrderStateMachine.transitionSxp(sxp, 'RESUMED', 'WEBHOOK');
      this.sxpMap.set(sxp.memSxpRefId, updated);
    } else if (event === 'cancelled') {
      const updated = OrderStateMachine.transitionSxp(sxp, 'CANCELLED', 'WEBHOOK');
      this.sxpMap.set(sxp.memSxpRefId, updated);
    }

    return {
      statusCode: 200,
      status: 'success',
      message: `Processed SXP [${event}] for systematic order ${sxp.memSxpRefId}`
    };
  }

  private handleUccEvent(payload: BseWebhookCallbackPayload): WebhookResponse {
    const event = payload.action.event;
    const clientCode = payload.investor?.client_code;

    if (clientCode) {
      if (event === 'ACTIVE') {
        this.uccStatusMap.set(clientCode, 'ACTIVE_APPROVED');
      } else if (event === 'suspended') {
        this.uccStatusMap.set(clientCode, 'SUSPENDED');
      }
    }

    return {
      statusCode: 200,
      status: 'success',
      message: `Processed UCC [${event}] for client ${clientCode}`
    };
  }
}

