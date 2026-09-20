/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * اطلاعات خریدار؛ همان شکلی که در فیلد description زیبال ذخیره و هنگام verify
 * دوباره خوانده می‌شود.
 */
export interface BuyerInfo {
  fullName: string;
  mobile: string;
  fatherName: string;
  nationalCode: string;
  secondaryRequestNumber: string;
  address: string;
  plaque: string;
  purchasedNumber: string;
}

/**
 * سقف طول هر فیلد. علاوه بر جلوگیری از ورودی بی‌اندازه، تضمین می‌کند رشته‌ی
 * description از حد مجاز درگاه بیرون نزند (جمع بدترین حالت زیر ۵۰۰ کاراکتر).
 */
const MAX_LENGTHS: Record<keyof BuyerInfo, number> = {
  fullName: 80,
  mobile: 11,
  fatherName: 50,
  nationalCode: 10,
  secondaryRequestNumber: 11,
  address: 180,
  plaque: 10,
  purchasedNumber: 11,
};

const MOBILE_PATTERN = /^09\d{9}$/;
const NATIONAL_CODE_PATTERN = /^\d{10}$/;
const SECONDARY_NUMBER_PATTERN = /^\d{8,11}$/;

/** کاراکترهای کنترلی که باید از ورودی حذف شوند. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g;

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند. */
function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * پاک‌سازی ورودی متنی: حذف کاراکترهای کنترلی (که می‌توانند رشته‌ی JSON را
 * خراب یا لاگ‌ها را آلوده کنند)، یکدست‌کردن فاصله‌ها و برش به سقف مجاز.
 */
function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** پاک‌سازی فیلدهای عددی: تبدیل ارقام فارسی و حذف هر کاراکتر غیر رقم. */
function sanitizeDigits(value: unknown, maxLength: number): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return toLatinDigits(String(value)).replace(/\D/g, '').slice(0, maxLength);
}

export interface ValidationResult {
  ok: boolean;
  /** کلید فیلد → پیام خطا */
  errors: Partial<Record<keyof BuyerInfo, string>>;
  value: BuyerInfo;
}

/**
 * اعتبارسنجی سمت سرور روی تمام فیلدهای فرم. مستقل از اعتبارسنجی فرانت است و
 * قبل از هر تماسی با زیبال اجرا می‌شود.
 */
export function validateBuyer(body: Record<string, unknown>): ValidationResult {
  const value: BuyerInfo = {
    fullName: sanitizeText(body.fullName, MAX_LENGTHS.fullName),
    mobile: sanitizeDigits(body.mobile, MAX_LENGTHS.mobile),
    fatherName: sanitizeText(body.fatherName, MAX_LENGTHS.fatherName),
    nationalCode: sanitizeDigits(body.nationalCode, MAX_LENGTHS.nationalCode),
    secondaryRequestNumber: sanitizeDigits(
      body.secondaryRequestNumber,
      MAX_LENGTHS.secondaryRequestNumber
    ),
    address: sanitizeText(body.address, MAX_LENGTHS.address),
    plaque: sanitizeText(body.plaque, MAX_LENGTHS.plaque),
    purchasedNumber: sanitizeDigits(body.purchasedNumber, MAX_LENGTHS.purchasedNumber),
  };

  const errors: ValidationResult['errors'] = {};

  if (value.fullName.length < 3) {
    errors.fullName = 'نام و نام خانوادگی باید حداقل ۳ حرف باشد.';
  }

  if (!MOBILE_PATTERN.test(value.mobile)) {
    errors.mobile = 'شماره موبایل معتبر نیست (مثال: 09123456789).';
  }

  if (value.fatherName.length < 2) {
    errors.fatherName = 'وارد کردن نام پدر الزامی است.';
  }

  if (!NATIONAL_CODE_PATTERN.test(value.nationalCode)) {
    errors.nationalCode = 'کد ملی باید ۱۰ رقم باشد.';
  }

  // اختیاری است؛ ولی اگر پر شده باشد باید معتبر باشد.
  if (
    value.secondaryRequestNumber &&
    !SECONDARY_NUMBER_PATTERN.test(value.secondaryRequestNumber)
  ) {
    errors.secondaryRequestNumber = 'شماره درخواست دوم نامعتبر است.';
  }

  if (value.address.length < 8) {
    errors.address = 'آدرس کامل را وارد کنید.';
  }

  if (value.plaque.length < 1) {
    errors.plaque = 'وارد کردن پلاک الزامی است.';
  }

  if (!MOBILE_PATTERN.test(value.purchasedNumber)) {
    errors.purchasedNumber = 'شماره‌ی خریداری‌شده نامعتبر است.';
  }

  return { ok: Object.keys(errors).length === 0, errors, value };
}

/**
 * ساخت رشته‌ی description برای زیبال.
 * چون طول فیلدها محدود شده، خروجی همیشه JSON معتبر و کوتاه است و هنگام verify
 * دوباره با JSON.parse خوانده می‌شود.
 */
export function buildDescription(buyer: BuyerInfo): string {
  return JSON.stringify(buyer);
}

/** خواندن اطلاعات خریدار از description برگشتی زیبال. */
export function parseDescription(description: unknown): BuyerInfo | null {
  if (typeof description !== 'string' || !description.trim()) return null;

  try {
    const parsed = JSON.parse(description) as Partial<BuyerInfo>;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      fullName: String(parsed.fullName ?? ''),
      mobile: String(parsed.mobile ?? ''),
      fatherName: String(parsed.fatherName ?? ''),
      nationalCode: String(parsed.nationalCode ?? ''),
      secondaryRequestNumber: String(parsed.secondaryRequestNumber ?? ''),
      address: String(parsed.address ?? ''),
      plaque: String(parsed.plaque ?? ''),
      purchasedNumber: String(parsed.purchasedNumber ?? ''),
    };
  } catch {
    return null;
  }
}
