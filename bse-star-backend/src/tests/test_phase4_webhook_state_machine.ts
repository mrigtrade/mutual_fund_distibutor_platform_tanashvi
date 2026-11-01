/**
 * Phase 4 Integration Testbench - Webhook Ingestion, State Machine & Cut-Off Reconciliation
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * (security, state machines, DTO builders, and validation engines) is designed to run
 * self-contained locally against simulated BSE responses.
 * 
 * Verifies:
 * 1. Statutory Cut-Off Calculations (Liquid 13:30 vs Equity 15:00, Weekend roll-overs)
 * 2. Order State Machine Lifecycle (DRAFT -> SUBMITTED -> AWAITING_PAYMENT -> PAYMENT_CONFIRMED -> UNITS_ALLOTTED)
 * 3. Asynchronous Webhook Callbacks (PAYMENT GATEWAY, ORDER, MANDATES, SXP)
 * 4. State Machine Transition Guards (Preventing illegal state jumps)
 * 5. Payment Rejection & Exception Handling
 */

import { CutoffReconciliationService } from '../services/cutoffReconciliation.js';
import { OrderStateMachine } from '../services/orderStateMachine.js';
import { BseWebhookController } from '../controllers/bseWebhookController.js';
import { BseWebhookEmitter } from '../mock/bseWebhookEmitter.js';
import { MutualFundOrder, MandateRegistration, SystematicRegistration } from '../types/order.js';

async function runPhase4Testbench() {
  console.log('========================================================================');
  console.log('🚀 Phase 4: State Machine, Webhook Ingestion & Cut-Off Reconciliation');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: STATUTORY CUT-OFF & NAV RECONCILIATION
  // --------------------------------------------------------------------------
  console.log('⏰ 1. Testing SEBI Cut-Off & NAV Reconciliation Rules...');

  // Case A: Liquid Fund before 13:30 (e.g., 11:30 AM IST on Wednesday 2026-10-28)
  const wedMorning = new Date('2026-10-28T11:30:00+05:30');
  const liquidCutoffBefore = CutoffReconciliationService.evaluateNavCutoff('Liquid Fund', wedMorning);
  console.log(`   Liquid (Before 13:30): isSameDayNav=${liquidCutoffBefore.isSameDayNav}, Date=${liquidCutoffBefore.applicableNavDate}`);
  if (!liquidCutoffBefore.isSameDayNav) throw new Error('Liquid fund before cutoff should be same-day NAV');

  // Case B: Liquid Fund after 13:30 (e.g., 14:00 IST on Wednesday 2026-10-28)
  const wedAfternoon = new Date('2026-10-28T14:00:00+05:30');
  const liquidCutoffAfter = CutoffReconciliationService.evaluateNavCutoff('Liquid Fund', wedAfternoon);
  console.log(`   Liquid (After 13:30):  isSameDayNav=${liquidCutoffAfter.isSameDayNav}, Date=${liquidCutoffAfter.applicableNavDate}`);
  if (liquidCutoffAfter.isSameDayNav) throw new Error('Liquid fund after cutoff should roll over');

  // Case C: Equity Fund before 15:00 (e.g., 14:15 IST on Wednesday 2026-10-28)
  const wedEquityTime = new Date('2026-10-28T14:15:00+05:30');
  const equityCutoffBefore = CutoffReconciliationService.evaluateNavCutoff('Large Cap Equity Fund', wedEquityTime);
  console.log(`   Equity (Before 15:00): isSameDayNav=${equityCutoffBefore.isSameDayNav}, Date=${equityCutoffBefore.applicableNavDate}`);
  if (!equityCutoffBefore.isSameDayNav) throw new Error('Equity fund before 15:00 should be same-day NAV');

  // Case D: Weekend Order (Saturday 2026-10-31 10:00 AM IST)
  const saturday = new Date('2026-10-31T10:00:00+05:30');
  const weekendOrder = CutoffReconciliationService.evaluateNavCutoff('Equity Fund', saturday);
  console.log(`   Weekend Order (Sat):   isSameDayNav=${weekendOrder.isSameDayNav}, Date=${weekendOrder.applicableNavDate} (${weekendOrder.reason})`);
  if (weekendOrder.isSameDayNav) throw new Error('Weekend orders must not have same-day NAV');

  // Case E: Units Allotment Calculation
  const allottedUnits = CutoffReconciliationService.calculateAllottedUnits(25000, 125.50);
  console.log(`   Units Calculation:     INR 25,000 @ NAV 125.50 = ${allottedUnits} units`);
  if (allottedUnits !== 199.2032) throw new Error(`Unexpected units calculation: ${allottedUnits}`);
  console.log('   ✅ Cut-Off & NAV Reconciliation checks passed.\n');

  // --------------------------------------------------------------------------
  // TEST 2: ORDER LIFECYCLE VIA WEBHOOK INGESTION
  // --------------------------------------------------------------------------
  console.log('📦 2. Testing End-to-End Order Lifecycle via Webhook Callbacks...');
  const webhookController = new BseWebhookController('714114');
  const webhookEmitter = new BseWebhookEmitter(webhookController, '714114');

  // Create initial order in DRAFT
  let order: MutualFundOrder = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: 'UCC-TAN-987654',
    memOrdRefId: 'ORD-LIFECYCLE-001',
    orderType: 'PURCHASE',
    purchaseType: 'FRESH',
    orderSource: 'LUMPSUM',
    schemeBseCode: 'PRTFGP-GR',
    physOrDemat: 'P',
    amount: 50000,
    isUnits: false,
    allUnits: false,
    currency: 'INR',
    paymentMode: 'NETBANKING',
    paymentStatus: 'PENDING',
    status: 'DRAFT',
    orderTimestamp: new Date().toISOString(),
    cutoffTime: '15:00:00',
    isSameDayNav: true,
    traceId: '12345678-1234-1234-1234-123456789012',
    regulatory: {
      subBrArn: 'ARN-347849',
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true
    }
  };

  // State Step 1: DRAFT -> VALIDATED
  order = OrderStateMachine.transitionOrder(order, 'VALIDATED', 'SYSTEM_VALIDATION');
  console.log(`   [State]: Order created & validated -> ${order.status}`);

  // State Step 2: VALIDATED -> SUBMITTED_TO_BSE
  order = OrderStateMachine.transitionOrder(order, 'SUBMITTED_TO_BSE', 'API_DISPATCH');
  console.log(`   [State]: Order submitted to BSE gateway -> ${order.status}`);

  // State Step 3: BSE assigns order number -> ACCEPTED_BY_BSE -> AWAITING_PAYMENT
  order = OrderStateMachine.transitionOrder(order, 'ACCEPTED_BY_BSE', 'API_RESPONSE', {
    bseOrderNo: 'BBO-20261031-99887',
    bsePaymentLink: 'https://bsestarmfdemo.bseindia.com/PaymentGateway?orderNo=BBO-20261031-99887'
  });
  order = OrderStateMachine.transitionOrder(order, 'AWAITING_PAYMENT', 'API_RESPONSE');
  console.log(`   [State]: BSE accepted order (${order.bseOrderNo}) -> ${order.status}`);

  // Register order in controller repository
  webhookController.ordersMap.set(order.memOrdRefId, order);

  // Webhook Step 4: Investor completes Netbanking payment -> Webhook fires: PAYMENT GATEWAY: agency_approved
  console.log('   📥 Simulating BSE Webhook: PAYMENT GATEWAY (agency_approved)...');
  const pgWebhookResp = await webhookEmitter.emitPaymentApproved('BBO-20261031-99887', 'UCC-TAN-987654');
  console.log(`      Webhook Response: ${pgWebhookResp.message}`);

  const postPayOrder = webhookController.ordersMap.get('ORD-LIFECYCLE-001')!;
  console.log(`   [State]: Webhook received -> Order advanced to: ${postPayOrder.status} (Payment: ${postPayOrder.paymentStatus})`);
  if (postPayOrder.status !== 'PAYMENT_CONFIRMED' || postPayOrder.paymentStatus !== 'SUCCESS') {
    throw new Error('Order failed to advance to PAYMENT_CONFIRMED');
  }

  // Webhook Step 5: Clearing corporation matches and RTA allots units -> Webhook fires: ORDER: allotted
  console.log('   📥 Simulating BSE Webhook: ORDER (allotted with NAV 125.50)...');
  const orderWebhookResp = await webhookEmitter.emitOrderAllotted('BBO-20261031-99887', 'UCC-TAN-987654', 125.50, '2026-10-31');
  console.log(`      Webhook Response: ${orderWebhookResp.message}`);

  const finalOrder = webhookController.ordersMap.get('ORD-LIFECYCLE-001')!;
  console.log(`   [State]: Webhook received -> Final Order State: ${finalOrder.status}`);
  console.log(`      Allotted NAV:   INR ${finalOrder.allottedNav}`);
  console.log(`      Allotted Units: ${finalOrder.allottedUnits}`);
  console.log(`      Allotment Date: ${finalOrder.allotmentDate}`);
  if (finalOrder.status !== 'UNITS_ALLOTTED' || finalOrder.allottedUnits !== 398.4064) {
    throw new Error('Order failed to advance to UNITS_ALLOTTED with correct units');
  }
  console.log('   ✅ Complete Order Lifecycle verified via Webhooks.\n');

  // --------------------------------------------------------------------------
  // TEST 3: STATE MACHINE TRANSITION GUARDS (NEGATIVE TEST)
  // --------------------------------------------------------------------------
  console.log('🛡️  3. Testing State Machine Transition Guards...');
  const illegalOrder: MutualFundOrder = { ...order, status: 'DRAFT' };
  try {
    // Attempt illegal transition: DRAFT -> UNITS_ALLOTTED
    OrderStateMachine.transitionOrder(illegalOrder, 'UNITS_ALLOTTED');
    throw new Error('State machine failed to block illegal transition!');
  } catch (err: any) {
    if (err.message.includes('State Machine Violation')) {
      console.log('   ✅ Guard Passed: Correctly blocked illegal jump from DRAFT to UNITS_ALLOTTED.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 4: MANDATE APPROVAL FLOW VIA WEBHOOK
  // --------------------------------------------------------------------------
  console.log('🏦 4. Testing Mandate Asynchronous Activation via Webhook...');
  let mandate: MandateRegistration = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: 'UCC-TAN-987654',
    bankAccountId: '33333333-4444-5555-6666-777777777777',
    memMandateId: 'MM-TEST-001',
    bseMandateId: 'MAND-99887766',
    mandateType: 'ENACH',
    maxAmount: 100000,
    startDate: '2026-11-01',
    validTill: '2036-10-31',
    frequency: 'AS AND WHEN PRESENTED',
    authMode: 'NETBANKING',
    status: 'PENDING_INVESTOR_AUTH',
    regulatory: {
      subBrArn: 'ARN-347849',
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true
    }
  };

  webhookController.mandatesMap.set(mandate.memMandateId, mandate);

  console.log('   📥 Simulating BSE Webhook: MANDATES (active)...');
  await webhookEmitter.emitMandateActive('MAND-99887766', 'UCC-TAN-987654', 'UMRN123456789012345');
  const activeMandate = webhookController.mandatesMap.get('MM-TEST-001')!;
  console.log(`   [State]: Mandate transitioned to: ${activeMandate.status} (UMRN: ${activeMandate.umrn})`);
  if (activeMandate.status !== 'ACTIVE_APPROVED') {
    throw new Error('Mandate failed to transition to ACTIVE_APPROVED');
  }
  console.log('   ✅ Mandate Webhook Lifecycle verified.\n');

  // --------------------------------------------------------------------------
  // TEST 5: SYSTEMATIC SIP ACTIVATION & PAUSE FLOW VIA WEBHOOK
  // --------------------------------------------------------------------------
  console.log('🔁 5. Testing Systematic SIP Lifecycle via Webhooks...');
  let sip: SystematicRegistration = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: 'UCC-TAN-987654',
    memSxpRefId: 'SIP-TEST-001',
    bseRegNo: 'REG-88990011',
    sxpType: 'SIP',
    srcSchemeBseCode: 'PRTFGP-GR',
    physOrDemat: 'P',
    frequency: 'm',
    installmentAmount: 5000,
    isUnits: false,
    installmentDay: 15,
    startDate: '2026-12-15',
    isPerpetual: true,
    firstOrderToday: false,
    hasTopup: false,
    status: 'SUBMITTED_TO_BSE',
    regulatory: {
      subBrArn: 'ARN-347849',
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true
    }
  };

  webhookController.sxpMap.set(sip.memSxpRefId, sip);

  // Activate SIP
  console.log('   📥 Simulating BSE Webhook: SXP (active)...');
  await webhookEmitter.emitSipActive('REG-88990011', 'UCC-TAN-987654');
  const activeSip = webhookController.sxpMap.get('SIP-TEST-001')!;
  console.log(`   [State]: SIP transitioned to: ${activeSip.status}`);
  if (activeSip.status !== 'ACTIVE') throw new Error('SIP failed to activate');

  // Pause SIP
  console.log('   📥 Simulating BSE Webhook: SXP (paused)...');
  await webhookEmitter.emitSipPaused('REG-88990011', 'UCC-TAN-987654');
  const pausedSip = webhookController.sxpMap.get('SIP-TEST-001')!;
  console.log(`   [State]: SIP transitioned to: ${pausedSip.status}`);
  if (pausedSip.status !== 'PAUSED') throw new Error('SIP failed to pause');
  console.log('   ✅ Systematic SIP Webhook Lifecycle verified.\n');

  // --------------------------------------------------------------------------
  // TEST 6: PAYMENT FAILURE / REJECTION EXCEPTION HANDLING
  // --------------------------------------------------------------------------
  console.log('❌ 6. Testing Payment Failure Handling...');
  let failedOrder: MutualFundOrder = {
    ...order,
    memOrdRefId: 'ORD-FAIL-001',
    bseOrderNo: 'BBO-FAIL-11223',
    status: 'AWAITING_PAYMENT',
    paymentStatus: 'PENDING'
  };
  webhookController.ordersMap.set(failedOrder.memOrdRefId, failedOrder);

  console.log('   📥 Simulating BSE Webhook: PAYMENT GATEWAY (agency_rejected)...');
  await webhookEmitter.emitPaymentRejected('BBO-FAIL-11223', 'UCC-TAN-987654', 'Insufficient funds in bank account');
  const rejectedOrder = webhookController.ordersMap.get('ORD-FAIL-001')!;
  console.log(`   [State]: Order transitioned to: ${rejectedOrder.status} (Payment: ${rejectedOrder.paymentStatus})`);
  console.log(`      Reason: ${rejectedOrder.rejectionReason}`);
  if (rejectedOrder.status !== 'EXPIRED' || rejectedOrder.paymentStatus !== 'FAILED') {
    throw new Error('Order failed to handle payment rejection correctly');
  }
  console.log('   ✅ Payment Failure handling verified.\n');

  console.log('========================================================================');
  console.log('🎉 ALL PHASE 4 STATE MACHINE & WEBHOOK TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================');
}

runPhase4Testbench().catch((err) => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
