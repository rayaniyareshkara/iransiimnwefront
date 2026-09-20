/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { API_PREFIX, CALLBACK_PATH, config } from './config.ts';
import { readResult, startPayment, verifyTransaction } from './paymentService.ts';

export const router = Router();

/** فرار دادن متن برای درج امن در HTML صفحه‌ی میانی. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function successUrl(outcome: { trackId: string; orderId?: string; purchasedNumber?: string }): string {
  const params = new URLSearchParams({ trackId: outcome.trackId });
  if (outcome.orderId) params.set('orderId', outcome.orderId);
  if (outcome.purchasedNumber) params.set('number', outcome.purchasedNumber);
  return `${config.successPath}?${params.toString()}`;
}

function failureUrl(message: string, trackId?: string, number?: string): string {
  const params = new URLSearchParams({ reason: message });
  if (trackId) params.set('trackId', trackId);
  if (number) params.set('number', number);
  return `${config.failurePath}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// شروع پرداخت
// ---------------------------------------------------------------------------

router.post(`${API_PREFIX}/payment/request`, async (req, res) => {
  const outcome = await startPayment((req.body ?? {}) as Record<string, unknown>);

  switch (outcome.kind) {
    case 'invalid':
      return res.status(422).json({ ok: false, errors: outcome.errors });

    case 'unavailable':
      return res.status(409).json({ ok: false, code: 'number-unavailable', message: outcome.message });

    case 'price-changed':
      return res.status(409).json({
        ok: false,
        code: 'price-changed',
        message: outcome.message,
        amountToman: outcome.amountToman,
      });

    case 'gateway-error':
      return res.status(502).json({ ok: false, code: 'gateway-error', message: outcome.message });

    case 'ok':
      return res.json({
        ok: true,
        trackId: outcome.trackId,
        orderId: outcome.orderId,
        paymentUrl: outcome.paymentUrl,
        amountToman: outcome.amountToman,
      });
  }
});

// ---------------------------------------------------------------------------
// تأیید پرداخت (داخلی — از صفحه‌ی میانی callback صدا زده می‌شود)
// ---------------------------------------------------------------------------

router.post(`${API_PREFIX}/payment/verify`, async (req, res) => {
  const trackId = String((req.body as Record<string, unknown>)?.trackId ?? '');
  const outcome = await verifyTransaction(trackId);

  res.json({
    ...outcome,
    redirectTo: outcome.success
      ? successUrl(outcome)
      : failureUrl(outcome.message, outcome.trackId, outcome.purchasedNumber),
  });
});

/**
 * نتیجه‌ی یک تراکنش تأییدشده برای نمایش در صفحه‌ی موفقیت.
 * فقط تا مدت کوتاهی پس از پرداخت در حافظه موجود است.
 */
router.get(`${API_PREFIX}/payment/result/:trackId`, (req, res) => {
  const payload = readResult(req.params.trackId);
  if (!payload) {
    return res.status(404).json({ ok: false, message: 'نتیجه‌ی این تراکنش در دسترس نیست.' });
  }

  res.json({
    ok: true,
    buyer: payload.buyer,
    amountToman: payload.amountRial / 10,
    refNumber: payload.refNumber,
    paidAt: payload.paidAt,
  });
});

// ---------------------------------------------------------------------------
// بازگشت از درگاه
// ---------------------------------------------------------------------------

/**
 * صفحه‌ی میانی بازگشت از درگاه.
 *
 * پارامترهای success/status فقط برای نمایش پیام اولیه به کاربر استفاده می‌شوند؛
 * تصمیم نهایی را همیشه پاسخ verify می‌گیرد، چون این پارامترها از مرورگر کاربر
 * می‌آیند و قابل دستکاری‌اند.
 */
router.get(CALLBACK_PATH, (req, res) => {
  const trackId = String(req.query.trackId ?? '').replace(/\D/g, '');
  const success = String(req.query.success ?? '');
  const status = String(req.query.status ?? '');

  const initialMessage =
    success === '1'
      ? 'پرداخت انجام شد. در حال بررسی و تأیید نهایی…'
      : 'در حال بررسی وضعیت پرداخت…';

  if (!trackId) {
    return res.redirect(failureUrl('بازگشت از درگاه بدون شناسه تراکنش انجام شد.'));
  }

  res.set('Cache-Control', 'no-store');
  res.type('html').send(`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>در حال بررسی پرداخت</title>
<noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(
    `${CALLBACK_PATH}/resolve?trackId=${trackId}`
  )}"></noscript>
<style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;
       justify-content:center;gap:16px;background:#121214;color:#fff;
       font-family:Vazirmatn,system-ui,sans-serif}
  .spinner{width:40px;height:40px;border:3px solid #FFBE00;border-top-color:transparent;
           border-radius:50%;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  p{font-size:14px;color:#d1d5db;margin:0}
  small{color:#6b7280;font-family:monospace}
</style>
</head>
<body>
  <div class="spinner"></div>
  <p>${escapeHtml(initialMessage)}</p>
  <small>trackId: ${escapeHtml(trackId)}${status ? ` · status: ${escapeHtml(status)}` : ''}</small>
<script>
  fetch('${API_PREFIX}/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId: ${JSON.stringify(trackId)} })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) { window.location.replace(d.redirectTo); })
    .catch(function () {
      window.location.replace(${JSON.stringify(
        `${CALLBACK_PATH}/resolve?trackId=`
      )} + ${JSON.stringify(trackId)});
    });
</script>
</body>
</html>`);
});

/** مسیر پشتیبان بدون جاوااسکریپت: verify سمت سرور و سپس ریدایرکت. */
router.get(`${CALLBACK_PATH}/resolve`, async (req, res) => {
  const trackId = String(req.query.trackId ?? '');
  const outcome = await verifyTransaction(trackId);

  res.redirect(
    outcome.success
      ? successUrl(outcome)
      : failureUrl(outcome.message, outcome.trackId, outcome.purchasedNumber)
  );
});
