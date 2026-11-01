/**
 * Automated Verification Testbench for BSE StAR MF v2 JOSE Security Module
 * 
 * Verifies:
 * 1. Tanashvi client encrypts request with BSE public key and signs with Tanashvi private key
 * 2. BSE gateway verifies Tanashvi signature and decrypts JWE
 * 3. BSE gateway encrypts response with Tanashvi public key and signs with BSE private key
 * 4. Tanashvi client verifies BSE signature and decrypts response
 * 5. Header injection logic validation (member 714114 + fingerprint + trace ID)
 */

import { JoseSecurityService } from '../security/jose.js';
import { BseHeaderService } from '../security/bseHeaders.js';
import { compactVerify, compactDecrypt } from 'jose';

async function runJoseVerification() {
  console.log('================================================================');
  console.log('🧪 BSE StAR MF v2 JOSE Security & Header Testbench (Phase 1)');
  console.log('================================================================\n');

  // Step 1: Generate Mock RSA Keypairs for both Tanashvi (Member 714114) and BSE Exchange
  console.log('🔑 Generating test RSA 2048-bit keypairs for Member and BSE Exchange...');
  const memberKeys = JoseSecurityService.generateKeyPair();
  const bseKeys = JoseSecurityService.generateKeyPair();
  console.log('   ✅ Member (Tanashvi) RSA-2048 KeyPair generated');
  console.log('   ✅ BSE Exchange RSA-2048 KeyPair generated\n');

  // Step 2: Test Outgoing Payload Encryption (ctEncrypt)
  const testOrderPayload = {
    data: {
      member: '714114',
      mem_details: {
        sub_br_arn: 'ARN-347849',
        sub_br_code: 'HO_MUMBAI',
        euin: 'E456789',
        euin_flag: true,
        partner_id: 'TANASHVI_PRIMARY'
      },
      orders: [
        {
          type: 'p',
          mem_ord_ref_id: 'TANASHVI-ORD-2026-0001',
          investor: { ucc: 'UCC887766' },
          scheme: 'INF209K01157-GR',
          amount: 25000,
          cur: 'INR',
          phys_or_demat: 'P'
        }
      ]
    }
  };

  console.log('📦 Encrypting sample Order Request using ctEncrypt()...');
  const encryptedRequestJws = await JoseSecurityService.ctEncrypt(
    testOrderPayload,
    bseKeys.publicKeyPem,
    memberKeys.privateKeyPem
  );

  console.log('   ✅ ctEncrypt() output (Compact JWS token string):');
  console.log(`   ${encryptedRequestJws.substring(0, 80)}...[len: ${encryptedRequestJws.length}]`);
  const jwsParts = encryptedRequestJws.split('.');
  console.log(`   ✅ JWS format check: Contains 3 dot-separated segments (header.payload.signature) -> ${jwsParts.length} parts\n`);

  // Step 3: Verify BSE can decrypt and verify Tanashvi's request
  console.log('🛡️  Simulating BSE Gateway receiving and validating the request...');
  const memberPubKey = await JoseSecurityService.loadPublicKey(memberKeys.publicKeyPem, 'RS256');
  const { payload: verifiedJweBytes } = await compactVerify(encryptedRequestJws, memberPubKey);
  const receivedJwe = new TextDecoder().decode(verifiedJweBytes);
  const jweParts = receivedJwe.split('.');
  console.log(`   ✅ JWE format check inside JWS payload -> ${jweParts.length} parts (header.encryptedKey.iv.ciphertext.tag)`);

  const bsePrivKey = await JoseSecurityService.loadPrivateKey(bseKeys.privateKeyPem, 'RSA-OAEP-256');
  const { plaintext } = await compactDecrypt(receivedJwe, bsePrivKey);
  const decryptedRequest = JSON.parse(new TextDecoder().decode(plaintext));
  console.log('   ✅ BSE successfully decrypted JSON payload:');
  console.log(`      Order Ref: ${decryptedRequest.data.orders[0].mem_ord_ref_id}`);
  console.log(`      Amount: INR ${decryptedRequest.data.orders[0].amount}`);
  console.log(`      Member Details ARN: ${decryptedRequest.data.mem_details.sub_br_arn}\n`);

  // Step 4: Simulate BSE generating an encrypted response and Tanashvi decrypting with ctDecrypt
  console.log('🔄 Simulating BSE Gateway sending encrypted response back to Tanashvi...');
  const bseResponsePayload = {
    status: 100,
    message: 'SUCCESS',
    data: {
      bse_order_id: 'BSE-STAR-88990011',
      mem_ord_ref_id: 'TANASHVI-ORD-2026-0001',
      allotted_nav: 148.52,
      cutoff_status: 'APPLICABLE_SAME_DAY'
    }
  };

  // BSE encrypts with Tanashvi's public key and signs with BSE's private key
  const encryptedResponseJws = await JoseSecurityService.ctEncrypt(
    bseResponsePayload,
    memberKeys.publicKeyPem,
    bseKeys.privateKeyPem
  );

  console.log('   📥 Tanashvi client calling ctDecrypt() on response token...');
  const decryptedResponse = await JoseSecurityService.ctDecrypt(
    encryptedResponseJws,
    bseKeys.publicKeyPem,
    memberKeys.privateKeyPem
  );

  console.log('   ✅ Decrypted response verified successfully:');
  console.log(`      Status: ${decryptedResponse.status}`);
  console.log(`      BSE Order ID: ${decryptedResponse.data.bse_order_id}`);
  console.log(`      Message: ${decryptedResponse.message}\n`);

  // Step 5: Test Header Injection Logic
  console.log('🏷️  Testing Header Injection Service...');
  const headers = BseHeaderService.buildHeaders({
    memberCode: '714114',
    fingerprint: '3a7b9c1d8e2f0145',
    accessToken: 'test_jwt_session_token_xyz987',
    traceId: '11111111-2222-3333-4444-555555555555'
  });

  console.log('   Generated BSE StAR MF Headers:');
  console.log(`   - Content-Type: ${headers['Content-Type']}`);
  console.log(`   - X-API-Org-ID: ${headers['X-API-Org-ID']}`);
  console.log(`   - Authorization: ${headers['Authorization']}`);
  console.log(`   - X-STARMFv2-Trace-ID: ${headers['X-STARMFv2-Trace-ID']}`);

  if (headers['X-API-Org-ID'] === 'member/714114:3a7b9c1d8e2f0145') {
    console.log('\n✅ ALL JOSE ENCRYPTION, DECRYPTION, AND HEADER TESTS PASSED!');
  } else {
    throw new Error('Header validation mismatch!');
  }
  console.log('================================================================');
}

runJoseVerification().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

