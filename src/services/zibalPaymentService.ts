/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** فیلدهای فرم خریدار، با همان نام‌هایی که سرور انتظار دارد. */
export interface BuyerFormPayload {
  fullName: string;
  mobile: string;
  fatherName: string;
  nationalCode: string;
  secondaryRequestNumber: string;
  address: string;
  plaque: string;
  /** شماره‌ای که خریداری می‌شود (از query param صفحه) */
  purchasedNumber: string;
  /**
   * مبلغی که به کاربر نمایش داده شده است (تومان).
   * سرور مبلغ را خودش از منبع معتبر می‌گیرد؛ این عدد فقط برای تشخیص
   * «قیمت عوض شده» فرستاده می‌شود.
   */
  amount: number;
}

export type StartPaymentResult =
  | { status: 'redirect'; paymentUrl: string; trackId: string; orderId: string }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'price-changed'; amountToman: number; message: string }
  | { status: 'error'; message: string };

interface RequestResponseBody {
  ok: boolean;
  code?: string;
  message?: string;
  errors?: Record<string, string>;
  trackId?: string;
  orderId?: string;
  paymentUrl?: string;
  amountToman?: number;
}

/** نتیجه‌ی یک پرداخت تأییدشده، برای نمایش در صفحه‌ی موفقیت. */
export interface PaymentResultBody {
  ok: boolean;
  message?: string;
  buyer?: BuyerFormPayload;
  amountToman?: number;
  refNumber?: string;
  paidAt?: string;
}

/**
 * شروع پرداخت. در صورت موفقیت باید کاربر به `paymentUrl` هدایت شود.
 * هیچ تصمیمی درباره‌ی موفقیت پرداخت اینجا گرفته نمی‌شود؛ آن کار سمت سرور و
 * پس از بازگشت از درگاه انجام می‌شود.
 */
export async function startZibalPayment(payload: BuyerFormPayload): Promise<StartPaymentResult> {
  let response: Response;

  try {
    response = await fetch('/fapi/payment/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Payment request failed:', err);
    return { status: 'error', message: 'ارتباط با سرور پرداخت برقرار نشد. دوباره تلاش کنید.' };
  }

  let body: RequestResponseBody;
  try {
    body = (await response.json()) as RequestResponseBody;
  } catch {
    return { status: 'error', message: 'پاسخ نامعتبر از سرور پرداخت دریافت شد.' };
  }

  if (body.ok && body.paymentUrl && body.trackId && body.orderId) {
    return {
      status: 'redirect',
      paymentUrl: body.paymentUrl,
      trackId: body.trackId,
      orderId: body.orderId,
    };
  }

  if (response.status === 422 && body.errors) {
    return { status: 'invalid', errors: body.errors };
  }

  if (body.code === 'price-changed' && typeof body.amountToman === 'number') {
    return {
      status: 'price-changed',
      amountToman: body.amountToman,
      message: body.message ?? 'قیمت این شماره تغییر کرده است.',
    };
  }

  return { status: 'error', message: body.message ?? 'شروع پرداخت ممکن نشد.' };
}

/** خواندن جزئیات یک پرداخت تأییدشده (تا مدت کوتاهی پس از پرداخت در دسترس است). */
export async function fetchPaymentResult(trackId: string): Promise<PaymentResultBody | null> {
  try {
    const response = await fetch(`/fapi/payment/result/${encodeURIComponent(trackId)}`);
    if (!response.ok) return null;
    return (await response.json()) as PaymentResultBody;
  } catch (err) {
    console.error('Failed to read payment result:', err);
    return null;
  }
}
