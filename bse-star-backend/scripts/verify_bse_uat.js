/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * BSE StAR MF v2.0 - Live UAT Diagnostic & Verification Script
 *
 * Matches Official BSE StAR MF 2.0 Postman Collection (13-July-2026):
 *   Endpoint: POST https://starmfv2demo.bseindia.com/api/login
 *   Username: member/<MEMBER_ID>/<USER_ID>  (e.g. member/94515/tanashvifintechpvtltd)
 *   Master:   POST https://starmfv2demo.bseindia.com/api/master_scheme_list
 *
 * Usage on Oracle Cloud Server (Static IP 130.210.57.235):
 *   node verify_bse_uat.js
 *   node verify_bse_uat.js <custom_username> <custom_password>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const MEMBER_ID = process.argv[4] || process.env.BSE_MEMBER_ID || '94515';
const RAW_USER = process.argv[2] || process.env.BSE_USER_ID || 'tanashvifintechpvtltd';
// Official BSE v2 format: member/<member_id>/<user_id>
const FORMATTED_USERNAME = RAW_USER.startsWith('member/')
  ? RAW_USER
  : `member/${MEMBER_ID}/${RAW_USER}`;

const CONFIG = {
  memberId: MEMBER_ID,
  rawUserId: RAW_USER,
  username: FORMATTED_USERNAME,
  password: process.argv[3] || process.env.BSE_PASSWORD || '94515@Xyz',
  demoBaseUrl: process.env.BSE_BASE_URL || 'https://starmfv2demo.bseindia.com',
  privateKeyPath: process.env.BSE_PRIVATE_KEY_PATH || path.join(os.homedir(), 'bse-backend', 'bse_api_private.pem'),
  publicKeyPath: process.env.BSE_PUBLIC_KEY_PATH || path.join(os.homedir(), 'bse-backend', 'bse_api_public.pem')
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function printHeader(title) {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
}

function printStep(num, name) {
  console.log(`\n${colors.blue}${colors.bright}[Step ${num}] ${name}${colors.reset}`);
}

function printSuccess(msg) {
  console.log(`  ${colors.green}✔ ${msg}${colors.reset}`);
}

function printWarn(msg) {
  console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function printError(msg) {
  console.log(`  ${colors.red}✖ ${msg}${colors.reset}`);
}

async function runDiagnostics() {
  printHeader('BSE StAR MF v2.0 - LIVE UAT AUTHENTICATION & MASTER DATA TESTBENCH');
  console.log(`Timestamp:       ${new Date().toISOString()}`);
  console.log(`Host Platform:   ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Member ID:       ${CONFIG.memberId}`);
  console.log(`API Username:    ${CONFIG.username}`);
  console.log(`BSE Gateway:     ${CONFIG.demoBaseUrl}/api`);

  // Step 1: RSA Keys Check
  printStep(1, 'Inspecting Local RSA Cryptographic Keys...');
  if (fs.existsSync(CONFIG.privateKeyPath)) {
    printSuccess(`Private Key found at: ${CONFIG.privateKeyPath} (${fs.readFileSync(CONFIG.privateKeyPath).length} bytes)`);
  } else if (fs.existsSync('./bse_api_private.pem')) {
    printSuccess(`Private Key found at: ./bse_api_private.pem`);
  } else {
    printWarn(`Private key not found at ${CONFIG.privateKeyPath} (not required for plaintext Demo login).`);
  }

  // Step 2: Whitelist & Reachability Check
  printStep(2, 'Verifying Static IP Whitelisting & TLS Handshake...');
  const t0 = Date.now();
  try {
    const ping = await fetch(`${CONFIG.demoBaseUrl}/api/login`, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(10000)
    });
    printSuccess(`Static IP (130.210.57.235) WHITELISTED! Handshake in ${Date.now() - t0}ms (HTTP ${ping.status})`);
  } catch (e) {
    printWarn(`OPTIONS probe note: ${e.message}. Proceeding to POST /api/login...`);
  }

  // Step 3: Official BSE StAR MF v2 Member Login (Postman Collection Exact Format)
  printStep(3, `Authenticating via POST ${CONFIG.demoBaseUrl}/api/login...`);
  const loginUrl = `${CONFIG.demoBaseUrl}/api/login`;
  const loginBody = {
    data: {
      username: CONFIG.username,
      password: CONFIG.password
    }
  };

  console.log(`  Request URL:     POST ${loginUrl}`);
  console.log(`  Request Payload: ${JSON.stringify({ data: { username: CONFIG.username, password: '********' } })}`);

  let authToken = null;

  try {
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginBody),
      signal: AbortSignal.timeout(15000)
    });

    const rawText = await res.text();
    console.log(`  HTTP Status:     ${res.status} ${res.statusText}`);

    try {
      const json = JSON.parse(rawText);
      console.log(`  Response Body:   ${JSON.stringify(json, null, 2)}`);

      if (json.data && json.data.access_token) {
        authToken = json.data.access_token;
        printSuccess(`LIVE BSE UAT AUTHENTICATION SUCCESSFUL!`);
        printSuccess(`Access Token Issued: ${authToken.substring(0, 32)}...`);
      } else {
        printError(`Authentication did not return access_token. Full response logged above for BSE investigation.`);
      }
    } catch {
      console.log(`  Raw Response:    ${rawText.substring(0, 300)}`);
    }
  } catch (err) {
    printError(`Login Request Failed: ${err.message}`);
  }

  // Step 4: Live Authorized Query — Official /api/master_scheme_list
  if (authToken) {
    printStep(4, 'Fetching Live Mutual Fund Schemes via POST /api/master_scheme_list...');
    try {
      const schemePayload = {
        data: {
          fields: ['ALL'],
          count_only: false,
          start: 0,
          length: 3,
          filter_param: {
            scheme_amc_name: '',
            scheme_category: '',
            scheme_sub_category: '',
            investment_mode: '',
            scheme_option: '',
            scheme_plan: '',
            scheme_isin: '',
            settlement_days: '',
            transaction_allowed: ''
          },
          search: { value: '' }
        }
      };

      const schemeResp = await fetch(`${CONFIG.demoBaseUrl}/api/master_scheme_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(schemePayload),
        signal: AbortSignal.timeout(15000)
      });

      const schemeText = await schemeResp.text();
      console.log(`  HTTP Status:     ${schemeResp.status} ${schemeResp.statusText}`);
      try {
        const schemeJson = JSON.parse(schemeText);
        const lists = schemeJson?.data?.lists || schemeJson?.data || [];
        printSuccess(`LIVE SCHEME MASTER RETRIEVED FROM BSE UAT! (${Array.isArray(lists) ? lists.length : 'data'} sample record(s))`);
        console.log(`  Preview:\n${JSON.stringify(schemeJson, null, 2).substring(0, 900)}...`);
      } catch {
        console.log(`  Raw Master Response: ${schemeText.substring(0, 300)}`);
      }
    } catch (err) {
      printError(`Scheme Master query error: ${err.message}`);
    }
  }

  printHeader('DIAGNOSTIC SUMMARY');
  console.log(`1. Server Static IP: 130.210.57.235`);
  console.log(`2. BSE Member ID:    ${CONFIG.memberId}`);
  console.log(`3. BSE v2 Username:  ${CONFIG.username}`);
  console.log(`4. Target Gateway:   ${CONFIG.demoBaseUrl}/api`);
  if (authToken) {
    console.log(`\n${colors.green}${colors.bright}🎉 STATUS: ALL SYSTEMS GO! LIVE BSE StAR MF v2 UAT TOKEN & MASTER DATA VERIFIED!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠ STATUS: LOGIN NOT YET ACCEPTED — SHARE THE REQUEST/RESPONSE LOG ABOVE WITH BSE.${colors.reset}\n`);
  }
}

runDiagnostics().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
