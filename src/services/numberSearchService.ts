/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IrancellApiProduct,
  IrancellNumberSearchResponse,
  NumberSearchOutcome,
  NumberSearchResult,
} from '../types';

/** طول بخش میانی و پایانی شماره (بعد از پیش‌شماره‌ی سه‌رقمی). */
export const NUMBER_PART1_LENGTH = 3;
export const NUMBER_PART2_LENGTH = 4;

/**
 * مسیر جستجو. به‌صورت پیش‌فرض هم‌مبدأ است و توسط پراکسی (Vite در توسعه و
 * nginx در پروداکشن) به https://iransiim.ir/api/search هدایت می‌شود؛ چون سرویس
 * مبدأ هدر CORS برنمی‌گرداند و فراخوانی مستقیم از مرورگر بلاک می‌شود.
 */
const SEARCH_ENDPOINT = import.meta.env.VITE_NUMBER_SEARCH_URL || '/api/search';

/**
 * پیشوند پراکسی تصاویر محصول. تصاویر روی shop.irancell.ir در مرورگر مستقیم
 * بارگذاری نمی‌شوند، بنابراین مثل خود API از مسیر هم‌مبدأ عبور داده می‌شوند.
 */
const IMAGE_PROXY_PREFIX = '/product-image/';

/** سقف زمان انتظار برای پاسخ سرویس. */
const REQUEST_TIMEOUT_MS = 15000;

/** فقط ارقام لاتین را نگه می‌دارد و ارقام فارسی/عربی را تبدیل می‌کند. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

/** شماره‌ی ملی ده‌رقمی را به شکل خوانا درمی‌آورد: 9001201156 → «0900 120 1156». */
export function formatMsisdn(msisdn: string): string {
  return `0${msisdn.slice(0, 3)} ${msisdn.slice(3, 6)} ${msisdn.slice(6)}`;
}

/** آدرس تصویر محصول را به مسیر پراکسی‌شده‌ی هم‌مبدأ تبدیل می‌کند. */
export function toProxiedImageUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.hostname !== 'shop.irancell.ir') return url;
    return `${IMAGE_PROXY_PREFIX}${parsed.pathname.replace(/^\//, '')}${parsed.search}`;
  } catch {
    return url;
  }
}

/** برچسب فارسی نوع سیم‌کارت بر اساس مقدار خام سرویس. */
const SIM_TYPE_LABELS: Record<string, string> = {
  POSTPAID: 'دائمی',
  PREPAID: 'اعتباری',
};

/**
 * پاسخ خام API را به شکل قابل نمایش در UI تبدیل می‌کند.
 * هر شماره از طریق `pool` به محصول متناظرش در `result.products` وصل می‌شود و
 * تمام اطلاعات لازم برای مراحل خرید (امکانات، تصویر، اجزای قیمت) استخراج می‌شود.
 */
export function parseNumberSearchResponse(
  raw: IrancellNumberSearchResponse
): NumberSearchResult[] {
  const { numbers = [], products = {} } = raw.result ?? {};

  return numbers.map((item) => {
    const product: IrancellApiProduct | undefined = products[item.pool];
    const fa = product?.info?.fa;
    // msisdn با جداکننده می‌آید: «900 - 120 - 8547»
    const digits = toLatinDigits(item.msisdn);

    const numberPrice = item.price ?? 0;
    const netPrice = product?.netPrice ?? 0;
    const vat = product?.vat ?? 0;
    const productPrice = product?.finalPrice ?? netPrice + vat;
    const simType = product?.sim_type ?? '';

    return {
      id: `${digits}-${item.pool}`,
      msisdn: digits,
      phoneNumber: `0${digits}`,
      formattedNumber: formatMsisdn(digits),

      pool: item.pool,
      productId: product?.id ?? 0,
      title: fa?.title ?? fa?.name ?? 'سیم‌کارت ایرانسل',
      name: fa?.name ?? fa?.title ?? 'سیم‌کارت ایرانسل',
      simType,
      simTypeLabel: SIM_TYPE_LABELS[simType] ?? 'دائمی',
      thumbnailUrl: toProxiedImageUrl(fa?.thumbnailUrl),
      // سرویس بین آیتم‌ها مقدار null می‌گذارد؛ آن‌ها فاصله‌اند نه محتوا.
      features: (fa?.features ?? []).filter((f): f is string => Boolean(f?.trim())),

      numberPrice,
      netPrice,
      vat,
      discount: product?.discount ?? 0,
      isDiscounted: product?.isDiscounted ?? false,
      productPrice,
      totalPrice: numberPrice + productPrice,
    };
  });
}

/** فراخوانی سرویس جستجو با الگوی ده‌رقمی (بدون صفر ابتدایی). */
async function fetchNumberSearch(pattern: string): Promise<IrancellNumberSearchResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as IrancellNumberSearchResponse;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * کش شماره‌های دیده‌شده، کلید: شماره‌ی کامل با صفر.
 * پس از کلیک روی «خرید»، مرحله‌ی بعد بدون درخواست دوباره داده را دارد؛ ولی
 * با رفرش یا باز کردن مستقیم لینک، از سرویس واکشی می‌شود.
 */
const offerCache = new Map<string, NumberSearchResult>();

function cacheResults(results: NumberSearchResult[]): NumberSearchResult[] {
  results.forEach((r) => offerCache.set(r.phoneNumber, r));
  return results;
}

/** شماره‌ی ورودی را به شکل ملی ده‌رقمی (بدون صفر/کد کشور) درمی‌آورد. */
function toNationalMsisdn(value: string): string {
  return toLatinDigits(value).replace(/^(?:0098|98|0)/, '');
}

export const numberSearchService = {
  /**
   * جستجوی شماره. ورود کامل هر دو بخش شماره الزامی است؛ در غیر این صورت
   * درخواستی ارسال نمی‌شود.
   *
   * سه حالت ممکن در پاسخ سرویس وجود دارد:
   *  ۱) شماره‌ی دقیق موجود است → `similar_numbers: false` و همان شماره برمی‌گردد.
   *  ۲) شماره موجود نیست ولی نزدیک به آن هست → `similar_numbers: true`.
   *  ۳) هیچ شماره‌ای پیدا نشد → `numbers` خالی.
   */
  async search(prefix: string, part1: string, part2: string): Promise<NumberSearchOutcome> {
    if (part1.length !== NUMBER_PART1_LENGTH || part2.length !== NUMBER_PART2_LENGTH) {
      throw new Error('INCOMPLETE_NUMBER');
    }

    const pattern = `${prefix}${part1}${part2}`;
    const raw = await fetchNumberSearch(pattern);

    if (raw.result_code !== 0) {
      throw new Error(raw.info?.fa?.message || 'خطا در جستجوی شماره');
    }

    const results = cacheResults(parseNumberSearchResponse(raw));
    // پرچم سرویس ملاک اصلی است؛ مقایسه‌ی شماره‌ها هم به‌عنوان پشتیبان بررسی
    // می‌شود تا اگر پرچم ست نشده بود، نتیجه‌ی غیردقیق «مشابه» تلقی شود.
    const isSimilar =
      results.length > 0 &&
      (raw.result?.similar_numbers === true || !results.some((r) => r.msisdn === pattern));

    return { pattern, formattedPattern: formatMsisdn(pattern), results, isSimilar };
  },

  /**
   * واکشی یک شماره‌ی مشخص برای مراحل خرید (شماره از URL خوانده می‌شود).
   * اگر شماره دیگر موجود نباشد `null` برمی‌گردد — پیشنهادهای مشابهِ سرویس
   * عمداً نادیده گرفته می‌شوند، چون کاربر همین شماره را انتخاب کرده است.
   */
  async getByPhoneNumber(phoneNumber: string): Promise<NumberSearchResult | null> {
    const msisdn = toNationalMsisdn(phoneNumber);
    if (msisdn.length !== 10) {
      return null;
    }

    const cached = offerCache.get(`0${msisdn}`);
    if (cached) {
      return cached;
    }

    const raw = await fetchNumberSearch(msisdn);
    if (raw.result_code !== 0) {
      throw new Error(raw.info?.fa?.message || 'خطا در دریافت اطلاعات شماره');
    }

    const results = cacheResults(parseNumberSearchResponse(raw));
    return results.find((r) => r.msisdn === msisdn) ?? null;
  },
};
