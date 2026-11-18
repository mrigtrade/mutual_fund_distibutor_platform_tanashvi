/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Frontend Client for Live BSE StAR MF v2.0 UAT Data via Zero-Domain Vercel Proxy (/api/bse-uat)
 *
 * Keeps all credentials strictly on Oracle Cloud (130.210.57.235) and provides
 * graceful offline/sandbox fallback if BSE UAT or the bridge is unreachable.
 */

import { Scheme } from '../types/bse';

export interface LiveBseStatus {
  connected: boolean;
  authenticated: boolean;
  memberId: string;
  orgType: string;
  expiresInSec: number;
  roles: string[];
  gateway: string;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

export interface LiveBseSchemeRecord {
  bseCode: string;
  isin: string;
  name: string;
  parentSchemeName: string;
  amcName: string;
  amcCode: string;
  rtaName: string;
  rtaCode: string;
  plan: string;
  option: string;
  category: string;
  subCategory: string;
  offerStatus: string;
  offerType: string;
  settlementDays: string;
  modesAllowed: string[];
  minLumpsum: number;
  minAdditional: number;
  minSip: number;
  sipFrequencies: string[];
  cutoffTime: string;
  isSipAllowed: boolean;
  isRedemptionAllowed: boolean;
  isSwitchAllowed: boolean;
  isActive: boolean;
}

export interface LiveBseSchemesResponse {
  live: boolean;
  totalCount: number;
  schemes: LiveBseSchemeRecord[];
  latencyMs: number;
  error?: string;
}

export interface LiveBseNavRecord {
  navDate: string;
  bseSchemeCode: string;
  rtaSchemeCode: string;
  isin: string;
  schemeName: string;
  nav: number;
}

export interface LiveBseNavResponse {
  live: boolean;
  totalCount: number;
  records: LiveBseNavRecord[];
  latencyMs: number;
  error?: string;
}

export interface LiveBseUccListResponse {
  live: boolean;
  count: number;
  lists: any[];
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

const PROXY_ENDPOINT = '/api/bse-uat';

function parseLiveSchemeRecord(raw: any): LiveBseSchemeRecord {
  const modesAllowed: string[] = Array.isArray(raw?.scheme_transaction_mode_allowed)
    ? raw.scheme_transaction_mode_allowed
        .map((m: any) => m?.scheme_transaction_mode_demat_physical_allowed)
        .filter(Boolean)
    : [];

  const lumpsumArr: any[] = Array.isArray(raw?.lumpsum) ? raw.lumpsum : [];
  const purchaseRule =
    lumpsumArr.find((x) => /purchase/i.test(String(x?.scheme_transaction_type || ''))) ||
    lumpsumArr[0];
  const minLumpsum =
    Number(purchaseRule?.scheme_transaction_single_details?.scheme_transaction_amt?.scheme_transaction_min_amt) ||
    1000;
  const minAdditional =
    Number(purchaseRule?.scheme_transaction_single_details?.scheme_transaction_amt?.scheme_transaction_min_adtnl_amt) ||
    minLumpsum;
  const cutoffTime =
    String(purchaseRule?.scheme_transaction_cutoff_time || '15:00:00').slice(0, 5) + ' IST';

  const sxpArr: any[] = Array.isArray(raw?.sxp)
    ? raw.sxp
    : Array.isArray(raw?.systematic)
    ? raw.systematic
    : [];
  const sipEntries = sxpArr.filter(
    (s) => s?.sip_flag === true || String(s?.scheme_transaction_type || '').toUpperCase() === 'SIP'
  );
  const sipFrequencies = Array.from(
    new Set(sipEntries.map((s) => String(s?.scheme_sxp_frequency || '')).filter(Boolean))
  );
  const monthlySip =
    sipEntries.find((s) => /monthly/i.test(String(s?.scheme_sxp_frequency || ''))) || sipEntries[0];
  const minSip =
    Number(
      monthlySip?.systematic_transaction_detail?.[0]?.scheme_transaction_amt?.scheme_transaction_min_amt
    ) || 500;

  const isRedemptionAllowed = lumpsumArr.some((x) =>
    /redemption/i.test(String(x?.scheme_transaction_type || ''))
  );
  const isSwitchAllowed = lumpsumArr.some((x) =>
    /switch/i.test(String(x?.scheme_transaction_type || ''))
  );

  const settlementRaw = String(raw?.scheme_redemption_settlement_days || 'T2');
  const settlementDays = /^T\d+$/i.test(settlementRaw)
    ? `T+${settlementRaw.slice(1)}`
    : settlementRaw || 'T+2';

  return {
    bseCode: String(raw?.scheme_bse_code || raw?.parent_scheme_code || 'N/A'),
    isin: String(raw?.scheme_isin || 'N/A'),
    name: String(raw?.name || raw?.parent_scheme_name || 'Unnamed Scheme'),
    parentSchemeName: String(raw?.parent_scheme_name || raw?.name || ''),
    amcName: String(raw?.scheme_amc_name || 'Unknown AMC'),
    amcCode: String(raw?.scheme_amc_code || ''),
    rtaName: String(raw?.scheme_rta_name || 'CAMS'),
    rtaCode: String(raw?.scheme_rta_code || ''),
    plan: String(raw?.scheme_plan || 'Regular'),
    option: String(raw?.scheme_option || 'Growth'),
    category: String(raw?.scheme_category || 'Mutual Fund'),
    subCategory: String(raw?.scheme_sub_category || raw?.scheme_category || 'General'),
    offerStatus: String(raw?.scheme_offer_status || 'OPEN'),
    offerType: String(raw?.scheme_offer_type || 'Open Ended'),
    settlementDays,
    modesAllowed: modesAllowed.length > 0 ? modesAllowed : ['Physical', 'Demat'],
    minLumpsum,
    minAdditional,
    minSip,
    sipFrequencies: sipFrequencies.length > 0 ? sipFrequencies : ['Monthly'],
    cutoffTime,
    isSipAllowed: sipEntries.length > 0 || true,
    isRedemptionAllowed,
    isSwitchAllowed,
    isActive: raw?.is_active !== false
  };
}

/**
 * Converts a Live BSE StAR MF v2.0 scheme into the Order Terminal's `Scheme` format
 * so MFDs/partners can immediately click "Buy Lumpsum" or "Start XSIP" on any of the 28,128 live schemes.
 */
export function liveBseSchemeToAppScheme(rec: LiveBseSchemeRecord, liveNav?: number, navDate?: string): Scheme {
  const catLower = `${rec.category} ${rec.subCategory}`.toLowerCase();
  let mappedCat: Scheme['category'] = 'Equity: Flexi Cap';
  if (catLower.includes('large')) mappedCat = 'Equity: Large Cap';
  else if (catLower.includes('mid')) mappedCat = 'Equity: Mid Cap';
  else if (catLower.includes('small')) mappedCat = 'Equity: Small Cap';
  else if (catLower.includes('liquid') || catLower.includes('overnight') || catLower.includes('money')) mappedCat = 'Debt: Liquid';
  else if (catLower.includes('debt') || catLower.includes('bond') || catLower.includes('gilt') || catLower.includes('duration')) mappedCat = 'Debt: Corporate Bond';
  else if (catLower.includes('index') || catLower.includes('etf') || catLower.includes('nifty') || catLower.includes('sensex')) mappedCat = 'Index / ETF';
  else if (catLower.includes('hybrid') || catLower.includes('balanced') || catLower.includes('arbitrage')) mappedCat = 'Hybrid: Aggressive';

  const riskLevel: Scheme['riskLevel'] =
    mappedCat === 'Debt: Liquid' ? 'Low' :
    mappedCat.startsWith('Debt') ? 'Moderate' :
    mappedCat === 'Hybrid: Aggressive' ? 'High' : 'Very High';

  const settlementCycle: Scheme['settlementCycle'] =
    rec.settlementDays === 'T+1' ? 'T+1' : 'T+2';

  return {
    schemeCode: rec.bseCode,
    isin: rec.isin,
    schemeName: rec.name,
    amc: rec.amcName,
    category: mappedCat,
    nav: liveNav && liveNav > 0 ? liveNav : 10,
    navDate: navDate || 'BSE UAT Live',
    oneYearReturn: 0,
    threeYearReturn: 0,
    fiveYearReturn: 0,
    minLumpsum: rec.minLumpsum,
    minSip: rec.minSip,
    cutoffTime: rec.cutoffTime,
    settlementCycle,
    expenseRatio: rec.plan.toLowerCase().includes('direct') ? 0.65 : 1.45,
    riskLevel,
    isSipAllowed: rec.isSipAllowed,
    isSwitchAllowed: rec.isSwitchAllowed,
    isRedemptionAllowed: rec.isRedemptionAllowed
  };
}

export async function fetchLiveBseStatus(): Promise<LiveBseStatus> {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${PROXY_ENDPOINT}?action=status`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const json = await res.json();
    const latencyMs = Date.now() - startedAt;

    if (res.ok && json?.success && json?.data?.authenticated) {
      const roles = Array.isArray(json.data.roles) && json.data.roles.length > 0
        ? json.data.roles
        : ['ucc_maker', 'eadmin', 'admin'];

      return {
        connected: true,
        authenticated: true,
        memberId: String(json.data.orgId || '94515'),
        orgType: String(json.data.orgType || 'MEMBER'),
        expiresInSec: Number(json.data.expiresInSec || 1800),
        roles,
        gateway: String(json.data.gateway || 'https://starmfv2demo.bseindia.com/api'),
        latencyMs,
        checkedAt: json.timestamp || new Date().toISOString()
      };
    }

    return {
      connected: false,
      authenticated: false,
      memberId: '94515',
      orgType: 'MEMBER',
      expiresInSec: 0,
      roles: [],
      gateway: 'https://starmfv2demo.bseindia.com/api',
      latencyMs,
      checkedAt: new Date().toISOString(),
      error: json?.error?.message || `HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      connected: false,
      authenticated: false,
      memberId: '94515',
      orgType: 'MEMBER',
      expiresInSec: 0,
      roles: [],
      gateway: 'https://starmfv2demo.bseindia.com/api',
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: err?.message || 'Proxy unreachable (running in Sandbox fallback)'
    };
  }
}

export async function fetchLiveBseSchemes(params?: {
  search?: string;
  amc?: string;
  plan?: string;
  option?: string;
  length?: number;
}): Promise<LiveBseSchemesResponse> {
  const startedAt = Date.now();
  const qs = new URLSearchParams({ action: 'schemes' });
  if (params?.search) qs.set('search', params.search);
  if (params?.amc) qs.set('amc', params.amc);
  if (params?.plan) qs.set('plan', params.plan);
  if (params?.option) qs.set('option', params.option);
  qs.set('length', String(params?.length || 20));

  try {
    const res = await fetch(`${PROXY_ENDPOINT}?${qs.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    const json = await res.json();
    const latencyMs = Date.now() - startedAt;

    if (res.ok && json?.success && json?.data) {
      const rawList = Array.isArray(json.data.lists) ? json.data.lists : [];
      return {
        live: true,
        totalCount: Number(json.data.count || rawList.length),
        schemes: rawList.map(parseLiveSchemeRecord),
        latencyMs
      };
    }

    return {
      live: false,
      totalCount: 0,
      schemes: [],
      latencyMs,
      error: json?.error?.message || `BSE Scheme Master returned HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      live: false,
      totalCount: 0,
      schemes: [],
      latencyMs: Date.now() - startedAt,
      error: err?.message || 'Unable to reach Live BSE Scheme Master'
    };
  }
}

export async function fetchLiveBseNavs(params?: {
  bseSchemeCode?: string;
  navDate?: string;
  length?: number;
}): Promise<LiveBseNavResponse> {
  const startedAt = Date.now();
  const qs = new URLSearchParams({ action: 'nav' });
  if (params?.bseSchemeCode) qs.set('bseSchemeCode', params.bseSchemeCode.trim());
  if (params?.navDate) qs.set('navDate', params.navDate.trim());
  qs.set('length', String(params?.length || 25));

  try {
    const res = await fetch(`${PROXY_ENDPOINT}?${qs.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    const json = await res.json();
    const latencyMs = Date.now() - startedAt;

    if (res.ok && json?.success && json?.data) {
      const rawList = Array.isArray(json.data.lists) ? json.data.lists : [];
      const records: LiveBseNavRecord[] = rawList.map((r: any) => ({
        navDate: String(r?.nav_date || 'N/A'),
        bseSchemeCode: String(r?.bse_scheme_code || 'N/A'),
        rtaSchemeCode: String(r?.rta_scheme_code || ''),
        isin: String(r?.isin || 'N/A'),
        schemeName: String(r?.scheme_name || 'Unnamed Scheme'),
        nav: Number(r?.nav || 0)
      }));
      return {
        live: true,
        totalCount: Number(json.data.count || records.length),
        records,
        latencyMs
      };
    }

    return {
      live: false,
      totalCount: 0,
      records: [],
      latencyMs,
      error: json?.error?.message || `BSE NAV Master returned HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      live: false,
      totalCount: 0,
      records: [],
      latencyMs: Date.now() - startedAt,
      error: err?.message || 'Unable to reach Live BSE NAV Master'
    };
  }
}

export async function fetchLiveBseUccList(status?: string): Promise<LiveBseUccListResponse> {
  const startedAt = Date.now();
  const qs = new URLSearchParams({ action: 'ucc_list' });
  if (status) qs.set('status', status);

  try {
    const res = await fetch(`${PROXY_ENDPOINT}?${qs.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const json = await res.json();
    const latencyMs = Date.now() - startedAt;

    if (res.ok && json?.success && json?.data) {
      return {
        live: true,
        count: Number(json.data.count || 0),
        lists: Array.isArray(json.data.lists) ? json.data.lists : [],
        latencyMs,
        checkedAt: new Date().toISOString()
      };
    }

    return {
      live: false,
      count: 0,
      lists: [],
      latencyMs,
      checkedAt: new Date().toISOString(),
      error: json?.error?.message || `BSE UCC List returned HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      live: false,
      count: 0,
      lists: [],
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: err?.message || 'Unable to reach Live BSE UCC Registry'
    };
  }
}
