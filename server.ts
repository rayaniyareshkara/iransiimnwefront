/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { API_PREFIX, config } from './server/config.ts';
import { router as paymentRouter } from './server/routes.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', true);
  app.disable('x-powered-by');

  // Health checks
  app.get('/healthz', (_req, res) => {
    res.type('text/plain').send('ok\n');
  });

  app.get(`${API_PREFIX}/payment/healthz`, (_req, res) => {
    res.json({ ok: true, merchantConfigured: Boolean(config.zibalMerchant) });
  });

  // Small JSON body limit for payment endpoints
  app.use(express.json({ limit: '32kb' }));

  // 1. Payment routes (/fapi/*)
  app.use(paymentRouter);

  // 2. Upstream number-search API proxy (/api/*)
  app.all('/api/*', async (req, res) => {
    try {
      const upstreamUrl = `${config.numberSearchOrigin}${req.originalUrl}`;
      const headers: Record<string, string> = {
        host: config.numberSearchHost,
        'content-type': req.get('content-type') || 'application/json',
        'user-agent': req.get('user-agent') || 'iransiim-client',
        accept: req.get('accept') || 'application/json',
      };

      const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);

      const upstreamResponse = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      res.status(upstreamResponse.status);
      upstreamResponse.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (!['transfer-encoding', 'content-encoding', 'content-length', 'connection'].includes(lower)) {
          res.setHeader(key, val);
        }
      });

      const buffer = await upstreamResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('API proxy error:', err);
      res.status(502).json({ ok: false, message: 'خطا در ارتباط با سرویس جستجوی شماره.' });
    }
  });

  // 3. Product image proxy (/product-image/*)
  app.all('/product-image/*', async (req, res) => {
    try {
      const subPath = req.params[0] || req.originalUrl.replace(/^\/product-image\/?/, '');
      const upstreamUrl = `${config.productImageOrigin}/${subPath}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const upstreamResponse = await fetch(upstreamUrl, {
        headers: {
          host: config.productImageHost,
          'user-agent': 'Mozilla/5.0 (compatible; IransiimProxy/1.0)',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      res.status(upstreamResponse.status);
      upstreamResponse.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (!['transfer-encoding', 'content-encoding', 'content-length', 'connection'].includes(lower)) {
          res.setHeader(key, val);
        }
      });

      const buffer = await upstreamResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      // Fallback: If shop.irancell.ir cannot be reached, return 504
      res.status(504).end();
    }
  });

  // 4. Vite middleware (dev) or static serving (prod)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = await fs.readFile(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ ok: false, message: 'خطای غیرمنتظره در سرور.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
