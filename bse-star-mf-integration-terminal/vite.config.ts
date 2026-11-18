import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Local dev middleware mirroring Vercel's /api/bse-uat serverless proxy
 * so `npm run dev` and Vercel production behave identically.
 */
function localBseUatProxyPlugin() {
  const backendBase = (process.env.TANASHVI_BACKEND_URL || 'http://130.210.57.235:3000').replace(/\/$/, '');
  return {
    name: 'tanashvi-local-bse-uat-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/bse-uat', async (req: any, res: any) => {
        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const action = url.searchParams.get('action') || 'status';
          const outParams = new URLSearchParams(url.searchParams);
          outParams.delete('action');

          let upstreamPath = '/api/v1/bse-uat/status';
          if (action === 'schemes') upstreamPath = '/api/v1/bse-uat/schemes';
          else if (action === 'nav') upstreamPath = '/api/v1/bse-uat/nav';
          else if (action === 'ucc_list') upstreamPath = '/api/v1/bse-uat/ucc/list';
          else if (action === 'benchmarks') upstreamPath = '/api/v1/benchmarks';

          const qs = outParams.toString();
          const upstream = await fetch(`${backendBase}${upstreamPath}${qs ? `?${qs}` : ''}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(18000)
          });
          const body = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(body);
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, proxyError: true, error: { message: err?.message || 'Local proxy error' } }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localBseUatProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
