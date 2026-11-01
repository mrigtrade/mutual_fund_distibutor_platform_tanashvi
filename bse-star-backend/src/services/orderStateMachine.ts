/**
 * BSE StAR MF v2.0 - Transaction State Machine & Life-Cycle Engine
 * 
 * Manages atomic lifecycle transitions for:
 * 1. Mutual Fund Orders (Lumpsum, Redemption, Switch)
 * 2. Mandates (eNACH, UPI AutoPay, NACH)
 * 3. Systematic Registrations (SIP, XSIP, STP, SWP)
 * 
 * Enforces transition guards, prevents illegal state jumps, and maintains an audit log.
 */

import { OrderStatus, MutualFundOrder, MandateRegistration, SystematicRegistration } from '../types/order.js';

export interface StateTransitionEvent {
  entityType: 'ORDER' | 'MANDATE' | 'SXP';
  entityId: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  triggeredBy: string; // 'API', 'WEBHOOK', 'SYSTEM_TIMER', 'ADMIN'
  metadata?: Record<string, any>;
}

export class OrderStateMachine {
  // --------------------------------------------------------------------------
  // ORDER TRANSITION RULES
  // --------------------------------------------------------------------------
  private static readonly ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: ['VALIDATED', 'CANCELLED'],
    VALIDATED: ['QUEUED_FOR_BSE', 'SUBMITTED_TO_BSE', 'CANCELLED'],
    QUEUED_FOR_BSE: ['SUBMITTED_TO_BSE', 'CANCELLED'],
    SUBMITTED_TO_BSE: ['ACCEPTED_BY_BSE', 'REJECTED_BY_BSE'],
    ACCEPTED_BY_BSE: ['AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSED_BY_RTA', 'UNITS_ALLOTTED', 'CANCELLED'],
    AWAITING_PAYMENT: ['PAYMENT_CONFIRMED', 'EXPIRED', 'CANCELLED'],
    PAYMENT_CONFIRMED: ['PROCESSED_BY_RTA', 'UNITS_ALLOTTED', 'CANCELLED'],
    PROCESSED_BY_RTA: ['UNITS_ALLOTTED', 'REJECTED_BY_BSE'],
    UNITS_ALLOTTED: [], // Terminal
    REJECTED_BY_BSE: [], // Terminal
    CANCELLED: [], // Terminal
    EXPIRED: [] // Terminal
  };

  // --------------------------------------------------------------------------
  // MANDATE TRANSITION RULES
  // --------------------------------------------------------------------------
  private static readonly MANDATE_TRANSITIONS: Record<string, string[]> = {
    INITIATED: ['PENDING_INVESTOR_AUTH', 'SUBMITTED_TO_BANK', 'CANCELLED'],
    PENDING_INVESTOR_AUTH: ['SUBMITTED_TO_BANK', 'ACTIVE_APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    SUBMITTED_TO_BANK: ['ACTIVE_APPROVED', 'REJECTED', 'CANCELLED'],
    ACTIVE_APPROVED: ['CANCELLED', 'EXPIRED'],
    REJECTED: [],
    CANCELLED: [],
    EXPIRED: []
  };

  // --------------------------------------------------------------------------
  // SYSTEMATIC (SXP) TRANSITION RULES
  // --------------------------------------------------------------------------
  private static readonly SXP_TRANSITIONS: Record<string, string[]> = {
    INITIATED: ['SUBMITTED_TO_BSE', 'REJECTED'],
    SUBMITTED_TO_BSE: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['PAUSED', 'CANCELLED', 'COMPLETED'],
    PAUSED: ['ACTIVE', 'CANCELLED'],
    CANCELLED: [],
    COMPLETED: [],
    REJECTED: []
  };

  private static transitionAuditHistory: StateTransitionEvent[] = [];

  public static getTransitionHistory(): StateTransitionEvent[] {
    return [...this.transitionAuditHistory];
  }

  public static clearHistory(): void {
    this.transitionAuditHistory = [];
  }

  // --------------------------------------------------------------------------
  // ORDER TRANSITION METHODS
  // --------------------------------------------------------------------------

  public static canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = this.ORDER_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transitionOrder(
    order: MutualFundOrder,
    targetStatus: OrderStatus,
    triggeredBy = 'WEBHOOK',
    metadata?: Record<string, any>
  ): MutualFundOrder {
    const currentStatus = order.status;

    if (!this.canTransitionOrder(currentStatus, targetStatus)) {
      throw new Error(
        `State Machine Violation: Illegal order state transition from '${currentStatus}' to '${targetStatus}' for Order '${order.memOrdRefId}'.`
      );
    }

    // Apply state change
    const updatedOrder: MutualFundOrder = {
      ...order,
      status: targetStatus
    };

    // Apply metadata updates if present
    if (metadata) {
      if (metadata.bseOrderNo) updatedOrder.bseOrderNo = metadata.bseOrderNo;
      if (metadata.paymentStatus) updatedOrder.paymentStatus = metadata.paymentStatus;
      if (metadata.bsePaymentLink) updatedOrder.bsePaymentLink = metadata.bsePaymentLink;
      if (metadata.allottedNav) updatedOrder.allottedNav = metadata.allottedNav;
      if (metadata.allottedUnits) updatedOrder.allottedUnits = metadata.allottedUnits;
      if (metadata.allotmentDate) updatedOrder.allotmentDate = metadata.allotmentDate;
      if (metadata.rejectionReason) updatedOrder.rejectionReason = metadata.rejectionReason;
    }

    // Record audit event
    this.transitionAuditHistory.push({
      entityType: 'ORDER',
      entityId: order.memOrdRefId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      triggeredBy,
      metadata
    });

    return updatedOrder;
  }

  // --------------------------------------------------------------------------
  // MANDATE TRANSITION METHODS
  // --------------------------------------------------------------------------

  public static canTransitionMandate(from: string, to: string): boolean {
    const allowed = this.MANDATE_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transitionMandate(
    mandate: MandateRegistration,
    targetStatus: 'INITIATED' | 'PENDING_INVESTOR_AUTH' | 'SUBMITTED_TO_BANK' | 'ACTIVE_APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED',
    triggeredBy = 'WEBHOOK',
    metadata?: Record<string, any>
  ): MandateRegistration {
    const currentStatus = mandate.status;

    if (!this.canTransitionMandate(currentStatus, targetStatus)) {
      throw new Error(
        `State Machine Violation: Illegal mandate state transition from '${currentStatus}' to '${targetStatus}' for Mandate '${mandate.memMandateId}'.`
      );
    }

    const updatedMandate: MandateRegistration = {
      ...mandate,
      status: targetStatus
    };

    if (metadata) {
      if (metadata.bseMandateId) updatedMandate.bseMandateId = metadata.bseMandateId;
      if (metadata.umrn) updatedMandate.umrn = metadata.umrn;
      if (metadata.authUrl) updatedMandate.authUrl = metadata.authUrl;
      if (metadata.rejectionReason) updatedMandate.rejectionReason = metadata.rejectionReason;
    }

    this.transitionAuditHistory.push({
      entityType: 'MANDATE',
      entityId: mandate.memMandateId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      triggeredBy,
      metadata
    });

    return updatedMandate;
  }

  // --------------------------------------------------------------------------
  // SYSTEMATIC (SXP) TRANSITION METHODS
  // --------------------------------------------------------------------------

  public static canTransitionSxp(from: string, to: string): boolean {
    const allowed = this.SXP_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transitionSxp(
    sxp: SystematicRegistration,
    targetStatus: 'INITIATED' | 'SUBMITTED_TO_BSE' | 'ACTIVE' | 'PAUSED' | 'RESUMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED',
    triggeredBy = 'WEBHOOK',
    metadata?: Record<string, any>
  ): SystematicRegistration {
    const currentStatus = sxp.status;

    // Normalizing RESUMED to ACTIVE for state diagram
    const checkTarget = targetStatus === 'RESUMED' ? 'ACTIVE' : targetStatus;

    if (!this.canTransitionSxp(currentStatus, checkTarget)) {
      throw new Error(
        `State Machine Violation: Illegal SXP state transition from '${currentStatus}' to '${targetStatus}' for SXP '${sxp.memSxpRefId}'.`
      );
    }

    const updatedSxp: SystematicRegistration = {
      ...sxp,
      status: targetStatus
    };

    if (metadata) {
      if (metadata.bseRegNo) updatedSxp.bseRegNo = metadata.bseRegNo;
      if (metadata.pauseStartDate) updatedSxp.pauseStartDate = metadata.pauseStartDate;
      if (metadata.pauseEndDate) updatedSxp.pauseEndDate = metadata.pauseEndDate;
      if (metadata.rejectionReason) updatedSxp.rejectionReason = metadata.rejectionReason;
    }

    this.transitionAuditHistory.push({
      entityType: 'SXP',
      entityId: sxp.memSxpRefId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      triggeredBy,
      metadata
    });

    return updatedSxp;
  }
}
