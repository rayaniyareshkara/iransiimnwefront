/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { buildCallbackUrl } from './config.ts';
import { getPriceQuote, NumberUnavailableError } from './pricing.ts';
import { transactionStore } from './transactionStore.ts';
import {
  buildStartUrl,
  describeResult,
  requestPayment,
  RESULT_ALREADY_VERIFIED,
  RESULT_SUCCESS,
  verifyPayment,
} from './zibalClient.ts';
import { buildDescription, BuyerInfo, parseDescription, validateBuyer } from './validation.ts';

export { NumberUnavailableError };

/**
 * اطلاعات خریدارِ یک تراکنشِ تأییدشده، فقط در حافظه و برای مدت کوتاه.
 * طبق تصمیم پروژه این داده‌ها ماندگار نمی‌شوند؛ صفحه‌ی موفقیت یک‌بار آن را
 * می‌خواند و بعد از TTL خودبه‌خود پاک می‌شود.
 */
const RESULT_TTL_MS = 15 * 60 * 1000;

interface VerifiedPayload {
  buyer: BuyerInfo;
  amountRial: number;
  refNumber?: string;
  paidAt?: string;
  expiresAt: number;
}

const verifiedResults = new Map<string, VerifiedPayload>();

function rememberResult(trackId: string, payload: Omit<VerifiedPayload, 'expiresAt'>): void {
  // پاک‌سازی تنبل موارد منقضی‌شده تا این Map بی‌نهایت رشد نکند.
  const now = Date.now();
  for (const [key, item] of verifiedResults) {
    if (item.expiresAt <= now) verifiedResults.delete(key);
  }

  verifiedResults.set(trackId, { ...payload, expiresAt: now + RESULT_TTL_MS });
}

export function readResult(trackId: string): VerifiedPayload | null {
  const payload = verifiedResults.get(trackId);
  if (!payload) return null;

  if (payload.expiresAt <= Date.now()) {
    verifiedResults.delete(trackId);
    return null;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// شروع پرداخت
// ---------------------------------------------------------------------------

export type StartPaymentOutcome =
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'unavailable'; message: string }
  | { kind: 'price-changed'; amountToman: number; message: string }
  | { kind: 'gateway-error'; message: string }
  | { kind: 'ok'; trackId: string; orderId: string; paymentUrl: string; amountToman: number };

export async function startPayment(body: Record<string, unknown>): Promise<StartPaymentOutcome> {
  const validation = validateBuyer(body);
  if (!validation.ok) {
    return { kind: 'invalid', errors: validation.errors as Record<string, string> };
  }

  const buyer = validation.value;

  // مبلغ همیشه از منبع معتبر خوانده می‌شود؛ عدد ارسالی فرانت فقط برای تشخیص
  // «قیمت عوض شده» به کار می‌رود و هرگز مبنای مبلغ تراکنش نیست.
  let quote;
  try {
    quote = await getPriceQuote(buyer.purchasedNumber);
  } catch (err) {
    if (err instanceof NumberUnavailableError) {
      return { kind: 'unavailable', message: err.message };
    }
    console.error('Price lookup failed:', err);
    return { kind: 'gateway-error', message: 'دریافت قیمت شماره ممکن نشد. دوباره تلاش کنید.' };
  }

  const clientAmount = Number(body.amount);
  if (Number.isFinite(clientAmount) && clientAmount > 0 && clientAmount !== quote.amountToman) {
    return {
      kind: 'price-changed',
      amountToman: quote.amountToman,
      message: 'قیمت این شماره به‌روزرسانی شده است. لطفاً مبلغ جدید را تأیید کنید.',
    };
  }

  const orderId = uuidv4();
  const description = buildDescription(buyer);

  let response;
  try {
    response = await requestPayment({
      amountRial: quote.amountRial,
      callbackUrl: buildCallbackUrl(),
      description,
      orderId,
      mobile: buyer.mobile,
    });
  } catch (err) {
    console.error('Zibal request failed:', err);
    return { kind: 'gateway-error', message: 'ارتباط با درگاه پرداخت برقرار نشد.' };
  }

  if (response.result !== RESULT_SUCCESS || !response.trackId) {
    return {
      kind: 'gateway-error',
      message: describeResult(response.result, response.message),
    };
  }

  const trackId = String(response.trackId);

  await transactionStore.create({
    trackId,
    orderId,
    amountRial: quote.amountRial,
    purchasedNumber: buyer.purchasedNumber,
  });

  return {
    kind: 'ok',
    trackId,
    orderId,
    paymentUrl: buildStartUrl(trackId),
    amountToman: quote.amountToman,
  };
}

// ---------------------------------------------------------------------------
// تأیید پرداخت
// ---------------------------------------------------------------------------

export interface VerifyOutcome {
  success: boolean;
  /** true یعنی همین حالا تأیید شد؛ false یعنی قبلاً تأیید شده بود. */
  firstTime: boolean;
  trackId: string;
  orderId?: string;
  amountToman?: number;
  purchasedNumber?: string;
  refNumber?: string;
  message: string;
}

/**
 * تأیید نهایی تراکنش. تصمیم فقط بر اساس پاسخ /v1/verify گرفته می‌شود، نه
 * پارامترهای query که مرورگر کاربر با خود می‌آورد.
 */
export async function verifyTransaction(trackId: string): Promise<VerifyOutcome> {
  const clean = String(trackId ?? '').replace(/\D/g, '');
  if (!clean) {
    return { success: false, firstTime: false, trackId: '', message: 'شناسه تراکنش نامعتبر است.' };
  }

  const record = await transactionStore.get(clean);
  if (!record) {
    // تراکنشی که این سرور نساخته است؛ نه مبلغ مورد انتظاری داریم نه سفارشی.
    return {
      success: false,
      firstTime: false,
      trackId: clean,
      message: 'این تراکنش در سامانه ثبت نشده است.',
    };
  }

  // idempotency: اگر قبلاً پردازش شده، دوباره به درگاه دست نمی‌زنیم.
  if (record.status === 'verified') {
    return {
      success: true,
      firstTime: false,
      trackId: clean,
      orderId: record.orderId,
      amountToman: record.amountRial / 10,
      purchasedNumber: record.purchasedNumber,
      refNumber: record.refNumber,
      message: 'این پرداخت پیش‌تر تأیید شده است.',
    };
  }

  let response;
  try {
    response = await verifyPayment(clean);
  } catch (err) {
    console.error('Zibal verify failed:', err);
    // وضعیت را failed نمی‌کنیم: خطای شبکه یعنی نتیجه نامعلوم است و باید
    // بتوان دوباره تلاش کرد.
    return {
      success: false,
      firstTime: false,
      trackId: clean,
      message: 'ارتباط با درگاه برای تأیید پرداخت برقرار نشد. لحظاتی بعد دوباره تلاش کنید.',
    };
  }

  const isSuccess =
    response.result === RESULT_SUCCESS || response.result === RESULT_ALREADY_VERIFIED;

  if (!isSuccess) {
    await transactionStore.update(clean, {
      status: 'failed',
      failureReason: describeResult(response.result, response.message),
    });
    return {
      success: false,
      firstTime: false,
      trackId: clean,
      orderId: record.orderId,
      message: describeResult(response.result, response.message),
    };
  }

  // مبلغ اعلامی درگاه باید دقیقاً همان مبلغی باشد که تراکنش با آن ساخته شده.
  if (typeof response.amount === 'number' && response.amount !== record.amountRial) {
    console.error(
      `Amount mismatch for trackId ${clean}: expected ${record.amountRial}, got ${response.amount}`
    );
    await transactionStore.update(clean, {
      status: 'failed',
      failureReason: 'amount-mismatch',
    });
    return {
      success: false,
      firstTime: false,
      trackId: clean,
      orderId: record.orderId,
      message: 'مبلغ تراکنش با مبلغ سفارش هم‌خوانی ندارد. با پشتیبانی تماس بگیرید.',
    };
  }

  const buyer = parseDescription(response.description);
  const refNumber = response.refNumber !== undefined ? String(response.refNumber) : undefined;

  // فقط اولین باری که پرداخت تأیید می‌شود، پردازش پس از پرداخت انجام می‌شود.
  const firstTime = !record.delivered;
  await transactionStore.update(clean, {
    status: 'verified',
    delivered: true,
    verifiedAt: new Date().toISOString(),
    refNumber,
  });

  if (buyer) {
    rememberResult(clean, {
      buyer,
      amountRial: record.amountRial,
      refNumber,
      paidAt: response.paidAt,
    });
  }

  return {
    success: true,
    firstTime,
    trackId: clean,
    orderId: record.orderId,
    amountToman: record.amountRial / 10,
    purchasedNumber: buyer?.purchasedNumber || record.purchasedNumber,
    refNumber,
    message: firstTime ? 'پرداخت با موفقیت تأیید شد.' : 'این پرداخت پیش‌تر تأیید شده است.',
  };
}
