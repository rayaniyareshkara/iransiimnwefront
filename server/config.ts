/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import path from 'node:path';

/**
 * خواندن متغیر محیطی الزامی. اگر تنظیم نشده باشد سرور همان ابتدا بالا نمی‌آید،
 * تا هیچ‌وقت با مقدار پیش‌فرضِ نوشته‌شده در کد کار نکنیم.
 */
function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

const port = Number(optionalEnv('PORT', '3000'));

const isProduction = process.env.NODE_ENV === 'production';

/**
 * آدرس عمومی اپ. اشتباه بودن این مقدار تا لحظه‌ی بازگشت از درگاه پنهان می‌ماند
 * و کاربری که پول داده به صفحه‌ای می‌رسد که وجود ندارد.
 */
function resolvePublicBaseUrl(): string {
  const raw = optionalEnv('PUBLIC_BASE_URL', `http://localhost:${port}`).replace(/\/+$/, '');

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    console.warn(`PUBLIC_BASE_URL نامعتبر است: ${raw}، از پیش‌فرض استفاده می‌شود.`);
    return `http://localhost:${port}`;
  }

  if (isProduction) {
    if (parsed.protocol !== 'https:' || /^(localhost$|127\.|0\.0\.0\.0$|\[?::1)/.test(parsed.hostname)) {
      console.warn(
        `هشدار: PUBLIC_BASE_URL (${raw}) در حالت production روی HTTPS و دامنه عمومی تنظیم نشده است.`
      );
    }
  }

  return parsed.origin;
}

export const config = {
  port,

  /** مرچنت زیبال؛ در صورت عدم تنظیم از مرچنت تستی (zibal) استفاده می‌شود */
  zibalMerchant: optionalEnv('ZIBAL_MERCHANT', 'zibal'),

  zibalBaseUrl: optionalEnv('ZIBAL_BASE_URL', 'https://gateway.zibal.ir'),

  /**
   * آدرس عمومی اپلیکیشن. مبنای ساخت callbackUrl است، پس باید همان دامنه‌ای
   * باشد که کاربر با آن پرداخت را شروع می‌کند.
   */
  publicBaseUrl: resolvePublicBaseUrl(),

  isProduction,

  /**
   * منبع معتبر قیمت. همان سرویسی که صفحه‌ی جزئیات از آن قیمت می‌گیرد؛ مبلغ
   * پرداخت هرگز از فرانت پذیرفته نمی‌شود و همیشه از اینجا خوانده می‌شود.
   */
  numberSearchUrl: optionalEnv('NUMBER_SEARCH_URL', 'https://iransiim.ir/api/search'),
  numberSearchOrigin: optionalEnv('NUMBER_SEARCH_ORIGIN', 'https://iransiim.ir'),
  numberSearchHost: optionalEnv('NUMBER_SEARCH_HOST', 'iransiim.ir'),

  productImageOrigin: optionalEnv('PRODUCT_IMAGE_ORIGIN', 'https://shop.irancell.ir'),
  productImageHost: optionalEnv('PRODUCT_IMAGE_HOST', 'shop.irancell.ir'),

  /** محل نگهداری فایل سبک تراکنش‌ها (جلوگیری از پردازش تکراری). */
  dataDir: optionalEnv('DATA_DIR', path.resolve(process.cwd(), 'server-data')),

  /** مسیرهای SPA که کاربر بعد از بررسی پرداخت به آن‌ها هدایت می‌شود. */
  successPath: '/store/success',
  failurePath: '/store/payment-failed',

  /** سقف زمان انتظار برای سرویس‌های بیرونی. */
  upstreamTimeoutMs: Number(optionalEnv('UPSTREAM_TIMEOUT_MS', '15000')),
} as const;

/**
 * پیشوند تمام مسیرهای این سرور.
 *
 * عمداً /api نیست: بک‌اند فروشگاه روی همین دامنه تمام /api را می‌گیرد، پس
 * مسیرهای پرداخت باید فضای نامی جدا داشته باشند تا nginx بتواند بدون ابهام
 * هر کدام را به سرویس خودش بفرستد.
 */
export const API_PREFIX = '/fapi';

export const CALLBACK_PATH = `${API_PREFIX}/payment/callback`;

export function buildCallbackUrl(): string {
  return `${config.publicBaseUrl}${CALLBACK_PATH}`;
}
