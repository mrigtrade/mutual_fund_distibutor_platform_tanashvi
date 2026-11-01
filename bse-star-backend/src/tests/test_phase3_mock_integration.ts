/**
 * Phase 3 Integration Testbench - End-to-End Offline BSE StAR MF v2 Simulation
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * (security, state machines, DTO builders, and validation engines) is designed to run
 * self-contained locally against simulated BSE responses.
 * 
 * Verifies:
 * 1. Member Login & Bearer Token Issuance
 * 2. UCC Registration with up to 5 Nominees, Minor Guardian & FATCA
 * 3. Mandate Registration (eNACH)
 * 4. Systematic Registration (SIP linked to Mandate)
 * 5. Lumpsum Purchase Order placement with AMFI ARN & SEBI EUIN Attribution
 * 6. Business Validation Enforcement (Nominee 100% check, Missing ARN rejection)
 */

import { JoseSecurityService } from '../security/jose.js';
import { BseHeaderService } from '../security/bseHeaders.js';
import { BseMockGateway } from '../mock/bseMockGateway.js';
import { UccRequestBuilder } from '../builders/uccRequestBuilder.js';
import { OrderRequestBuilder } from '../builders/orderRequestBuilder.js';
import { SxpRequestBuilder } from '../builders/sxpRequestBuilder.js';
import { MandateRequestBuilder } from '../builders/mandateRequestBuilder.js';
import { UccInvestorProfile } from '../types/ucc.js';
import { MutualFundOrder, SystematicRegistration, MandateRegistration } from '../types/order.js';

async function runPhase3OfflineIntegrationTest() {
  console.log('========================================================================');
  console.log('🚀 Phase 3: BSE StAR MF v2 End-to-End Offline Mock Integration Testbench');
  console.log('🛡️  Core Mandate: ZERO LIVE DEPENDENCY (Offline / Mock-First)');
  console.log('========================================================================\n');

  // Setup Keys
  console.log('🔑 1. Initializing RSA-2048 KeyPairs for Tanashvi (Member 714114) and BSE Exchange...');
  const memberKeys = JoseSecurityService.generateKeyPair();
  const rawBseKeys = JoseSecurityService.generateKeyPair();
  const bseKeys = {
    bsePublicKeyPem: rawBseKeys.publicKeyPem,
    bsePrivateKeyPem: rawBseKeys.privateKeyPem
  };
  const mockGateway = new BseMockGateway(
    { memberCode: '714114', fingerprint: 'BSE_FINGERPRINT_3A89C0' },
    bseKeys
  );
  console.log('   ✅ Cryptographic key infrastructure ready.\n');

  // --------------------------------------------------------------------------
  // STEP 1: LOGIN FLOW
  // --------------------------------------------------------------------------
  console.log('🔐 2. Testing Member Authentication (/login)...');
  const loginPayload = {
    data: {
      username: 'member/714114/tanashvi.admin',
      password: 'ProductionPassword#2026'
    }
  };

  const loginHeaders = BseHeaderService.buildHeaders({
    memberCode: '714114',
    fingerprint: 'BSE_FINGERPRINT_3A89C0',
    isLoginRequest: true
  });

  const encryptedLoginRequest = await JoseSecurityService.ctEncrypt(
    loginPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  const encryptedLoginResponse = await mockGateway.handleEncryptedRequest(
    '/login',
    encryptedLoginRequest,
    loginHeaders,
    memberKeys.publicKeyPem
  );

  const loginResponse = await JoseSecurityService.ctDecrypt(
    encryptedLoginResponse,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (loginResponse.status !== 'success' || !loginResponse.data?.access_token) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse)}`);
  }

  const accessToken = loginResponse.data.access_token;
  console.log('   ✅ Login Successful! Access Token issued:');
  console.log(`      Token: ${accessToken.substring(0, 32)}... (Expires in ${loginResponse.data.expires_in}s)\n`);

  // Common authenticated headers helper
  const getAuthHeaders = () => BseHeaderService.buildHeaders({
    memberCode: '714114',
    fingerprint: 'BSE_FINGERPRINT_3A89C0',
    accessToken: accessToken
  });

  // --------------------------------------------------------------------------
  // STEP 2: UCC REGISTRATION FLOW (PHYSICAL + 5 NOMINEES + MINOR GUARDIAN)
  // --------------------------------------------------------------------------
  console.log('👤 3. Testing Client UCC Registration with 5 Nominees (/api/v2/add_ucc)...');
  const sampleUccProfile: UccInvestorProfile = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    clientCode: 'UCC-TAN-987654',
    holdingNature: 'SI',
    taxCode: '01',
    rdmpIdcwPayMode: '02',
    isClientPhysical: true,
    isClientDemat: false,
    isNominationOpted: true,
    nominationAuthMode: 'O',
    holders: [
      {
        holderRank: 1,
        pan: 'ABCDE1234F',
        isPanExempt: false,
        ckycNumber: '99887766554433',
        kycType: 'C',
        firstName: 'Vikram',
        middleName: 'Aditya',
        lastName: 'Singhania',
        dob: '1988-04-12',
        gender: 'M',
        occupationCode: '01',
        contactNumber: '9876543210',
        countryCode: '91',
        whoseContactNumber: 'SE',
        emailAddress: 'vikram.singhania@example.com',
        whoseEmailAddress: 'SE',
        contactType: 'PR'
      }
    ],
    // Exact 5 Nominees with percentages summing to 100%
    nominees: [
      {
        nomineeRank: 1,
        firstName: 'Ananya',
        lastName: 'Singhania',
        dob: '1990-08-20',
        nominationPercent: 40,
        nominationRelation: '01', // Spouse
        isPanExempt: false,
        pan: 'BCDEF2345G',
        isMinor: false
      },
      {
        nomineeRank: 2,
        firstName: 'Aarav',
        lastName: 'Singhania',
        dob: '2016-11-15', // Minor (< 18 yrs)
        nominationPercent: 20,
        nominationRelation: '02', // Son
        isPanExempt: true,
        panExemptCategory: '01',
        panExemptRefNo: 'MIN-001',
        isMinor: true,
        guardian: {
          firstName: 'Ananya',
          lastName: 'Singhania',
          dob: '1990-08-20',
          relation: 'Mother',
          pan: 'BCDEF2345G'
        }
      },
      {
        nomineeRank: 3,
        firstName: 'Diya',
        lastName: 'Singhania',
        dob: '2018-05-10', // Minor
        nominationPercent: 20,
        nominationRelation: '03', // Daughter
        isPanExempt: true,
        panExemptCategory: '01',
        panExemptRefNo: 'MIN-002',
        isMinor: true,
        guardian: {
          firstName: 'Ananya',
          lastName: 'Singhania',
          dob: '1990-08-20',
          relation: 'Mother',
          pan: 'BCDEF2345G'
        }
      },
      {
        nomineeRank: 4,
        firstName: 'Rajesh',
        lastName: 'Singhania',
        dob: '1958-01-10',
        nominationPercent: 10,
        nominationRelation: '04', // Father
        isPanExempt: false,
        pan: 'CDEFG3456H',
        isMinor: false
      },
      {
        nomineeRank: 5,
        firstName: 'Sunita',
        lastName: 'Singhania',
        dob: '1962-03-25',
        nominationPercent: 10,
        nominationRelation: '05', // Mother
        isPanExempt: false,
        pan: 'DEFGH4567J',
        isMinor: false
      }
    ],
    bankAccounts: [
      {
        accountNumber: '50100223344556',
        ifscCode: 'HDFC0000060',
        bankName: 'HDFC Bank',
        branchName: 'Fort Mumbai',
        accountType: 'SB',
        accountOwner: 'SELF',
        isDefault: true
      }
    ],
    communicationAddress: {
      addressType: 'COMMUNICATION',
      addressLine1: 'Penthouse 401, Nariman Point',
      addressLine2: 'Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400021',
      country: 'India'
    },
    fatcaDeclarations: [
      {
        holderRank: 1,
        placeOfBirth: 'Mumbai',
        countryOfBirth: 'India',
        wealthSourceCode: '01',
        incomeSlabCode: '33',
        netWorthAmount: 5000000,
        politicallyExposed: 'N',
        isSelfDeclared: true,
        taxResidency: [{ country: 'India' }]
      }
    ]
  };

  // Build exact BSE Request Structure
  const addUccPayload = UccRequestBuilder.buildAddUccRequest(sampleUccProfile, '714114');
  const encryptedUccReq = await JoseSecurityService.ctEncrypt(
    addUccPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  const encryptedUccRes = await mockGateway.handleEncryptedRequest(
    '/v2/add_ucc',
    encryptedUccReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );

  const uccResponse = await JoseSecurityService.ctDecrypt(
    encryptedUccRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (uccResponse.status !== 'success' || !uccResponse.data?.aof_ref_no) {
    throw new Error(`UCC registration failed: ${JSON.stringify(uccResponse)}`);
  }

  console.log('   ✅ Client UCC Registered on BSE StAR MF:');
  console.log(`      Client Code: ${uccResponse.data.client_code}`);
  console.log(`      BSE AOF Reference No: ${uccResponse.data.aof_ref_no}`);
  console.log(`      Status: ${uccResponse.data.status}\n`);

  // --------------------------------------------------------------------------
  // STEP 3: MANDATE REGISTRATION FLOW (eNACH)
  // --------------------------------------------------------------------------
  console.log('🏦 4. Testing Mandate Registration (/api/mandate_register)...');
  const sampleMandate: MandateRegistration = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: sampleUccProfile.clientCode,
    bankAccountId: '33333333-4444-5555-6666-777777777777',
    memMandateId: `MM-${Date.now()}`,
    mandateType: 'ENACH',
    maxAmount: 100000,
    startDate: '2026-11-01',
    validTill: '2036-10-31',
    frequency: 'AS AND WHEN PRESENTED',
    authMode: 'NETBANKING',
    status: 'INITIATED',
    regulatory: {
      subBrArn: 'ARN-347849',
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true
    }
  };

  const mandatePayload = MandateRequestBuilder.buildMandateRegisterRequest(
    sampleMandate,
    sampleUccProfile.bankAccounts[0],
    undefined,
    '714114'
  );

  const encryptedMandateReq = await JoseSecurityService.ctEncrypt(
    mandatePayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  const encryptedMandateRes = await mockGateway.handleEncryptedRequest(
    '/mandate_register',
    encryptedMandateReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );

  const mandateResponse = await JoseSecurityService.ctDecrypt(
    encryptedMandateRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (mandateResponse.status !== 'success' || !mandateResponse.data?.bse_mandate_id) {
    throw new Error(`Mandate registration failed: ${JSON.stringify(mandateResponse)}`);
  }

  const bseMandateId = mandateResponse.data.bse_mandate_id;
  console.log('   ✅ Mandate Registered with NPCI/BSE:');
  console.log(`      Member Mandate ID: ${mandateResponse.data.member_mandate_id}`);
  console.log(`      BSE Mandate ID: ${bseMandateId}`);
  console.log(`      NPCI UMRN: ${mandateResponse.data.umrn_number}`);
  console.log(`      Investor Auth URL: ${mandateResponse.data.auth_url}\n`);

  // --------------------------------------------------------------------------
  // STEP 4: SYSTEMATIC SIP REGISTRATION (LINKED TO MANDATE)
  // --------------------------------------------------------------------------
  console.log('🔁 5. Testing Systematic SIP Registration (/api/sxp_register)...');
  const sampleSip: SystematicRegistration = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: sampleUccProfile.clientCode,
    memSxpRefId: `SIP-TAN-${Date.now()}`,
    sxpType: 'SIP',
    srcSchemeBseCode: 'PRTFGP-GR',
    physOrDemat: 'P',
    frequency: 'm',
    installmentAmount: 5000,
    isUnits: false,
    installmentDay: 10,
    startDate: '2026-12-10',
    isPerpetual: true,
    firstOrderToday: false,
    hasTopup: false,
    status: 'INITIATED',
    regulatory: {
      subBrArn: 'ARN-347849',
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true
    }
  };

  const sxpPayload = SxpRequestBuilder.buildSxpRegisterRequest(
    sampleSip,
    bseMandateId,
    sampleUccProfile.bankAccounts[0],
    '714114'
  );

  const encryptedSxpReq = await JoseSecurityService.ctEncrypt(
    sxpPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  const encryptedSxpRes = await mockGateway.handleEncryptedRequest(
    '/sxp_register',
    encryptedSxpReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );

  const sxpResponse = await JoseSecurityService.ctDecrypt(
    encryptedSxpRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (sxpResponse.status !== 'success' || !sxpResponse.data?.bse_reg_no) {
    throw new Error(`SIP registration failed: ${JSON.stringify(sxpResponse)}`);
  }

  console.log('   ✅ Systematic SIP Registered:');
  console.log(`      Internal SIP Ref: ${sxpResponse.data.mem_sxp_ref_id}`);
  console.log(`      BSE Registration No: ${sxpResponse.data.bse_reg_no}`);
  console.log(`      Amount: INR ${sxpResponse.data.amount} (10th of every month)`);
  console.log(`      Status: ${sxpResponse.data.status}\n`);

  // --------------------------------------------------------------------------
  // STEP 5: FRESH LUMPSUM PURCHASE ORDER (/api/order_new)
  // --------------------------------------------------------------------------
  console.log('🛒 6. Testing Fresh Lumpsum Order Placement (/api/order_new)...');
  const sampleOrder: MutualFundOrder = {
    tenantId: '11111111-2222-3333-4444-555555555555',
    uccId: '22222222-3333-4444-5555-666666666666',
    uccClientCode: sampleUccProfile.clientCode,
    memOrdRefId: `ORD-TAN-${Date.now()}`,
    orderType: 'PURCHASE',
    purchaseType: 'FRESH',
    orderSource: 'LUMPSUM',
    schemeBseCode: 'PRTFGP-GR',
    physOrDemat: 'P',
    amount: 25000,
    isUnits: false,
    allUnits: false,
    currency: 'INR',
    paymentMode: 'UPI',
    paymentStatus: 'PENDING',
    status: 'VALIDATED',
    orderTimestamp: new Date().toISOString(),
    cutoffTime: '15:00:00',
    isSameDayNav: true,
    traceId: '99999999-8888-7777-6666-555555555555',
    regulatory: {
      subBrArn: 'ARN-347849', // Tanashvi ARN
      subBrCode: 'HO_MUMBAI',
      euin: 'E123456',
      euinFlag: true,
      partnerId: 'TANASHVI_PLATFORM'
    }
  };

  const orderPayload = OrderRequestBuilder.buildOrderNewRequest(
    sampleOrder,
    sampleUccProfile.bankAccounts[0],
    '714114'
  );

  const encryptedOrderReq = await JoseSecurityService.ctEncrypt(
    orderPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  const encryptedOrderRes = await mockGateway.handleEncryptedRequest(
    '/order_new',
    encryptedOrderReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );

  const orderResponse = await JoseSecurityService.ctDecrypt(
    encryptedOrderRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (orderResponse.status !== 'success' || !orderResponse.data?.orders?.[0]?.bse_order_no) {
    throw new Error(`Order placement failed: ${JSON.stringify(orderResponse)}`);
  }

  const placedOrder = orderResponse.data.orders[0];
  console.log('   ✅ Lumpsum Order Placed on BSE StAR MF:');
  console.log(`      Internal Order Ref: ${placedOrder.mem_ord_ref_id}`);
  console.log(`      BSE Exchange Order No: ${placedOrder.bse_order_no}`);
  console.log(`      Internal Exchange Ref: ${placedOrder.bse_internal_ref_no}`);
  console.log(`      Amount: INR ${placedOrder.amount}`);
  console.log(`      Payment Gateway URL: ${placedOrder.payment_url}`);
  console.log(`      Cut-off Status: ${placedOrder.cutoff_status}\n`);

  // --------------------------------------------------------------------------
  // STEP 6: BUSINESS VALIDATION CHECKS (NEGATIVE TESTING)
  // --------------------------------------------------------------------------
  console.log('🛡️  7. Testing Business Validation Enforcement...');

  // Test A: Nominee allocation does not sum to 100%
  const invalidNomineeProfile = JSON.parse(JSON.stringify(sampleUccProfile));
  invalidNomineeProfile.clientCode = 'UCC-FAIL-NOM';
  invalidNomineeProfile.nominees[0].nominationPercent = 10; // Sum becomes 70% instead of 100%

  const invalidUccPayload = UccRequestBuilder.buildAddUccRequest(invalidNomineeProfile, '714114');
  const encInvalidUccReq = await JoseSecurityService.ctEncrypt(
    invalidUccPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );
  const encInvalidUccRes = await mockGateway.handleEncryptedRequest(
    '/v2/add_ucc',
    encInvalidUccReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );
  const invalidUccRes = await JoseSecurityService.ctDecrypt(
    encInvalidUccRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (invalidUccRes.status === 'error' && invalidUccRes.messages[0]?.errcode === 'invalid_nomination_percent') {
    console.log('   ✅ Nominee validation passed: Correctly rejected nominee allocation summing to < 100%.');
  } else {
    throw new Error(`Expected nomination percent rejection, got: ${JSON.stringify(invalidUccRes)}`);
  }

  // Test B: Missing regulatory ARN
  const invalidOrder = JSON.parse(JSON.stringify(sampleOrder));
  invalidOrder.memOrdRefId = 'ORD-FAIL-ARN';
  invalidOrder.regulatory.subBrArn = ''; // Missing ARN

  const invalidOrderPayload = OrderRequestBuilder.buildOrderNewRequest(invalidOrder, undefined, '714114');
  invalidOrderPayload.data.orders[0].mem_details.sub_br_arn = ''; // Strip ARN

  const encInvalidOrderReq = await JoseSecurityService.ctEncrypt(
    invalidOrderPayload,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );
  const encInvalidOrderRes = await mockGateway.handleEncryptedRequest(
    '/order_new',
    encInvalidOrderReq,
    getAuthHeaders(),
    memberKeys.publicKeyPem
  );
  const invalidOrderRes = await JoseSecurityService.ctDecrypt(
    encInvalidOrderRes,
    mockGateway.getBsePublicKeyPem(),
    memberKeys.privateKeyPem
  );

  if (invalidOrderRes.status === 'error' && invalidOrderRes.messages[0]?.errcode === 'arn_missing') {
    console.log('   ✅ Regulatory validation passed: Correctly rejected order with missing ARN attribution.');
  } else {
    throw new Error(`Expected ARN rejection, got: ${JSON.stringify(invalidOrderRes)}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE 3 OFFLINE INTEGRATION TESTS PASSED CLEANLY (100% SUCCESS)');
  console.log('========================================================================');
}

runPhase3OfflineIntegrationTest().catch((err) => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
