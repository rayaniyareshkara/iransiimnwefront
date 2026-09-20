/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from './config.ts';
import { postJson } from './http.ts';

export interface ZibalRequestResponse {
  result: number;
  trackId?: number;
  message?: string;
}

export interface ZibalVerifyResponse {
  result: number;
  message?: string;
  /** مبلغ تراکنش به ریال، همان‌طور که درگاه ثبت کرده است. */
  amount?: number;
  status?: number;
  paidAt?: string;
  cardNumber?: string;
  refNumber?: number | string;
  orderId?: string;
  description?: string;
}

/** پیام فارسی کدهای پاسخ زیبال. */
const RESULT_MESSAGES: Record<number, string> = {
  100: 'موفق',
  102: 'مرچنت یافت نشد.',
  103: 'مرچنت غیرفعال است.',
  104: 'مرچنت نامعتبر است.',
  105: 'مبلغ تراکنش باید بیشتر از ۱٬۰۰۰ ریال باشد.',
  106: 'آدرس بازگشت (callbackUrl) نامعتبر است.',
  113: 'مبلغ تراکنش از سقف مجاز بیشتر است.',
  201: 'این تراکنش قبلاً تأیید شده است.',
  202: 'تراکنش پرداخت نشده یا ناموفق بوده است.',
  203: 'شناسه تراکنش (trackId) نامعتبر است.',
};

export function describeResult(result: number, fallback?: string): string {
  return RESULT_MESSAGES[result] ?? fallback ?? `خطای درگاه پرداخت (کد ${result})`;
}

/** کد ۱۰۰ یعنی درخواست موفق. */
export const RESULT_SUCCESS = 100;
/** کد ۲۰۱ یعنی تراکنش پیش‌تر verify شده است (نباید دوباره پردازش شود). */
export const RESULT_ALREADY_VERIFIED = 201;

export interface ZibalRequestInput {
  amountRial: number;
  callbackUrl: string;
  description: string;
  orderId: string;
  mobile?: string;
}

/** ساخت تراکنش جدید در درگاه. */
export function requestPayment(input: ZibalRequestInput): Promise<ZibalRequestResponse> {
  return postJson<ZibalRequestResponse>(`${config.zibalBaseUrl}/v1/request`, {
    merchant: config.zibalMerchant,
    amount: input.amountRial,
    callbackUrl: input.callbackUrl,
    description: input.description,
    orderId: input.orderId,
    mobile: input.mobile,
  });
}

/** تأیید نهایی تراکنش. تنها مرجع تصمیم‌گیری درباره‌ی موفقیت پرداخت است. */
export function verifyPayment(trackId: string): Promise<ZibalVerifyResponse> {
  return postJson<ZibalVerifyResponse>(`${config.zibalBaseUrl}/v1/verify`, {
    merchant: config.zibalMerchant,
    trackId,
  });
}

/** آدرسی که کاربر برای پرداخت به آن هدایت می‌شود. */
export function buildStartUrl(trackId: string): string {
  return `${config.zibalBaseUrl}/start/${trackId}`;
}
