/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Mutual Fund Order Controller
 */

import { Request, Response, NextFunction } from 'express';
import { BseGatewayService } from '../services/bseGatewayService.js';
import { OrderStateMachine } from '../services/orderStateMachine.js';
import { MutualFundOrder, OrderStatus } from '../types/order.js';
import { AppError } from '../middleware/errorHandler.js';

export class OrderController {
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = req.body;

      const uccClientCode = b.clientCode || b.client_code || b.uccClientCode;
      const schemeBseCode = b.schemeBseCode || b.scheme_bse_code;

      if (!uccClientCode || !schemeBseCode) {
        throw new AppError('Missing required fields: client_code and scheme_bse_code are mandatory', 400, 'VALIDATION_ERROR');
      }

      const amount = b.amount ? Number(b.amount) : 0;
      const units = b.units ? Number(b.units) : 0;

      if (amount <= 0 && units <= 0) {
        throw new AppError('Order must specify a positive amount or units', 400, 'VALIDATION_ERROR');
      }

      const memOrdRefId = b.memOrdRefId || b.mem_ord_ref_id || `ORD-TAN-${Date.now()}`;
      const schemeCategory = b.schemeCategory || b.scheme_category || (b.cutoff_type === 'LIQUID_OVERNIGHT' ? 'Liquid Fund' : 'Equity');

      let order: MutualFundOrder = {
        id: `ord_${Date.now()}`,
        tenantId: req.tenantContext.tenantId,
        uccId: b.uccId || b.ucc_id || 'ucc_default',
        uccClientCode,
        memOrdRefId,
        orderType: b.orderType || (b.order_type === 'REDEMPTION' ? 'REDEMPTION' : b.order_type === 'SWITCH' ? 'SWITCH' : 'PURCHASE'),
        purchaseType: b.purchaseType || (b.order_type === 'ADDITIONAL_PURCHASE' ? 'ADDITIONAL' : 'FRESH'),
        orderSource: 'LUMPSUM',
        schemeBseCode,
        destSchemeBseCode: b.destSchemeBseCode || b.dest_scheme_bse_code,
        folioNumber: b.folioNumber || b.folio_no,
        physOrDemat: (b.physOrDemat || b.order_mode === 'DEMAT' || b.dp_txn_mode === 'D') ? 'D' : 'P',
        amount,
        units,
        isUnits: units > 0 && amount === 0,
        allUnits: b.allUnits || b.all_units || false,
        currency: 'INR',
        regulatory: {
          subBrArn: req.tenantContext.subBrokerArn || (req.tenantContext.isPlatformOwner ? undefined : req.tenantContext.arnNumber) || req.tenantContext.arnNumber,
          subBrCode: req.tenantContext.subBrokerCode,
          euin: req.tenantContext.euin,
          euinFlag: req.tenantContext.euinFlag
        },
        paymentMode: b.paymentMode || b.payment_mode || 'NETBANKING',
        paymentStatus: 'PENDING',
        status: 'DRAFT',
        orderTimestamp: new Date().toISOString(),
        cutoffTime: '15:00:00',
        isSameDayNav: true,
        traceId: `trace-${Date.now()}`
      };

      // Lifecycle transitions: DRAFT -> VALIDATED -> SUBMITTED_TO_BSE
      order = OrderStateMachine.transitionOrder(order, 'VALIDATED', 'API_VALIDATION');
      order = OrderStateMachine.transitionOrder(order, 'SUBMITTED_TO_BSE', 'GATEWAY_DISPATCH');

      // Dispatch to BSE Gateway Service
      const bseService = BseGatewayService.getInstance();
      const { bseResponse, cutoffEvaluation } = await bseService.createOrder(
        order,
        req.tenantContext,
        schemeCategory
      );

      const firstOrder = bseResponse.data?.orders?.[0] || bseResponse.data;
      const bseOrderNo = firstOrder?.bse_order_no;
      const bseInternalRefNo = firstOrder?.bse_internal_ref_no || firstOrder?.internal_ref_no;
      const paymentUrl = firstOrder?.payment_url || firstOrder?.payment_gateway_url;

      const isSuccess = bseResponse.status === 200 || bseResponse.status === 'success' || !!bseOrderNo;

      if (isSuccess && bseOrderNo) {
        order.bseOrderNo = bseOrderNo;
        order.bseInternalRefNo = bseInternalRefNo;
        order.bsePaymentLink = paymentUrl;

        order = OrderStateMachine.transitionOrder(
          order,
          'ACCEPTED_BY_BSE',
          'BSE_RESPONSE'
        );
        order = OrderStateMachine.transitionOrder(
          order,
          'AWAITING_PAYMENT',
          'PAYMENT_LINK_GENERATION'
        );
      }

      res.status(isSuccess ? 201 : 400).json({
        success: isSuccess,
        data: {
          order_id: order.id,
          mem_ord_ref_id: order.memOrdRefId,
          bse_order_no: order.bseOrderNo,
          order_state: order.status,
          payment_gateway_url: paymentUrl,
          cutoff: {
            scheme_category: schemeCategory,
            statutory_cutoff_time_ist: cutoffEvaluation.effectiveCutoffTime,
            order_received_time_ist: cutoffEvaluation.orderTimestampIst,
            is_same_day_nav: cutoffEvaluation.isSameDayNav,
            applicable_nav_date: cutoffEvaluation.applicableNavDate,
            reason: cutoffEvaluation.reason
          },
          tenant: {
            tenant_id: req.tenantContext.tenantId,
            arn: req.tenantContext.arnNumber,
            euin: req.tenantContext.euin
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
