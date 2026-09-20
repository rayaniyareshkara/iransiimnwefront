/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from './config.ts';
import { postJson } from './http.ts';

/** یک تومان معادل ده ریال است؛ زیبال مبلغ را به ریال می‌گیرد. */
const RIAL_PER_TOMAN = 10;

interface SearchApiNumber {
  msisdn: string;
  pool: string;
  price: number;
}

interface SearchApiProduct {
  id: number;
  finalPrice: number;
  netPrice: number;
  vat: number;
  sim_type: string;
  info?: { fa?: { title?: string; name?: string } };
}

interface SearchApiResponse {
  result_code: number;
  info?: { fa?: { message?: string } };
  result?: {
    numbers?: SearchApiNumber[];
    products?: Record<string, SearchApiProduct>;
    similar_numbers?: boolean;
  };
}

/** تلاش دوباره با مکث کوتاه؛ فقط برای عملیات بی‌اثر استفاده شود. */
async function withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        console.warn(`Price lookup attempt ${attempt} failed, retrying:`, err);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError;
}

export class NumberUnavailableError extends Error {
  constructor(readonly phoneNumber: string) {
    super('این شماره دیگر برای خرید موجود نیست.');
    this.name = 'NumberUnavailableError';
  }
}

export interface PriceQuote {
  phoneNumber: string;
  /** مبلغ قابل پرداخت به تومان (همان عددی که به کاربر نمایش داده می‌شود) */
  amountToman: number;
  /** همان مبلغ به ریال؛ این عدد به زیبال ارسال می‌شود. */
  amountRial: number;
  title: string;
  pool: string;
  productId: number;
}

/**
 * مبلغ قابل پرداخت یک شماره را از منبع معتبر می‌گیرد.
 *
 * این همان سرویسی است که صفحه‌ی جزئیات از آن قیمت می‌گیرد، بنابراین سرور هرگز
 * به عدد ارسالی از فرانت تکیه نمی‌کند: مبلغ لحظه‌ی پرداخت اینجا دوباره محاسبه
 * می‌شود و اگر شماره فروخته شده باشد اصلاً تراکنشی ساخته نمی‌شود.
 */
export async function getPriceQuote(phoneNumber: string): Promise<PriceQuote> {
  const msisdn = phoneNumber.replace(/\D/g, '').replace(/^(?:0098|98|0)/, '');
  if (msisdn.length !== 10) {
    throw new NumberUnavailableError(phoneNumber);
  }

  // خواندن قیمت یک عملیات بی‌اثر است، پس تکرارش امن است. یک قطعی لحظه‌ای
  // بالادست نباید کاربری را که وسط پرداخت است با خطا برگرداند.
  const raw = await withRetry(() =>
    postJson<SearchApiResponse>(config.numberSearchUrl, { pattern: msisdn })
  );
  if (raw.result_code !== 0) {
    throw new Error(raw.info?.fa?.message || 'خطا در دریافت قیمت شماره');
  }

  const numbers = raw.result?.numbers ?? [];
  const products = raw.result?.products ?? {};

  // سرویس در صورت ناموجود بودن شماره، پیشنهادهای مشابه برمی‌گرداند؛ فقط
  // تطابق دقیق پذیرفته می‌شود.
  const match = numbers.find((n) => n.msisdn.replace(/\D/g, '') === msisdn);
  if (!match) {
    throw new NumberUnavailableError(phoneNumber);
  }

  const product = products[match.pool];
  const amountToman = (match.price ?? 0) + (product?.finalPrice ?? 0);
  if (!Number.isFinite(amountToman) || amountToman <= 0) {
    throw new Error('قیمت این شماره در دسترس نیست.');
  }

  return {
    phoneNumber: `0${msisdn}`,
    amountToman,
    amountRial: Math.round(amountToman * RIAL_PER_TOMAN),
    title: product?.info?.fa?.title ?? product?.info?.fa?.name ?? 'سیم‌کارت ایرانسل',
    pool: match.pool,
    productId: product?.id ?? 0,
  };
}
