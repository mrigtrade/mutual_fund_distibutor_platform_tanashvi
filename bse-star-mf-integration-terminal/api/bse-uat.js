/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Zero-Domain Vercel Serverless Proxy for Live BSE StAR MF v2.0 UAT
 *
 * Bridges HTTPS browser traffic on *.vercel.app to the Oracle Cloud Static-IP
 * backend (http://130.210.57.235:3000) without touching tanashvi.in DNS.
 *
 * Strict action allowlist (read-only / live UAT verification endpoints):
 *   - GET /api/bse-uat?action=status
 *   - GET /api/bse-uat?action=schemes&search=...&amc=...&plan=...&option=...&length=...
 *   - GET /api/bse-uat?action=nav&length=...&bseSchemeCode=...&navDate=...
 *   - GET /api/bse-uat?action=ucc_list&status=...
 *   - GET /api/bse-uat?action=benchmarks
 */

const BACKEND_BASE = (
  process.env.TANASHVI_BACKEND_URL || 'http://130.210.57.235:3000'
).replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 18000;

function pickQueryString(query, key) {
  const val = query?.[key];
  if (Array.isArray(val)) return String(val[0] || '').trim();
  return typeof val === 'string' ? val.trim() : '';
}

export default async function handler(req, res) {
  // CORS headers for preview/branch deployments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { message: 'Only GET requests are permitted on /api/bse-uat.' }
    });
  }

  const action = pickQueryString(req.query, 'action') || 'status';
  let targetUrl = '';
  let cacheHeader = 'no-store';

  switch (action) {
    case 'status': {
      targetUrl = `${BACKEND_BASE}/api/v1/bse-uat/status`;
      cacheHeader = 'no-store';
      break;
    }

    case 'schemes': {
      const params = new URLSearchParams();
      const search = pickQueryString(req.query, 'search');
      const amc = pickQueryString(req.query, 'amc');
      const plan = pickQueryString(req.query, 'plan');
      const option = pickQueryString(req.query, 'option');
      const rawLength = parseInt(pickQueryString(req.query, 'length') || '20', 10);
      const length = Number.isFinite(rawLength) ? Math.min(50, Math.max(1, rawLength)) : 20;

      if (search) params.set('search', search);
      if (amc) params.set('amc', amc);
      if (plan) params.set('plan', plan);
      if (option) params.set('option', option);
      params.set('length', String(length));

      targetUrl = `${BACKEND_BASE}/api/v1/bse-uat/schemes?${params.toString()}`;
      cacheHeader = 's-maxage=30, stale-while-revalidate=60';
      break;
    }

    case 'nav': {
      const params = new URLSearchParams();
      const bseSchemeCode = pickQueryString(req.query, 'bseSchemeCode');
      const navDate = pickQueryString(req.query, 'navDate');
      const rawLength = parseInt(pickQueryString(req.query, 'length') || '25', 10);
      const length = Number.isFinite(rawLength) ? Math.min(100, Math.max(1, rawLength)) : 25;

      if (bseSchemeCode) params.set('bseSchemeCode', bseSchemeCode);
      if (navDate) params.set('navDate', navDate);
      params.set('length', String(length));

      targetUrl = `${BACKEND_BASE}/api/v1/bse-uat/nav?${params.toString()}`;
      cacheHeader = 's-maxage=30, stale-while-revalidate=60';
      break;
    }

    case 'ucc_list': {
      const params = new URLSearchParams();
      const status = pickQueryString(req.query, 'status');
      if (status) params.set('status', status);
      const qs = params.toString();
      targetUrl = `${BACKEND_BASE}/api/v1/bse-uat/ucc/list${qs ? `?${qs}` : ''}`;
      cacheHeader = 'no-store';
      break;
    }

    case 'benchmarks': {
      targetUrl = `${BACKEND_BASE}/api/v1/benchmarks`;
      cacheHeader = 's-maxage=60, stale-while-revalidate=120';
      break;
    }

    default: {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported action "${action}". Allowed: status, schemes, nav, ucc_list, benchmarks.`
        }
      });
    }
  }

  const startedAt = Date.now();
  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Forwarded-By': 'tanashvi-vercel-proxy'
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {
        success: false,
        error: { message: 'Non-JSON response from Oracle Cloud backend', rawPreview: text.slice(0, 200) }
      };
    }

    res.setHeader('Cache-Control', cacheHeader);
    res.setHeader('X-Tanashvi-Proxy-Latency-Ms', String(Date.now() - startedAt));
    return res.status(upstream.status).json(payload);
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      success: false,
      proxyError: true,
      latencyMs: Date.now() - startedAt,
      error: {
        message: err?.name === 'TimeoutError'
          ? 'BSE UAT upstream timed out via Oracle Cloud bridge'
          : (err?.message || 'Unable to reach Oracle Cloud BSE UAT bridge')
      }
    });
  }
}
