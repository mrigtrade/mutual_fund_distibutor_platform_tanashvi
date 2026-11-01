/**
 * Phase 5 REST API Gateway Testbench
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * (security, state machines, DTO builders, and validation engines) runs
 * self-contained locally against simulated BSE responses.
 * 
 * Verifies:
 * 1. Health check (/health)
 * 2. Multi-tenant context extraction & EUIN/ARN validation
 * 3. Client UCC Registration (/api/v1/ucc/register) with 5 nominees
 * 4. Mandate Registration (/api/v1/mandates/create)
 * 5. Systematic SIP Registration (/api/v1/sxp/register)
 * 6. Lumpsum Order Creation (/api/v1/orders/create) with Cut-off Analysis
 * 7. Inbound Webhook Ingestion (/api/v1/webhooks/bse)
 * 8. Error Handling & Validation Guards
 */

import { createApp } from '../app.js';
import { Server } from 'http';
import { BseWebhookController } from '../controllers/bseWebhookController.js';
import { MutualFundOrder } from '../types/order.js';

async function runApiServerTestbench() {
  console.log('========================================================================');
  console.log('🚀 Phase 5: Tanashvi B2B REST API Gateway & Server Testbench');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('========================================================================\n');

  const app = createApp();
  let server: Server;
  let baseUrl = '';

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`📡 Ephemeral Test Server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // --------------------------------------------------------------------------
    // 1. HEALTH CHECK
    // --------------------------------------------------------------------------
    console.log('🩺 1. Testing System Health & Diagnostics (/health)...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.log(`   Response Status: ${healthRes.status}`);
    console.log(`   Gateway Mode:    ${healthJson.bse_gateway_mode}`);
    console.log(`   Member Code:     ${healthJson.member_code}`);
    if (healthRes.status !== 200 || healthJson.bse_gateway_mode !== 'MOCK') {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }
    console.log('   ✅ Health check passed.\n');

    // --------------------------------------------------------------------------
    // 2. UCC REGISTRATION WITH 5 NOMINEES
    // --------------------------------------------------------------------------
    console.log('👤 2. Testing Investor UCC Registration (/api/v1/ucc/register)...');
    const uccPayload = {
      client_code: 'UCC-API-998877',
      holding_pattern: 'SI',
      tax_status: '01',
      is_client_physical: true,
      is_client_demat: false,
      primary_holder: {
        pan: 'ABCDE1234F',
        is_pan_exempt: false,
        first_name: 'Rajesh',
        last_name: 'Sharma',
        date_of_birth: '1985-05-15',
        gender: 'M',
        email: 'rajesh.sharma@example.com',
        mobile_number: '9876543210',
        father_name: 'Suresh Sharma',
        address_line_1: 'Flat 402, Sunshine Heights',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400053',
        country: 'IND'
      },
      nominees: [
        { nominee_rank: 1, nominee_name: 'Priya Sharma', relationship: '01', date_of_birth: '1988-08-20', allocation_percentage: 40, is_minor: false },
        { nominee_rank: 2, nominee_name: 'Aarav Sharma', relationship: '02', date_of_birth: '2015-03-10', allocation_percentage: 20, is_minor: true, guardian_name: 'Priya Sharma', guardian_pan: 'FGHIJ5678K', guardian_relationship: '01' },
        { nominee_rank: 3, nominee_name: 'Ananya Sharma', relationship: '03', date_of_birth: '2018-07-25', allocation_percentage: 20, is_minor: true, guardian_name: 'Priya Sharma', guardian_pan: 'FGHIJ5678K', guardian_relationship: '01' },
        { nominee_rank: 4, nominee_name: 'Suresh Sharma', relationship: '04', date_of_birth: '1955-11-12', allocation_percentage: 10, is_minor: false },
        { nominee_rank: 5, nominee_name: 'Kanta Sharma', relationship: '05', date_of_birth: '1960-04-05', allocation_percentage: 10, is_minor: false }
      ],
      bank_accounts: [
        { bank_rank: 1, account_type: 'SB', account_number: '123456789012', ifsc_code: 'HDFC0000060', is_default: true }
      ],
      fatca: {
        country_of_birth: 'IND',
        place_of_birth: 'Mumbai',
        tax_residence_country: 'IND',
        is_politically_exposed: false
      }
    };

    const uccRes = await fetch(`${baseUrl}/api/v1/ucc/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'X-ARN': 'ARN-347849',
        'X-EUIN': 'E123456',
        'X-EUIN-Flag': 'Y'
      },
      body: JSON.stringify(uccPayload)
    });

    const uccJson = await uccRes.json();
    console.log(`   Response Status: ${uccRes.status}`);
    console.log(`   Registered UCC:  ${uccJson.data?.client_code}`);
    console.log(`   Nominee Count:   ${uccJson.data?.nominee_count}`);
    if (uccRes.status !== 201 || !uccJson.success) {
      throw new Error(`UCC registration failed: ${JSON.stringify(uccJson)}`);
    }
    console.log('   ✅ UCC registration passed.\n');

    // --------------------------------------------------------------------------
    // 3. MANDATE REGISTRATION
    // --------------------------------------------------------------------------
    console.log('🏦 3. Testing Bank Mandate Registration (/api/v1/mandates/create)...');
    const mandatePayload = {
      client_code: 'UCC-API-998877',
      mandate_type: 'ENACH',
      bank_account_number: '123456789012',
      ifsc_code: 'HDFC0000060',
      max_amount: 100000
    };

    const mandateRes = await fetch(`${baseUrl}/api/v1/mandates/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARN': 'ARN-347849'
      },
      body: JSON.stringify(mandatePayload)
    });

    const mandateJson = await mandateRes.json();
    console.log(`   Response Status: ${mandateRes.status}`);
    console.log(`   BSE Mandate ID:  ${mandateJson.data?.bse_mandate_id}`);
    console.log(`   NPCI UMRN:       ${mandateJson.data?.umrn}`);
    console.log(`   Auth URL:        ${mandateJson.data?.auth_url}`);
    if (mandateRes.status !== 201 || !mandateJson.data?.bse_mandate_id) {
      throw new Error(`Mandate registration failed: ${JSON.stringify(mandateJson)}`);
    }
    console.log('   ✅ Mandate registration passed.\n');

    // --------------------------------------------------------------------------
    // 4. SYSTEMATIC SIP REGISTRATION
    // --------------------------------------------------------------------------
    console.log('🔁 4. Testing Systematic SIP Registration (/api/v1/sxp/register)...');
    const sxpPayload = {
      client_code: 'UCC-API-998877',
      scheme_bse_code: 'PRTFGP-GR',
      sxp_type: 'SIP',
      frequency: 'MONTHLY',
      installment_amount: 5000,
      start_date: '2026-11-10',
      total_installments: 60,
      bse_mandate_id: mandateJson.data?.bse_mandate_id
    };

    const sxpRes = await fetch(`${baseUrl}/api/v1/sxp/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARN': 'ARN-347849',
        'X-EUIN': 'E123456'
      },
      body: JSON.stringify(sxpPayload)
    });

    const sxpJson = await sxpRes.json();
    console.log(`   Response Status: ${sxpRes.status}`);
    console.log(`   SIP Reg No:      ${sxpJson.data?.bse_registration_no}`);
    console.log(`   SIP State:       ${sxpJson.data?.state}`);
    if (sxpRes.status !== 201 || !sxpJson.data?.bse_registration_no) {
      throw new Error(`SIP registration failed: ${JSON.stringify(sxpJson)}`);
    }
    console.log('   ✅ SIP registration passed.\n');

    // --------------------------------------------------------------------------
    // 5. FRESH LUMPSUM ORDER CREATION
    // --------------------------------------------------------------------------
    console.log('🛒 5. Testing Mutual Fund Lumpsum Order (/api/v1/orders/create)...');
    const orderPayload = {
      client_code: 'UCC-API-998877',
      scheme_bse_code: 'PRTFGP-GR',
      order_type: 'FRESH_PURCHASE',
      amount: 25000,
      cutoff_type: 'EQUITY_DEBT'
    };

    const orderRes = await fetch(`${baseUrl}/api/v1/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARN': 'ARN-347849',
        'X-EUIN': 'E123456',
        'X-Sub-Broker-ARN': 'ARN-999999',
        'X-Sub-Broker-Code': 'DESK_01'
      },
      body: JSON.stringify(orderPayload)
    });

    const orderJson = await orderRes.json();
    console.log(`   Response Status: ${orderRes.status}`);
    console.log(`   BSE Order No:    ${orderJson.data?.bse_order_no}`);
    console.log(`   Order State:     ${orderJson.data?.order_state}`);
    console.log(`   Payment URL:     ${orderJson.data?.payment_gateway_url}`);
    console.log(`   Applicable NAV:  ${orderJson.data?.cutoff?.applicable_nav_date} (Cutoff: ${orderJson.data?.cutoff?.statutory_cutoff_time_ist})`);
    if (orderRes.status !== 201 || !orderJson.data?.bse_order_no) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderJson)}`);
    }
    console.log('   ✅ Lumpsum order placement passed.\n');

    // --------------------------------------------------------------------------
    // 6. WEBHOOK INGESTION
    // --------------------------------------------------------------------------
    console.log('📥 6. Testing BSE Webhook Ingestion (/api/v1/webhooks/bse)...');
    
    // Register the created order into the webhook controller map so it can update its state
    const webhookController = BseWebhookController.getInstance('714114');
    const createdBseOrderNo = orderJson.data.bse_order_no;
    const testOrderForWebhook: MutualFundOrder = {
      id: orderJson.data.order_id,
      tenantId: '00000000-0000-0000-0000-000000000001',
      uccId: 'ucc_default',
      uccClientCode: 'UCC-API-998877',
      memOrdRefId: orderJson.data.mem_ord_ref_id,
      bseOrderNo: createdBseOrderNo,
      schemeBseCode: 'PRTFGP-GR',
      orderType: 'PURCHASE',
      purchaseType: 'FRESH',
      orderSource: 'LUMPSUM',
      physOrDemat: 'P',
      amount: 25000,
      isUnits: false,
      allUnits: false,
      currency: 'INR',
      regulatory: {
        subBrArn: 'ARN-347849',
        euin: 'E123456',
        euinFlag: true
      },
      paymentMode: 'NETBANKING',
      paymentStatus: 'PENDING',
      status: 'AWAITING_PAYMENT',
      orderTimestamp: new Date().toISOString(),
      cutoffTime: '15:00:00',
      isSameDayNav: true,
      traceId: 'trace-test'
    };
    webhookController.ordersMap.set(testOrderForWebhook.memOrdRefId, testOrderForWebhook);

    const webhookPayload = {
      member: { member_id: '714114' },
      request_id: 'WH-REQ-2026-001',
      investor: { client_code: 'UCC-API-998877' },
      action: {
        msgcode: 200,
        at: new Date().toISOString(),
        event_type: 'PAYMENT GATEWAY',
        event: 'agency_approved',
        bse_order_ids: [createdBseOrderNo]
      }
    };

    const webhookRes = await fetch(`${baseUrl}/api/v1/webhooks/bse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    const webhookJson = await webhookRes.json();
    console.log(`   Response Status: ${webhookRes.status}`);
    console.log(`   Webhook Message: ${webhookJson.message}`);
    if (webhookRes.status !== 200 || !webhookJson.success) {
      throw new Error(`Webhook ingestion failed: ${JSON.stringify(webhookJson)}`);
    }

    const updatedOrder = webhookController.ordersMap.get(testOrderForWebhook.memOrdRefId);
    console.log(`   Order State Post-Webhook: ${updatedOrder?.status} (Payment: ${updatedOrder?.paymentStatus})`);
    if (updatedOrder?.status !== 'PAYMENT_CONFIRMED') {
      throw new Error(`Expected order to transition to PAYMENT_CONFIRMED, got ${updatedOrder?.status}`);
    }
    console.log('   ✅ Webhook ingestion passed.\n');

    // --------------------------------------------------------------------------
    // 7. VALIDATION GUARDS & ERROR HANDLING
    // --------------------------------------------------------------------------
    console.log('🛡️  7. Testing Regulatory & Validation Guards...');
    
    // Test A: Invalid ARN Header
    const badArnRes = await fetch(`${baseUrl}/api/v1/ucc/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARN': 'INVALID-ARN-ABC'
      },
      body: JSON.stringify(uccPayload)
    });
    const badArnJson = await badArnRes.json();
    console.log(`   Bad ARN Test: Status=${badArnRes.status}, ErrorCode=${badArnJson.error?.code}`);
    if (badArnRes.status !== 400 || badArnJson.error?.code !== 'INVALID_ARN_FORMAT') {
      throw new Error('Failed to block invalid ARN format');
    }

    // Test B: Invalid EUIN Header
    const badEuinRes = await fetch(`${baseUrl}/api/v1/ucc/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ARN': 'ARN-347849',
        'X-EUIN': 'X123'
      },
      body: JSON.stringify(uccPayload)
    });
    const badEuinJson = await badEuinRes.json();
    console.log(`   Bad EUIN Test: Status=${badEuinRes.status}, ErrorCode=${badEuinJson.error?.code}`);
    if (badEuinRes.status !== 400 || badEuinJson.error?.code !== 'INVALID_EUIN_FORMAT') {
      throw new Error('Failed to block invalid EUIN format');
    }

    // Test C: 404 Route Not Found
    const notFoundRes = await fetch(`${baseUrl}/api/v1/nonexistent`);
    const notFoundJson = await notFoundRes.json();
    console.log(`   404 Route Test: Status=${notFoundRes.status}, ErrorCode=${notFoundJson.error?.code}`);
    if (notFoundRes.status !== 404 || notFoundJson.error?.code !== 'ROUTE_NOT_FOUND') {
      throw new Error('Failed to return 404 for unknown route');
    }

    console.log('   ✅ Validation guards and error handling passed.\n');

    console.log('========================================================================');
    console.log('🎉 ALL PHASE 5 REST API GATEWAY TESTS PASSED (100% SUCCESS)');
    console.log('========================================================================');
  } finally {
    server!.close();
  }
}

runApiServerTestbench().catch((err) => {
  console.error('❌ Phase 5 Testbench Failed:', err);
  process.exit(1);
});
