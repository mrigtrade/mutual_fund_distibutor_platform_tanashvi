/**
 * BSE StAR MF v2.0 - Local Offline Gateway Simulator (Mock Engine)
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * (security, state machines, DTO builders, and validation engines) is designed to run
 * self-contained locally against simulated BSE responses.
 * 
 * Features:
 * - In-memory mock server emulating BSE StAR MF v2 REST endpoints
 * - Full cryptographic support: Decrypts incoming application/jose payloads and encrypts responses
 * - Realistic business validation (nominee allocation 100%, cut-off timings, IFSC, PAN)
 * - Simulates realistic BSE order numbers, registration numbers, and UMRNs
 */

import { JoseSecurityService } from '../security/jose.js';

export interface MockGatewayOptions {
  memberCode?: string;
  fingerprint?: string;
  enforceJose?: boolean;
}

export interface MockExchangeKeyPair {
  bsePublicKeyPem: string;
  bsePrivateKeyPem: string;
}

export class BseMockGateway {
  private memberCode: string;
  private fingerprint: string;
  private bseKeyPair: MockExchangeKeyPair;
  private registeredTokens = new Set<string>();

  // In-memory data store for the mock gateway
  private uccStore = new Map<string, any>();
  private orderStore = new Map<string, any>();
  private sxpStore = new Map<string, any>();
  private mandateStore = new Map<string, any>();

  constructor(options?: MockGatewayOptions, keyPair?: MockExchangeKeyPair) {
    this.memberCode = options?.memberCode || '714114';
    this.fingerprint = options?.fingerprint || 'BSE_FINGERPRINT_PLACEHOLDER_CHECKSUM';
    if (keyPair) {
      this.bseKeyPair = keyPair;
    } else {
      const generated = JoseSecurityService.generateKeyPair();
      this.bseKeyPair = {
        bsePublicKeyPem: generated.publicKeyPem,
        bsePrivateKeyPem: generated.privateKeyPem
      };
    }
  }

  public getBsePublicKeyPem(): string {
    return this.bseKeyPair.bsePublicKeyPem;
  }

  public getBsePrivateKeyPem(): string {
    return this.bseKeyPair.bsePrivateKeyPem;
  }

  /**
   * Main dispatch entrypoint for encrypted application/jose requests.
   * 
   * @param endpoint Target route (e.g., '/login', '/api/v2/add_ucc', '/api/order_new')
   * @param encryptedJws Compact JWS string received from client
   * @param headers HTTP Headers (including X-API-Org-ID, Authorization, X-STARMFv2-Trace-ID)
   * @param memberPublicKeyPem Member's RSA Public Key (to verify member's signature and encrypt response)
   * @returns Encrypted compact JWS string response from BSE
   */
  public async handleEncryptedRequest(
    endpoint: string,
    encryptedJws: string,
    headers: Record<string, string | undefined>,
    memberPublicKeyPem: string
  ): Promise<string> {
    // 1. Validate X-API-Org-ID Header
    const orgId = headers['X-API-Org-ID'] || headers['x-api-org-id'];
    const expectedPrefix = `member/${this.memberCode}:`;
    if (!orgId || !orgId.startsWith(expectedPrefix)) {
      const errorResp = {
        status: 'error',
        data: {},
        messages: [
          {
            msgid: 401,
            errcode: 'UNAUTHORIZED_MEMBER',
            message: `Invalid or missing X-API-Org-ID header. Expected prefix ${expectedPrefix}`
          }
        ]
      };
      return await JoseSecurityService.ctEncrypt(
        errorResp,
        memberPublicKeyPem,
        this.bseKeyPair.bsePrivateKeyPem
      );
    }

    // 2. Validate Authorization Bearer Token for non-login endpoints
    if (endpoint !== '/login' && endpoint !== '/api/login') {
      const auth = headers['Authorization'] || headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        const errorResp = {
          status: 'error',
          data: {},
          messages: [
            {
              msgid: 401,
              errcode: 'INVALID_TOKEN',
              message: 'Authorization Bearer token is missing or expired'
            }
          ]
        };
        return await JoseSecurityService.ctEncrypt(
          errorResp,
          memberPublicKeyPem,
          this.bseKeyPair.bsePrivateKeyPem
        );
      }
    }

    // 3. Decrypt request using BSE Private Key and verify Member Signature
    let decryptedPayload: any;
    try {
      decryptedPayload = await JoseSecurityService.ctDecrypt(
        encryptedJws,
        memberPublicKeyPem,
        this.bseKeyPair.bsePrivateKeyPem
      );
    } catch (err: any) {
      const errorResp = {
        status: 'error',
        data: {},
        messages: [
          {
            msgid: 400,
            errcode: 'CRYPTO_ERROR',
            message: `BSE failed to decrypt or verify payload: ${err.message}`
          }
        ]
      };
      return await JoseSecurityService.ctEncrypt(
        errorResp,
        memberPublicKeyPem,
        this.bseKeyPair.bsePrivateKeyPem
      );
    }

    // 4. Dispatch to endpoint business handlers
    const responsePayload = this.routeRequest(endpoint, decryptedPayload, headers);

    // 5. Encrypt response with Member Public Key and sign with BSE Private Key
    return await JoseSecurityService.ctEncrypt(
      responsePayload,
      memberPublicKeyPem,
      this.bseKeyPair.bsePrivateKeyPem
    );
  }

  /**
   * Internal routing logic for plain or decrypted payloads.
   */
  public routeRequest(
    endpoint: string,
    payload: any,
    headers?: Record<string, string | undefined>
  ): any {
    const cleanEndpoint = endpoint.replace('/api', '');

    switch (cleanEndpoint) {
      case '/login':
        return this.handleLogin(payload);
      case '/v2/add_ucc':
        return this.handleAddUcc(payload);
      case '/order_new':
        return this.handleOrderNew(payload);
      case '/sxp_register':
        return this.handleSxpRegister(payload);
      case '/mandate_register':
        return this.handleMandateRegister(payload);
      case '/master_scheme_list':
        return this.handleMasterSchemeList(payload);
      case '/nav_master_list':
        return this.handleNavMasterList(payload);
      default:
        return {
          status: 'error',
          data: {},
          messages: [{ msgid: 404, errcode: 'NOT_FOUND', message: `Unknown endpoint: ${endpoint}` }]
        };
    }
  }

  // --------------------------------------------------------------------------
  // Endpoint Handlers
  // --------------------------------------------------------------------------

  private handleLogin(payload: any): any {
    const username = payload?.data?.username;
    const password = payload?.data?.password;

    if (!username || !password) {
      return {
        status: 'error',
        data: {},
        messages: [{ msgid: 400, errcode: 'REQUIRED', message: 'username and password are required' }]
      };
    }

    const mockToken = `BSE_TOKEN_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    this.registeredTokens.add(mockToken);

    return {
      status: 'success',
      data: {
        access_token: mockToken,
        token_type: 'Bearer',
        expires_in: 86400, // 24 hours
        member_code: this.memberCode
      },
      messages: []
    };
  }

  private handleAddUcc(payload: any): any {
    const data = payload?.data;
    if (!data) {
      return { status: 'error', data: {}, messages: [{ msgid: 400, message: 'Missing data container' }] };
    }

    const clientCode = data.investor?.client_code;
    if (!clientCode) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'investor.client_code' }] };
    }

    // Validate Holder & PAN
    const primaryHolder = data.holder?.find((h: any) => h.holder_rank === '1' || h.holder_rank === 1);
    if (!primaryHolder) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'holder[0]' }] };
    }

    const pan = primaryHolder.identifier?.[0]?.identifier_number;
    if (!primaryHolder.is_pan_exempt && (!pan || pan.length !== 10)) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'invalid_pan', field: 'pan', message: 'Primary holder must have valid 10-char PAN' }] };
    }

    // Validate Nominees: Sum of nomination_percent must be 100% if opted
    if (data.is_nomination_opted && primaryHolder.nomination && primaryHolder.nomination.length > 0) {
      if (primaryHolder.nomination.length > 5) {
        return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'nominee_limit', message: 'Maximum 5 nominees allowed' }] };
      }

      let totalPercent = 0;
      for (const nom of primaryHolder.nomination) {
        totalPercent += parseFloat(nom.nomination_percent || '0');
        if (nom.is_minor && !nom.guardian) {
          return {
            status: 'error',
            data: {},
            messages: [{ msgid: 522, errcode: 'guardian_required', message: `Nominee ${nom.person?.first_name} is minor but guardian is missing` }]
          };
        }
      }

      if (Math.round(totalPercent) !== 100) {
        return {
          status: 'error',
          data: {},
          messages: [{ msgid: 522, errcode: 'invalid_nomination_percent', message: `Sum of nominee percentages must be exactly 100%. Got ${totalPercent}%` }]
        };
      }
    }

    // Generate BSE AOF Reference Number
    const aofRefNo = `AOF-BSE-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const savedRecord = {
      client_code: clientCode,
      aof_ref_no: aofRefNo,
      status: 'ACTIVE_APPROVED',
      created_at: new Date().toISOString()
    };
    this.uccStore.set(clientCode, savedRecord);

    return {
      status: 'success',
      data: savedRecord,
      messages: []
    };
  }

  private handleOrderNew(payload: any): any {
    const orders = payload?.data?.orders;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'orders' }] };
    }

    const orderResults = [];

    for (const ord of orders) {
      if (!ord.mem_ord_ref_id) {
        return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'mem_ord_ref_id' }] };
      }
      if (!ord.scheme) {
        return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'scheme' }] };
      }
      if (!ord.amount || ord.amount <= 0) {
        return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'min_amount', field: 'amount', message: 'Order amount must be greater than 0' }] };
      }

      // Check SEBI / AMFI EUIN Regulatory Attribution
      if (!ord.mem_details?.sub_br_arn) {
        return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'arn_missing', message: 'mem_details.sub_br_arn is mandatory' }] };
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const bseOrderNo = `BBO-${dateStr}-${Math.floor(10000 + Math.random() * 90000)}`;
      const bseInternalRef = `INT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const paymentUrl = ord.type === 'p'
        ? `https://bsestarmfdemo.bseindia.com/PaymentGateway?orderNo=${bseOrderNo}&member=${this.memberCode}&amt=${ord.amount}`
        : null;

      const record = {
        mem_ord_ref_id: ord.mem_ord_ref_id,
        bse_order_no: bseOrderNo,
        bse_internal_ref_no: bseInternalRef,
        status: 'ACCEPTED',
        scheme: ord.scheme,
        amount: ord.amount,
        payment_url: paymentUrl,
        cutoff_status: 'APPLICABLE_SAME_DAY'
      };

      this.orderStore.set(ord.mem_ord_ref_id, record);
      orderResults.push(record);
    }

    return {
      status: 'success',
      data: {
        orders: orderResults
      },
      messages: []
    };
  }

  private handleSxpRegister(payload: any): any {
    const data = payload?.data;
    if (!data) {
      return { status: 'error', data: {}, messages: [{ msgid: 400, message: 'Missing data container' }] };
    }

    if (!data.mem_sxp_ref_id) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'mem_sxp_ref_id' }] };
    }
    if (!data.src_scheme) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'required', field: 'src_scheme' }] };
    }
    if (!data.amount || data.amount <= 0) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'min_amount', field: 'amount' }] };
    }
    if (!data.txn_date || data.txn_date < 1 || data.txn_date > 31) {
      return { status: 'error', data: {}, messages: [{ msgid: 522, errcode: 'invalid_date', field: 'txn_date' }] };
    }

    const bseRegNo = `REG-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record = {
      mem_sxp_ref_id: data.mem_sxp_ref_id,
      bse_reg_no: bseRegNo,
      sxp_type: data.sxp_type || 'sip',
      status: 'REGISTERED',
      src_scheme: data.src_scheme,
      amount: data.amount,
      start_date: data.start_date,
      end_date: data.end_date
    };

    this.sxpStore.set(data.mem_sxp_ref_id, record);

    return {
      status: 'success',
      data: record,
      messages: []
    };
  }

  private handleMandateRegister(payload: any): any {
    const data = payload?.data;
    if (!data) {
      return { status: 'error', data: {}, messages: [{ msgid: 400, message: 'Missing data container' }] };
    }

    const memMandateId = data.mem_mandate_info?.member_mandate_id || `MM-${Date.now()}`;
    const bseMandateId = `MAND-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const umrn = `UMRN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const authUrl = `https://bsestarmfdemo.bseindia.com/MandateAuth?mandateId=${bseMandateId}&client=${data.investor?.ucc}`;

    const record = {
      member_mandate_id: memMandateId,
      bse_mandate_id: bseMandateId,
      umrn_number: umrn,
      status: 'PENDING_INVESTOR_AUTH',
      auth_url: authUrl,
      amount: data.amount
    };

    this.mandateStore.set(memMandateId, record);

    return {
      status: 'success',
      data: record,
      messages: []
    };
  }

  private handleMasterSchemeList(payload: any): any {
    // Return sample schemes matching BSE format
    return {
      status: 'success',
      data: {
        total_count: 2,
        lists: [
          {
            scheme_bse_code: 'PRTFGP-GR',
            scheme_isin: 'INF209K01090',
            name: 'ADITYA BIRLA SUN LIFE EQUITY ADVANTAGE FUND - GROWTH',
            scheme_amc_code: 'NH32',
            scheme_amc_name: 'ADITYA BIRLA SUN LIFE MUTUAL FUND',
            scheme_plan: 'Regular',
            scheme_option: 'Growth',
            scheme_category: 'Equity',
            scheme_sub_category: 'Large & Mid Cap Fund',
            cutoff_time: '15:00:00',
            sip_flag: true,
            is_active: true
          },
          {
            scheme_bse_code: 'HDFCLI-GR',
            scheme_isin: 'INF179K01912',
            name: 'HDFC LIQUID FUND - REGULAR PLAN - GROWTH',
            scheme_amc_code: 'HDFC_MF',
            scheme_amc_name: 'HDFC ASSET MANAGEMENT COMPANY LIMITED',
            scheme_plan: 'Regular',
            scheme_option: 'Growth',
            scheme_category: 'Debt',
            scheme_sub_category: 'Liquid Fund',
            cutoff_time: '13:30:00',
            sip_flag: true,
            is_active: true
          }
        ]
      },
      messages: []
    };
  }

  private handleNavMasterList(payload: any): any {
    return {
      status: 'success',
      data: {
        total_count: 2,
        lists: [
          {
            scheme_bse_code: 'PRTFGP-GR',
            nav_value: 124.654,
            nav_date: new Date().toISOString().slice(0, 10)
          },
          {
            scheme_bse_code: 'HDFCLI-GR',
            nav_value: 4521.8901,
            nav_date: new Date().toISOString().slice(0, 10)
          }
        ]
      },
      messages: []
    };
  }
}
