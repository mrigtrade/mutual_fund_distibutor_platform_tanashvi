/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * Phase 9 Testbench: MFD Proposal Basket & Magic Cart Execution
 * 
 * Tests:
 * 1. MFD curates a multi-scheme investment proposal (Lumpsum + SIP)
 * 2. Statutory ARN / EUIN routing attribution (ARN-347849 / E123456)
 * 3. Secure Magic Cart Link generation and state transition (SENT -> VIEWED)
 * 4. Investor one-click execution decomposed into BSE Orders & SIPs
 * 5. Payment gateway URL generation and execution summary audit
 * 6. Edge cases & security (tampered token, double execution protection)
 * 
 * Enshrines Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)
 */

import http from 'http';
import { createApp } from '../app.js';

function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase9Testbench() {
  console.log('========================================================================');
  console.log('🛒 Tanashvi B2B Mutual Fund Platform: MFD Proposal Cart (Phase 9)');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('🔗 Seamless MFD Proposal Link -> Investor One-Click BSE Execution');
  console.log('========================================================================\n');

  const app = createApp();
  const testServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = testServer.address() as any;
  const port = address.port;

  try {
    // ========================================================================
    // 1. MFD CREATES MULTI-SCHEME PROPOSAL BASKET
    // ========================================================================
    console.log('📝 1. Testing Proposal Basket Creation with ARN/EUIN Routing...');

    const createPayload = {
      client_code: 'UCC-RAMESH-001',
      investor_name: 'Ramesh Sharma',
      investor_email: 'ramesh.sharma@example.com',
      investor_mobile: '+919876543210',
      proposal_title: 'Long-Term Wealth Accumulation Strategy (2026)',
      notes: 'Curated allocation: Core large-cap lumpsum + high-conviction flexi-cap SIP.',
      mfd_arn: 'ARN-347849',
      mfd_euin: 'E123456',
      sub_broker_code: 'MUM-01',
      expiry_days: 7,
      items: [
        {
          item_type: 'LUMPSUM',
          scheme_code: '101968', // HDFC Top 100
          amount: 25000.00
        },
        {
          item_type: 'SIP',
          scheme_code: '122639', // Parag Parikh Flexi Cap
          amount: 10000.00,
          sip_frequency: 'm',
          sip_day: 10,
          sip_installments: 120
        }
      ]
    };

    const createRes = await makeRequest(port, 'POST', '/api/v1/proposals/create', createPayload);
    assert(createRes.status === 201, `Proposal creation failed with status ${createRes.status}`);

    const proposal = createRes.body.data;
    console.log(`   ✅ Proposal Basket Created:
       ID: ${proposal.id}
       Title: "${proposal.proposal_title}"
       Distributor ARN: ${proposal.mfd_arn} | EUIN: ${proposal.mfd_euin}
       Client: ${proposal.investor_name} (${proposal.client_code})
       Total Lumpsum: ₹${proposal.total_lumpsum_amount}
       Total Monthly SIP: ₹${proposal.total_monthly_sip_amount}
       Magic Cart URL: ${proposal.magic_cart_url}
       Status: ${proposal.status}`);

    assert(proposal.total_lumpsum_amount === 25000, 'Total lumpsum should be ₹25,000');
    assert(proposal.total_monthly_sip_amount === 10000, 'Total SIP should be ₹10,000');
    assert(proposal.items.length === 2, 'Should have 2 items in proposal');
    assert(proposal.status === 'SENT_TO_INVESTOR', 'Initial status should be SENT_TO_INVESTOR');

    const shareToken = proposal.share_token;
    const proposalId = proposal.id;

    // ========================================================================
    // 2. INVESTOR OPENS MAGIC CART LINK
    // ========================================================================
    console.log('\n👁️  2. Testing Investor Opening Magic Cart Link...');

    const viewRes = await makeRequest(port, 'GET', `/api/v1/proposals/view?token=${shareToken}`);
    assert(viewRes.status === 200, 'Opening magic cart link should return 200 OK');
    const viewedProposal = viewRes.body.data;

    console.log(`   ✅ Investor viewed proposal:
       Current Status: ${viewedProposal.status}
       Viewed At: ${viewedProposal.viewed_at}
       Schemes presented to investor:
       - ${viewedProposal.items[0].scheme_name}: ₹${viewedProposal.items[0].amount} (${viewedProposal.items[0].item_type})
       - ${viewedProposal.items[1].scheme_name}: ₹${viewedProposal.items[1].amount} (${viewedProposal.items[1].item_type} on day ${viewedProposal.items[1].sip_day})`);

    assert(viewedProposal.status === 'VIEWED', 'Status must transition to VIEWED upon opening');
    assert(viewedProposal.viewed_at !== null, 'viewed_at must be populated');

    // ========================================================================
    // 3. INVESTOR APPROVES & EXECUTES PROPOSAL CART
    // ========================================================================
    console.log('\n🚀 3. Testing One-Click Proposal Cart Execution against BSE StAR MF...');

    const executePayload = {
      proposal_id: proposalId,
      share_token: shareToken,
      payment_mode: 'UPI'
    };

    const executeRes = await makeRequest(port, 'POST', '/api/v1/proposals/execute', executePayload);
    assert(executeRes.status === 200, `Proposal execution failed with status ${executeRes.status}`);

    const executedProposal = executeRes.body.data;
    console.log(`   ✅ Proposal Cart Executed Successfully:
       Status: ${executedProposal.status}
       Accepted At: ${executedProposal.accepted_at}
       Summary:
       - Orders Placed: ${executedProposal.execution_summary.total_orders_placed}
       - SIPs Registered: ${executedProposal.execution_summary.total_sips_registered}
       - Failed Items: ${executedProposal.execution_summary.failed_items}`);

    assert(executedProposal.status === 'EXECUTED', 'Proposal status should be EXECUTED');
    assert(executedProposal.execution_summary.total_orders_placed === 1, '1 lumpsum order should be placed');
    assert(executedProposal.execution_summary.total_sips_registered === 1, '1 SIP should be registered');

    // Verify individual items
    const lumpsumItem = executedProposal.items.find((i: any) => i.item_type === 'LUMPSUM');
    const sipItem = executedProposal.items.find((i: any) => i.item_type === 'SIP');

    console.log(`   📦 Decomposed Transaction Details:
       - Lumpsum Item: BSE Order No: ${lumpsumItem.bse_order_ref_id} | Status: ${lumpsumItem.execution_status}
         Payment Link: ${lumpsumItem.payment_url}
       - Systematic SIP Item: BSE Reg No: ${sipItem.bse_reg_no} | Status: ${sipItem.execution_status}`);

    assert(lumpsumItem.bse_order_ref_id !== undefined, 'BSE order ref must be populated for lumpsum');
    assert(sipItem.bse_reg_no !== undefined, 'BSE registration no must be populated for SIP');

    // ========================================================================
    // 4. SECURITY & DOUBLE EXECUTION PREVENTION
    // ========================================================================
    console.log('\n🛡️  4. Testing Security Guardrails & Double Execution Prevention...');

    // Attempting to re-execute already executed proposal
    const doubleExecRes = await makeRequest(port, 'POST', '/api/v1/proposals/execute', executePayload);
    assert(doubleExecRes.status === 500 || doubleExecRes.status === 400, 'Re-execution must be rejected');
    console.log(`   ✅ Correctly blocked duplicate execution attempt: ${doubleExecRes.body.error?.message || doubleExecRes.body.message}`);

    // Attempting with tampered token
    const tamperedRes = await makeRequest(port, 'GET', '/api/v1/proposals/view?token=invalid_tampered_token_xyz');
    assert(tamperedRes.status === 404, 'Tampered token must return 404 Not Found');
    console.log('   ✅ Correctly rejected invalid/tampered token.');

    // ========================================================================
    // 5. MFD PROPOSAL LISTING
    // ========================================================================
    console.log('\n📋 5. Testing Distributor Proposal Listing...');
    const listRes = await makeRequest(port, 'GET', '/api/v1/proposals/list?mfd_arn=ARN-347849');
    assert(listRes.status === 200, 'Proposal listing should return 200 OK');
    console.log(`   ✅ Retrieved ${listRes.body.count} proposals for MFD ARN-347849`);
    assert(listRes.body.count >= 1, 'Should list at least 1 proposal');

  } finally {
    testServer.close();
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE 9 MFD PROPOSAL BASKET TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================');
}

runPhase9Testbench().catch((err) => {
  console.error('❌ Testbench threw unhandled error:', err);
  process.exit(1);
});

