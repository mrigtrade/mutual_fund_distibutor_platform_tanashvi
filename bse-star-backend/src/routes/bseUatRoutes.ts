/**
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Live BSE StAR MF v2.0 UAT Proxy Routes (/api/v1/bse-uat/*)
 */

import { Router, Request, Response } from 'express';
import { BseUatLiveService } from '../services/bseUatLiveService.js';

const router = Router();

// GET /api/v1/bse-uat/status — Live authentication verification against BSE UAT
router.get('/status', async (req: Request, res: Response) => {
  try {
    const svc = BseUatLiveService.getInstance();
    const auth = await svc.getAccessToken();
    res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        expiresInSec: auth.expiresInSec,
        orgId: auth.claims?.org_id || '94515',
        orgType: auth.claims?.org_type || 'MEMBER',
        roles: auth.claims?.resource_access?.['starmfv2-demo-api-client']?.roles || [],
        gateway: process.env.BSE_GATEWAY_URL || 'https://starmfv2demo.bseindia.com/api'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/bse-uat/schemes?search=HDFC&plan=Regular&option=Growth&length=10
router.get('/schemes', async (req: Request, res: Response) => {
  try {
    const svc = BseUatLiveService.getInstance();
    const result = await svc.fetchLiveSchemes({
      search: req.query.search ? String(req.query.search) : '',
      amc: req.query.amc ? String(req.query.amc) : '',
      plan: req.query.plan ? String(req.query.plan) : '',
      option: req.query.option ? String(req.query.option) : '',
      length: req.query.length ? Math.min(100, parseInt(String(req.query.length), 10) || 10) : 10
    });
    res.status(result.status).json({ success: result.status === 200, ...result.data });
  } catch (err: any) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/bse-uat/nav?length=10&bseSchemeCode=...
router.get('/nav', async (req: Request, res: Response) => {
  try {
    const svc = BseUatLiveService.getInstance();
    const result = await svc.fetchLiveNavs({
      length: req.query.length ? Math.min(100, parseInt(String(req.query.length), 10) || 10) : 10,
      bseSchemeCode: req.query.bseSchemeCode ? String(req.query.bseSchemeCode) : undefined,
      navDate: req.query.navDate ? String(req.query.navDate) : undefined
    });
    res.status(result.status).json({ success: result.status === 200, ...result.data });
  } catch (err: any) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/bse-uat/ucc/list?status=ACTIVE
router.get('/ucc/list', async (req: Request, res: Response) => {
  try {
    const svc = BseUatLiveService.getInstance();
    const result = await svc.listLiveUccs(req.query.status ? String(req.query.status) : undefined);
    res.status(result.status).json({ success: result.status === 200, ...result.data });
  } catch (err: any) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/v1/bse-uat/proxy/:endpoint — Authenticated proxy for live UAT testing (/v2/add_ucc, /order_new, /sxp_register, /mandate_register)
router.post('/proxy/*endpoint', async (req: Request, res: Response) => {
  try {
    const rawParam = (req.params as any).endpoint;
    const ep = '/' + (Array.isArray(rawParam) ? rawParam.join('/') : String(rawParam || ''));
    const allowedPrefixes = ['/v2/add_ucc', '/v2/list_ucc', '/order_new', '/sxp_register', '/mandate_register', '/master_scheme_list', '/nav_master_list'];
    if (!allowedPrefixes.includes(ep)) {
      res.status(403).json({ success: false, error: { message: `Endpoint ${ep} is not in allowed UAT proxy list.` } });
      return;
    }
    const svc = BseUatLiveService.getInstance();
    const result = await svc.postAuthenticated(ep, req.body);
    res.status(result.status).json(result.data);
  } catch (err: any) {
    res.status(502).json({ success: false, error: { message: err.message } });
  }
});

export default router;
