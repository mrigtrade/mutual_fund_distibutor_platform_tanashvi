/**
 * BSE StAR MF v2.0 - Local Offline Webhook Emitter (Simulator Helper)
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * (security, state machines, DTO builders, and validation engines) is designed to run
 * self-contained locally against simulated BSE responses.
 * 
 * Simulates BSE Exchange asynchronous webhook events:
 * - PAYMENT GATEWAY: agency_approved, agency_rejected
 * - ORDER: match_pending, approved, allotted
 * - MANDATES: active, rejected
 * - SXP: active, paused, resumed, cancelled
 * - UCC: ACTIVE
 */

import { v4 as uuidv4 } from 'uuid';
import { BseWebhookController, BseWebhookCallbackPayload, WebhookResponse } from '../controllers/bseWebhookController.js';

export class BseWebhookEmitter {
  private controller: BseWebhookController;
  private memberCode: string;

  constructor(controller: BseWebhookController, memberCode = '714114') {
    this.controller = controller;
    this.memberCode = memberCode;
  }

  /**
   * Simulates investor successfully completing netbanking/UPI payment.
   */
  public async emitPaymentApproved(bseOrderNo: string, clientCode: string): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10001,
        at: new Date().toISOString(),
        event_type: 'PAYMENT GATEWAY',
        event: 'agency_approved',
        event_message: 'Payment approved by banking agency',
        bse_order_ids: [bseOrderNo],
        pg_order_ids: [bseOrderNo]
      }
    };

    return await this.controller.processWebhook(payload);
  }

  /**
   * Simulates investor payment failure / session timeout.
   */
  public async emitPaymentRejected(bseOrderNo: string, clientCode: string, reason = 'Payment session timed out'): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10002,
        at: new Date().toISOString(),
        event_type: 'PAYMENT GATEWAY',
        event: 'agency_rejected',
        event_message: reason,
        bse_order_ids: [bseOrderNo],
        pg_order_ids: [bseOrderNo]
      }
    };

    return await this.controller.processWebhook(payload);
  }

  /**
   * Simulates RTA processing and unit allotment with NAV allocation.
   */
  public async emitOrderAllotted(
    bseOrderNo: string,
    clientCode: string,
    allottedNav: number,
    allotmentDate?: string
  ): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10003,
        at: new Date().toISOString(),
        event_type: 'ORDER',
        event: 'allotted',
        event_message: 'Units successfully allotted by RTA',
        bse_order_ids: [bseOrderNo],
        allotted_nav: allottedNav,
        allotment_date: allotmentDate || new Date().toISOString().slice(0, 10)
      }
    };

    return await this.controller.processWebhook(payload);
  }

  /**
   * Simulates sponsor bank activating an eNACH or UPI AutoPay Mandate.
   */
  public async emitMandateActive(bseMandateId: string, clientCode: string, umrn?: string): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10004,
        at: new Date().toISOString(),
        event_type: 'MANDATES',
        event: 'active',
        event_message: 'Mandate activated at sponsor bank',
        mandate_id: bseMandateId,
        umrn: umrn || `UMRN${Date.now()}`
      }
    };

    return await this.controller.processWebhook(payload);
  }

  /**
   * Simulates BSE activating a registered Systematic SIP.
   */
  public async emitSipActive(bseRegNo: string, clientCode: string): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10005,
        at: new Date().toISOString(),
        event_type: 'SXP',
        event: 'active',
        event_message: 'SIP registration active on exchange',
        reg_no: bseRegNo
      }
    };

    return await this.controller.processWebhook(payload);
  }

  /**
   * Simulates BSE pausing an active Systematic SIP.
   */
  public async emitSipPaused(bseRegNo: string, clientCode: string): Promise<WebhookResponse> {
    const payload: BseWebhookCallbackPayload = {
      member: { member_id: this.memberCode },
      request_id: uuidv4(),
      investor: { client_code: clientCode },
      action: {
        msgcode: 10006,
        at: new Date().toISOString(),
        event_type: 'SXP',
        event: 'paused',
        event_message: 'SIP paused on exchange',
        reg_no: bseRegNo
      }
    };

    return await this.controller.processWebhook(payload);
  }
}

