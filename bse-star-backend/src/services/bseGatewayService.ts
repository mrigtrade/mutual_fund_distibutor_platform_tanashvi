/**
 * Tanashvi Fintech B2B Mutual Fund Platform
 * BSE StAR MF v2 Gateway Integration Service
 * 
 * Enshrines the Core Mandate:
 * Zero Live Dependency (Offline/Mock-First): Since BSE requires static IP whitelisting
 * before any inbound connection to their gateway is permitted, the entire platform
 * runs self-contained locally against simulated BSE responses by default, while
 * providing a seamless hot-toggle to live BSE HTTPS endpoints once whitelisted.
 */

import { JoseSecurityService } from '../security/jose.js';
import { BseHeaderService } from '../security/bseHeaders.js';
import { IBseTransport, BseSimulatorTransport, BseHttpLiveTransport } from '../transport/bseTransport.js';
import { UccRequestBuilder } from '../builders/uccRequestBuilder.js';
import { OrderRequestBuilder } from '../builders/orderRequestBuilder.js';
import { SxpRequestBuilder } from '../builders/sxpRequestBuilder.js';
import { MandateRequestBuilder } from '../builders/mandateRequestBuilder.js';
import { CutoffReconciliationService, CutoffCheckResult } from './cutoffReconciliation.js';
import { UccInvestorProfile, UccBankAccount } from '../types/ucc.js';
import { MutualFundOrder, SystematicRegistration, MandateRegistration } from '../types/order.js';
import { TenantContext, DEFAULT_TANASHVI_TENANT } from '../types/tenant.js';

export interface BseServiceConfig {
  gatewayMode: 'MOCK' | 'LIVE';
  liveBaseUrl?: string;
  memberCode: string;
  fingerprint: string;
  memberPublicKeyPem?: string;
  memberPrivateKeyPem?: string;
  bsePublicKeyPem?: string;
  bsePrivateKeyPem?: string; // Only needed if running simulator
}

export class BseGatewayService {
  private static instance: BseGatewayService;

  private transport: IBseTransport;
  private config: BseServiceConfig;
  private memberKeys: { publicKeyPem: string; privateKeyPem: string };
  private bseKeys: { publicKeyPem: string; privateKeyPem?: string };
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<BseServiceConfig>) {
    const mode = (config?.gatewayMode || process.env.BSE_GATEWAY_MODE || 'MOCK').toUpperCase() as 'MOCK' | 'LIVE';
    const memberCode = config?.memberCode || process.env.BSE_MEMBER_CODE || '714114';
    const fingerprint = config?.fingerprint || process.env.BSE_MEMBER_FINGERPRINT || 'BSE_FINGERPRINT_3A89C0';

    this.config = {
      gatewayMode: mode,
      liveBaseUrl: config?.liveBaseUrl || process.env.BSE_GATEWAY_URL || 'https://v2.bsestarmf.in/api',
      memberCode,
      fingerprint,
      memberPublicKeyPem: config?.memberPublicKeyPem || process.env.BSE_MEMBER_PUBLIC_KEY,
      memberPrivateKeyPem: config?.memberPrivateKeyPem || process.env.BSE_MEMBER_PRIVATE_KEY,
      bsePublicKeyPem: config?.bsePublicKeyPem || process.env.BSE_PUBLIC_KEY,
      bsePrivateKeyPem: config?.bsePrivateKeyPem || process.env.BSE_SIMULATOR_PRIVATE_KEY
    };

    // Setup cryptographic keys
    if (this.config.memberPublicKeyPem && this.config.memberPrivateKeyPem) {
      this.memberKeys = {
        publicKeyPem: this.config.memberPublicKeyPem,
        privateKeyPem: this.config.memberPrivateKeyPem
      };
    } else {
      // In offline/mock mode, automatically generate ephemeral keypair if not configured
      const generated = JoseSecurityService.generateKeyPair();
      this.memberKeys = {
        publicKeyPem: generated.publicKeyPem,
        privateKeyPem: generated.privateKeyPem
      };
    }

    if (this.config.bsePublicKeyPem) {
      this.bseKeys = {
        publicKeyPem: this.config.bsePublicKeyPem,
        privateKeyPem: this.config.bsePrivateKeyPem
      };
    } else {
      const generatedBse = JoseSecurityService.generateKeyPair();
      this.bseKeys = {
        publicKeyPem: generatedBse.publicKeyPem,
        privateKeyPem: generatedBse.privateKeyPem
      };
    }

    // Initialize Transport
    if (this.config.gatewayMode === 'LIVE') {
      this.transport = new BseHttpLiveTransport(this.config.liveBaseUrl);
    } else {
      this.transport = new BseSimulatorTransport({
        memberCode: this.config.memberCode,
        fingerprint: this.config.fingerprint,
        memberPublicKeyPem: this.memberKeys.publicKeyPem,
        bseKeys: {
          bsePublicKeyPem: this.bseKeys.publicKeyPem,
          bsePrivateKeyPem: this.bseKeys.privateKeyPem || this.bseKeys.publicKeyPem
        }
      });
    }
  }

  public static getInstance(config?: Partial<BseServiceConfig>): BseGatewayService {
    if (!BseGatewayService.instance) {
      BseGatewayService.instance = new BseGatewayService(config);
    }
    return BseGatewayService.instance;
  }

  public getGatewayMode(): 'MOCK' | 'LIVE' {
    return this.transport.getMode();
  }

  public getMemberCode(): string {
    return this.config.memberCode;
  }

  public getFingerprint(): string {
    return this.config.fingerprint;
  }

  /**
   * Authenticate with BSE StAR MF v2 (/login)
   */
  public async login(
    username?: string,
    password?: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.tokenExpiry > now + 300) {
      return { accessToken: this.cachedToken, expiresIn: this.tokenExpiry - now };
    }

    const loginUser = username || `member/${this.config.memberCode}/tanashvi.admin`;
    const loginPass = password || 'Tanashvi@2026#Prod';

    const loginPayload = {
      data: {
        username: loginUser,
        password: loginPass
      }
    };

    const headers = BseHeaderService.buildHeaders({
      memberCode: this.config.memberCode,
      fingerprint: this.config.fingerprint
    });

    const encryptedToken = await JoseSecurityService.ctEncrypt(
      loginPayload,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    const responseToken = await this.transport.sendEncryptedRequest('/login', encryptedToken, headers);
    const decryptedResp = await JoseSecurityService.ctDecrypt(
      responseToken,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    if (decryptedResp.status === 200 || decryptedResp.status === 'success' || decryptedResp.data?.access_token) {
      this.cachedToken = decryptedResp.data.access_token;
      this.tokenExpiry = now + (decryptedResp.data.expires_in || 86400);
      return { accessToken: this.cachedToken!, expiresIn: this.tokenExpiry - now };
    } else {
      throw new Error(`BSE Login Failed: ${JSON.stringify(decryptedResp.messages || decryptedResp)}`);
    }
  }

  private async getValidAuthToken(): Promise<string> {
    const auth = await this.login();
    return auth.accessToken;
  }

  /**
   * Register Unique Client Code (UCC) with up to 5 Nominees & FATCA
   */
  public async registerUcc(
    profile: UccInvestorProfile,
    tenantContext?: TenantContext
  ): Promise<any> {
    const accessToken = await this.getValidAuthToken();
    const headers = BseHeaderService.buildHeaders({
      memberCode: this.config.memberCode,
      fingerprint: this.config.fingerprint,
      accessToken
    });

    // Validate 100% nominee allocation
    if (profile.nominees && profile.nominees.length > 0) {
      const sum = profile.nominees.reduce((acc, n) => acc + (n.nominationPercent || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        throw new Error(`Nominee allocations must sum to exactly 100%. Currently: ${sum}%`);
      }
    }

    const payload = UccRequestBuilder.buildAddUccRequest(profile, this.config.memberCode);
    const encryptedToken = await JoseSecurityService.ctEncrypt(
      payload,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    const responseToken = await this.transport.sendEncryptedRequest(
      '/api/v2/add_ucc',
      encryptedToken,
      headers
    );

    return await JoseSecurityService.ctDecrypt(
      responseToken,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );
  }

  /**
   * Register Bank Mandate (eNACH, UPI AutoPay, etc.)
   */
  public async registerMandate(
    mandate: MandateRegistration,
    bankAccount?: UccBankAccount,
    tenantContext?: TenantContext
  ): Promise<any> {
    const accessToken = await this.getValidAuthToken();
    const headers = BseHeaderService.buildHeaders({
      memberCode: this.config.memberCode,
      fingerprint: this.config.fingerprint,
      accessToken
    });

    const effectiveBankAccount: UccBankAccount = bankAccount || {
      accountNumber: '123456789012',
      ifscCode: 'HDFC0000060',
      bankName: 'HDFC Bank',
      accountType: 'SB',
      accountOwner: 'SELF',
      isDefault: true
    };

    const payload = MandateRequestBuilder.buildMandateRegisterRequest(
      mandate,
      effectiveBankAccount,
      undefined,
      this.config.memberCode
    );
    const encryptedToken = await JoseSecurityService.ctEncrypt(
      payload,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    const responseToken = await this.transport.sendEncryptedRequest(
      '/api/mandate_register',
      encryptedToken,
      headers
    );

    return await JoseSecurityService.ctDecrypt(
      responseToken,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );
  }

  /**
   * Register Systematic Transaction Plan (SIP, XSIP, STP, SWP)
   */
  public async registerSxp(
    sxp: SystematicRegistration,
    tenantContext?: TenantContext
  ): Promise<any> {
    const accessToken = await this.getValidAuthToken();
    const headers = BseHeaderService.buildHeaders({
      memberCode: this.config.memberCode,
      fingerprint: this.config.fingerprint,
      accessToken
    });

    const tenant = tenantContext || DEFAULT_TANASHVI_TENANT;
    sxp.regulatory = {
      subBrArn: tenant.subBrokerArn || (tenant.isPlatformOwner ? undefined : tenant.arnNumber) || tenant.arnNumber,
      subBrCode: tenant.subBrokerCode,
      euin: tenant.euin || 'E123456',
      euinFlag: tenant.euinFlag
    };

    const payload = SxpRequestBuilder.buildSxpRegisterRequest(
      sxp,
      sxp.mandateId,
      undefined,
      this.config.memberCode
    );
    const encryptedToken = await JoseSecurityService.ctEncrypt(
      payload,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    const responseToken = await this.transport.sendEncryptedRequest(
      '/api/sxp_register',
      encryptedToken,
      headers
    );

    return await JoseSecurityService.ctDecrypt(
      responseToken,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );
  }

  /**
   * Place Fresh / Additional Mutual Fund Order with Cut-off Analysis & ARN/EUIN Routing
   */
  public async createOrder(
    order: MutualFundOrder,
    tenantContext?: TenantContext,
    schemeCategory: string = 'Equity'
  ): Promise<{ bseResponse: any; cutoffEvaluation: CutoffCheckResult }> {
    const accessToken = await this.getValidAuthToken();
    const headers = BseHeaderService.buildHeaders({
      memberCode: this.config.memberCode,
      fingerprint: this.config.fingerprint,
      accessToken
    });

    // Evaluate SEBI Cut-Off in IST
    const cutoffEvaluation = CutoffReconciliationService.evaluateNavCutoff(
      schemeCategory,
      new Date()
    );

    const tenant = tenantContext || DEFAULT_TANASHVI_TENANT;
    order.regulatory = {
      subBrArn: tenant.subBrokerArn || (tenant.isPlatformOwner ? undefined : tenant.arnNumber) || tenant.arnNumber,
      subBrCode: tenant.subBrokerCode,
      euin: tenant.euin || 'E123456',
      euinFlag: tenant.euinFlag
    };

    const payload = OrderRequestBuilder.buildOrderNewRequest(order, undefined, this.config.memberCode);
    const encryptedToken = await JoseSecurityService.ctEncrypt(
      payload,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    const responseToken = await this.transport.sendEncryptedRequest(
      '/api/order_new',
      encryptedToken,
      headers
    );

    const bseResponse = await JoseSecurityService.ctDecrypt(
      responseToken,
      this.bseKeys.publicKeyPem,
      this.memberKeys.privateKeyPem
    );

    return {
      bseResponse,
      cutoffEvaluation
    };
  }
}
