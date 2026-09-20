/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { API_PREFIX, buildCallbackUrl, config } from './config.ts';
import { router } from './routes.ts';

const app = express();

// پشت nginx/CDN اجرا می‌شود؛ بدون این، آی‌پی و پروتکل واقعی کاربر دیده نمی‌شود.
app.set('trust proxy', true);
// نسخه‌ی Express را در هدر پاسخ اعلام نکن.
app.disable('x-powered-by');

// بدنه‌ی درخواست‌ها کوچک است؛ سقف پایین جلوی مصرف بی‌مورد حافظه را می‌گیرد.
app.use(express.json({ limit: '32kb' }));

app.get(`${API_PREFIX}/payment/healthz`, (_req, res) => {
  res.json({ ok: true, merchantConfigured: Boolean(config.zibalMerchant) });
});

app.use(router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ ok: false, message: 'خطای غیرمنتظره در سرور.' });
});

app.listen(config.port, () => {
  console.log(`payment server listening on http://localhost:${config.port}`);
  console.log(`mode: ${config.isProduction ? 'production' : 'development'}`);
  console.log(`callback url: ${buildCallbackUrl()}`);
});
