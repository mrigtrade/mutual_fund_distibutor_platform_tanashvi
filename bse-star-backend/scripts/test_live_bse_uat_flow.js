/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 14/12: Live End-to-End BSE StAR MF v2.0 UAT Transaction Suite
 *
 * Executes live against https://starmfv2demo.bseindia.com/api from Static IP 130.210.57.235:
 *   1. Member Login (/api/login) -> RS256 Bearer JWT
 *   2. List Existing UCCs (/api/v2/list_ucc)
 *   3. Fetch Active Physical Regular Growth Scheme (/api/master_scheme_list)
 *   4. Register Live Demo UCC (/api/v2/add_ucc)
 *   5. Register Live Demo e-NACH Mandate (/api/mandate_register)
 *   6. Place Live Demo Lumpsum Purchase Order (/api/order_new)
 *   7. Register Live Demo Monthly SIP (/api/sxp_register)
 */

const BASE_URL = process.env.BSE_GATEWAY_URL || 'https://starmfv2demo.bseindia.com/api';
const MEMBER_ID = process.env.BSE_MEMBER_CODE || '94515';
const USERNAME = process.env.BSE_USERNAME || `member/${MEMBER_ID}/tanashvifintechpvtltd`;
const PASSWORD = process.env.BSE_PASSWORD || '94515@Xyz';
const TANASHVI_ARN = 'ARN-347849';

// Minimal valid 1x1 JPEG base64 for UAT AOF attachment field
const TINY_VALID_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

async function bsePost(endpoint, body, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function formatDateYmd(date) {
  return date.toISOString().split('T')[0];
}

async function runLiveUatFlow() {
  console.log('\n========================================================================');
  console.log('🚀 TANASHVI FINTECH — LIVE BSE StAR MF v2.0 END-TO-END UAT SUITE');
  console.log('========================================================================');
  console.log(`Gateway:  ${BASE_URL}`);
  console.log(`Member:   ${MEMBER_ID} | Username: ${USERNAME}\n`);

  // --------------------------------------------------------------------------
  // 1. LIVE LOGIN
  // --------------------------------------------------------------------------
  console.log('[1/7] Authenticating via POST /login ...');
  const loginRes = await bsePost('/login', {
    data: { username: USERNAME, password: PASSWORD }
  });
  if (loginRes.status !== 200 || !loginRes.json?.data?.access_token) {
    console.error('❌ Login failed:', loginRes.status, JSON.stringify(loginRes.json, null, 2));
    process.exit(1);
  }
  const token = loginRes.json.data.access_token;
  console.log(`  ✔ HTTP 200 OK | Bearer Token acquired (${token.slice(0, 28)}...)`);

  // --------------------------------------------------------------------------
  // 2. LIST EXISTING UCCS
  // --------------------------------------------------------------------------
  console.log('\n[2/7] Querying existing ACTIVE UCCs via POST /v2/list_ucc ...');
  const listUccRes = await bsePost(
    '/v2/list_ucc',
    {
      data: {
        count_only: false,
        start: 0,
        length: 5,
        fields: ['ALL'],
        member: {},
        investor: {},
        filter_param: {},
        ucc_status: 'ACTIVE'
      }
    },
    token
  );
  const existingUccs = listUccRes.json?.data?.lists || [];
  console.log(`  ✔ HTTP ${listUccRes.status} | Existing ACTIVE UCCs count: ${listUccRes.json?.data?.count ?? existingUccs.length}`);
  if (existingUccs.length > 0) {
    console.log(`  ℹ Sample existing UCC: ${existingUccs[0].client_code || JSON.stringify(existingUccs[0]).slice(0, 140)}`);
  }

  // --------------------------------------------------------------------------
  // 3. FETCH LIVE ACTIVE PHYSICAL REGULAR GROWTH SCHEME
  // --------------------------------------------------------------------------
  console.log('\n[3/7] Fetching live purchasable Physical Regular Growth scheme via POST /master_scheme_list ...');
  const schemeRes = await bsePost(
    '/master_scheme_list',
    {
      data: {
        fields: ['ALL'],
        count_only: false,
        start: 0,
        length: 10,
        filter_param: {
          scheme_amc_name: 'HDFC MUTUAL FUND',
          scheme_category: '',
          scheme_sub_category: '',
          investment_mode: '',
          scheme_option: 'Growth',
          scheme_plan: 'Regular',
          scheme_isin: '',
          settlement_days: '',
          transaction_allowed: ''
        },
        search: { value: 'TOP 100' }
      }
    },
    token
  );
  let schemes = schemeRes.json?.data?.lists || [];
  if (schemes.length === 0) {
    const fallbackSchemeRes = await bsePost(
      '/master_scheme_list',
      {
        data: {
          fields: ['ALL'],
          count_only: false,
          start: 0,
          length: 10,
          filter_param: {
            scheme_amc_name: '',
            scheme_category: '',
            scheme_sub_category: '',
            investment_mode: '',
            scheme_option: 'Growth',
            scheme_plan: 'Regular',
            scheme_isin: '',
            settlement_days: '',
            transaction_allowed: ''
          },
          search: { value: 'HDFC' }
        }
      },
      token
    );
    schemes = fallbackSchemeRes.json?.data?.lists || [];
  }
  const chosenScheme = schemes.find(s => s.scheme_bse_code && !String(s.scheme_bse_code).includes('-L1')) || schemes[0];
  const schemeBseCode = chosenScheme?.scheme_bse_code || 'HDFCT100-GR';
  console.log(`  ✔ Selected Live BSE Scheme: ${chosenScheme?.name || schemeBseCode} | BSE Code: ${schemeBseCode} | ISIN: ${chosenScheme?.scheme_isin || 'N/A'}`);

  // --------------------------------------------------------------------------
  // 4. REGISTER LIVE DEMO INDIVIDUAL PHYSICAL UCC
  // --------------------------------------------------------------------------
  const uniqueSuffix = String(Date.now()).slice(-6);
  const demoClientCode = `TANUAT${uniqueSuffix}`;
  console.log(`\n[4/7] Registering Live Demo UCC (${demoClientCode}) via POST /v2/add_ucc ...`);

  const uccPayload = {
    data: {
      investor: { client_code: demoClientCode },
      is_multi_ucc: false,
      parent_client_code: '',
      pms_client: false,
      pms_code: '',
      holding_nature: 'SI',
      tax_code: '01',
      rdmp_idcw_pay_mode: '01',
      is_client_physical: true,
      is_client_demat: false,
      is_nomination_opted: false,
      nominee_soa: false,
      nomination_auth_mode: 'O',
      comm_mode: 'E',
      onboarding: 'Z',
      holder: [
        {
          holder_rank: '1',
          occ_code: '02',
          auth_mode: 'M',
          is_pan_exempt: false,
          pan_exempt_category: '',
          identifier: [
            {
              identifier_type: 'pan',
              identifier_number: 'ABCPE1234F'
            }
          ],
          kyc_type: 'K',
          ckyc_number: '',
          person: {
            first_name: 'RAMESH',
            middle_name: 'KUMAR',
            last_name: 'SHARMA',
            dob: '1988-05-15',
            gender: 'M'
          },
          contact: [
            {
              contact_number: '9820112233',
              country_code: '91',
              whose_contact_number: 'SE',
              email_address: 'tanashvi.in@gmail.com',
              whose_email_address: 'SE',
              contact_type: 'PR'
            }
          ]
        }
      ],
      comm_addr: {
        address_line_1: 'Flat 402 Tanashvi Heights',
        address_line_2: 'Linking Road Bandra West',
        address_line_3: 'Mumbai Maharashtra',
        comm_mode: 'E',
        postalcode: '400050',
        address_id: 0
      },
      bank_account: [
        {
          ifsc_code: 'ICIC0000178',
          bank_acc_num: '017701504315',
          bank_acc_type: 'SB',
          account_owner: 'SELF',
          file_blob: ''
        }
      ],
      fatca: [
        {
          HolderRank: '1',
          place_of_birth: 'Mumbai',
          country_of_birth: 'IND',
          client_name: 'RAMESH KUMAR SHARMA',
          investor_type: 'Individual',
          dob: '1988-05-15',
          father_name: 'SURESH SHARMA',
          spouse_name: '',
          address_type: '1',
          occ_code: '02',
          occ_type: 'S',
          tax_status: 'Individual',
          identifier: {
            identifier_type: 'pan',
            identifier_number: 'ABCPE1234F'
          },
          wealth_source: '1',
          income_slab: '32',
          net_worth: 2500000,
          date_of_net_worth: '2026-03-31',
          politically_exposed: 'N',
          is_self_declared: true,
          data_source: 'P',
          tax_residency: [
            {
              country: 'IND',
              tax_id_no: 'ABCPE1234F',
              tax_id_type: 'A'
            }
          ]
        }
      ],
      identifiers: [
        {
          identifier_type: 'aof',
          issue_date: '',
          expiry_date: '',
          file_name: 'aof.jpg',
          file_size: 160,
          file_blob: TINY_VALID_JPEG_B64,
          additional_info: null
        }
      ]
    }
  };

  const uccRes = await bsePost('/v2/add_ucc', uccPayload, token);
  console.log(`  HTTP ${uccRes.status} | Response:`, JSON.stringify(uccRes.json, null, 2).slice(0, 800));

  // Decide which UCC to use for Mandate/Order/SIP (prefer newly created if accepted, else existing active UCC)
  const activeUccForTx =
    uccRes.json?.status === 'success'
      ? demoClientCode
      : existingUccs[0]?.client_code || demoClientCode;
  console.log(`  ℹ Proceeding with UCC for downstream tests: ${activeUccForTx}`);

  // --------------------------------------------------------------------------
  // 5. REGISTER LIVE DEMO e-NACH MANDATE
  // --------------------------------------------------------------------------
  const today = new Date();
  const futureStart = new Date(today);
  futureStart.setDate(futureStart.getDate() + 2);
  const validTill = new Date(futureStart);
  validTill.setFullYear(validTill.getFullYear() + 20);

  console.log(`\n[5/7] Registering Live Demo e-NACH Mandate for ${activeUccForTx} via POST /mandate_register ...`);
  const mandateRes = await bsePost(
    '/mandate_register',
    {
      data: {
        member: MEMBER_ID,
        investor: { ucc: activeUccForTx },
        mem_details: {
          euin: '',
          sub_br_arn: TANASHVI_ARN,
          sub_br_code: ''
        },
        investor_bank_details: {
          ifsc: 'ICIC0000178',
          no: '017701504315',
          type: 'SB',
          name: 'ICICI BANK LIMITED',
          branch: 'BHARUCH',
          vpa: null
        },
        amount: 25000,
        start_date: formatDateYmd(futureStart),
        valid_till: formatDateYmd(validTill),
        reg_date: formatDateYmd(today),
        type: 'N',
        redirect_url: 'https://www.tanashvi.in',
        mode: 'ACH',
        frequency: 'AS AND WHEN PRESENTED',
        request_type: 'REGISTRATION'
      }
    },
    token
  );
  console.log(`  HTTP ${mandateRes.status} | Response:`, JSON.stringify(mandateRes.json, null, 2).slice(0, 800));

  // --------------------------------------------------------------------------
  // 6. PLACE LIVE DEMO LUMPSUM PURCHASE ORDER
  // --------------------------------------------------------------------------
  const memOrdRefId = `TANORD${Date.now()}`.slice(0, 16);
  console.log(`\n[6/7] Placing Live Demo ₹1,000 Purchase Order (${memOrdRefId}) via POST /order_new ...`);
  const orderRes = await bsePost(
    '/order_new',
    {
      data: {
        orders: [
          {
            type: 'p',
            mem_ord_ref_id: memOrdRefId,
            investor: { ucc: activeUccForTx },
            member: MEMBER_ID,
            scheme: schemeBseCode,
            amount: 1000,
            cur: 'INR',
            is_units: false,
            all_units: false,
            min_redeem_flag: false,
            folio: '',
            is_fresh: true,
            phys_or_demat: 'p',
            holder: [
              {
                holder_rank: '1',
                email: 'tanashvi.in@gmail.com',
                mobnum: '9820112233'
              }
            ],
            is_nomination_opted: false,
            nomination_auth_mode: '',
            payment_ref_id: '',
            email: 'tanashvi.in@gmail.com',
            mobnum: '+919820112233',
            kyc_passed: true,
            dpc: true
          }
        ]
      }
    },
    token
  );
  console.log(`  HTTP ${orderRes.status} | Response:`, JSON.stringify(orderRes.json, null, 2).slice(0, 900));

  // --------------------------------------------------------------------------
  // 7. REGISTER LIVE DEMO MONTHLY SIP
  // --------------------------------------------------------------------------
  const memSxpRefId = `TANSIP${Date.now()}`.slice(0, 16);
  const sipStart = new Date(today);
  sipStart.setDate(sipStart.getDate() + 10);
  console.log(`\n[7/7] Registering Live Demo ₹2,000 Monthly SIP (${memSxpRefId}) via POST /sxp_register ...`);
  const sipRes = await bsePost(
    '/sxp_register',
    {
      data: {
        sxp_type: 'sip',
        mem_sxp_ref_id: memSxpRefId,
        investor: { ucc: activeUccForTx },
        member: MEMBER_ID,
        src_scheme: schemeBseCode,
        kyc_passed: true,
        dest_scheme: '',
        amc_code: '',
        exch_mandate_id: 0,
        amount: 2000,
        cur: 'INR',
        is_fresh: true,
        src_folio: '',
        dest_folio: '',
        phys_or_demat: 'p',
        isunits: false,
        min_redeem_flag: false,
        dpc: false,
        start_date: formatDateYmd(sipStart),
        end_date: null,
        freq: 'm',
        txn_date: sipStart.getDate(),
        payment_ref_id: '',
        mem_details: {
          euin: '',
          euin_flag: null,
          sub_br_code: '',
          sub_br_arn: TANASHVI_ARN,
          partner_id: ''
        },
        holder: [
          {
            holder_rank: '1',
            email: 'tanashvi.in@gmail.com',
            mobnum: '9820112233'
          }
        ],
        remark: 'Tanashvi UAT SIP Test',
        email: 'tanashvi.in@gmail.com',
        mobnum: '+919820112233',
        first_order_today: true,
        brokerage: 0,
        ninstallments: 12,
        special_product: {
          special_prod_type: '',
          special_prod_name: '',
          target_scheme: '',
          target_amt: 0,
          goal_type: '',
          goal_amt: 0,
          sip_tenure: 0
        }
      }
    },
    token
  );
  console.log(`  HTTP ${sipRes.status} | Response:`, JSON.stringify(sipRes.json, null, 2).slice(0, 900));

  console.log('\n========================================================================');
  console.log('🏁 LIVE BSE StAR MF v2.0 UAT TRANSACTION RUN COMPLETE');
  console.log('========================================================================\n');
}

runLiveUatFlow().catch(err => {
  console.error('Fatal UAT flow error:', err);
  process.exit(1);
});
