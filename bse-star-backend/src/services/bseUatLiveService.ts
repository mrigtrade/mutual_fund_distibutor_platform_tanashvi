/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Live BSE StAR MF v2.0 UAT Demo Bridge Service
 *
 * Uses official BSE StAR MF v2.0 Postman Collection REST JSON + RS256 Bearer JWT auth
 * against https://starmfv2demo.bseindia.com/api from Static Whitelisted IP 130.210.57.235.
 * Automatically caches and refreshes the 30-minute Keycloak JWT token.
 */

export class BseUatLiveService {
  private static instance: BseUatLiveService;

  private baseUrl: string;
  private memberId: string;
  private username: string;
  private password: string;
  private cachedToken: string | null = null;
  private tokenExpiresAtMs = 0;

  private constructor() {
    this.baseUrl = (process.env.BSE_GATEWAY_URL || 'https://starmfv2demo.bseindia.com/api').replace(/\/$/, '');
    this.memberId = process.env.BSE_MEMBER_CODE || '94515';
    const rawUser = process.env.BSE_USERNAME || 'tanashvifintechpvtltd';
    this.username = rawUser.startsWith('member/') ? rawUser : `member/${this.memberId}/${rawUser}`;
    this.password = process.env.BSE_PASSWORD || '94515@Xyz';
  }

  public static getInstance(): BseUatLiveService {
    if (!BseUatLiveService.instance) {
      BseUatLiveService.instance = new BseUatLiveService();
    }
    return BseUatLiveService.instance;
  }

  public async getAccessToken(forceRefresh = false): Promise<{ token: string; expiresInSec: number; claims?: any }> {
    const now = Date.now();
    if (!forceRefresh && this.cachedToken && this.tokenExpiresAtMs > now + 120_000) {
      return {
        token: this.cachedToken,
        expiresInSec: Math.round((this.tokenExpiresAtMs - now) / 1000)
      };
    }

    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        data: {
          username: this.username,
          password: this.password
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    const json: any = await res.json();
    if (!res.ok || !json?.data?.access_token) {
      throw new Error(`BSE UAT Login failed (HTTP ${res.status}): ${JSON.stringify(json)}`);
    }

    const token: string = json.data.access_token;
    let expiresInSec = 1500;
    let claims: any = undefined;
    try {
      claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      if (claims?.exp && claims?.iat) {
        expiresInSec = Math.max(300, claims.exp - claims.iat);
      }
    } catch {
      // Default 25-minute cache window
    }

    this.cachedToken = token;
    this.tokenExpiresAtMs = now + expiresInSec * 1000;
    return { token, expiresInSec, claims };
  }

  public async postAuthenticated(endpoint: string, body: any): Promise<{ status: number; data: any }> {
    const { token } = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
    const text = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    return { status: res.status, data: parsed };
  }

  public async fetchLiveSchemes(params?: { search?: string; amc?: string; plan?: string; option?: string; length?: number }) {
    return this.postAuthenticated('/master_scheme_list', {
      data: {
        fields: ['ALL'],
        count_only: false,
        start: 0,
        length: params?.length || 20,
        filter_param: {
          scheme_amc_name: params?.amc || '',
          scheme_category: '',
          scheme_sub_category: '',
          investment_mode: '',
          scheme_option: params?.option || '',
          scheme_plan: params?.plan || '',
          scheme_isin: '',
          settlement_days: '',
          transaction_allowed: ''
        },
        search: { value: params?.search || '' }
      }
    });
  }

  public async fetchLiveNavs(params?: { length?: number; bseSchemeCode?: string; navDate?: string }) {
    const filterParam: Record<string, string> = {};
    if (params?.bseSchemeCode) filterParam.bse_scheme_code = params.bseSchemeCode;
    if (params?.navDate) filterParam.nav_date = params.navDate;
    return this.postAuthenticated('/nav_master_list', {
      data: {
        fields: ['ALL'],
        count_only: false,
        start: 0,
        length: params?.length || 20,
        filter_param: filterParam
      }
    });
  }

  public async listLiveUccs(uccStatus?: string) {
    const data: any = {
      count_only: false,
      start: 0,
      length: 50,
      fields: ['ALL'],
      member: {},
      investor: {},
      filter_param: {}
    };
    if (uccStatus) data.ucc_status = uccStatus;
    return this.postAuthenticated('/v2/list_ucc', { data });
  }
}
