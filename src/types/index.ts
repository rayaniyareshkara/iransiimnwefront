/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// STORE & CUSTOMER TYPES
// ==========================================

export interface AvailableNumber {
  id: string;
  phoneNumber: string; // e.g. 09002841435
  formattedNumber: string; // e.g. 0900 284 1435
  type: 'permanent' | 'credit'; // دائمی یا اعتباری
  price: number; // قیمت سیمکارت به تومان
  category: 'golden' | 'silver' | 'bronze' | 'normal';
  hasFreeCallGift: boolean;
  freeCallMinutes: number; // e.g. 900 دقیقه
  hasFreeInternetGift: boolean;
  freeInternetGb: number; // e.g. 90 گیگابایت
  operator: string; // ایرانسل
  isAvailable: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  fatherName: string;
  nationalId: string;
  secondaryMobile?: string;
  province?: string;
  city?: string;
  fullAddress: string;
  postalCode?: string;
  buildingNumber?: string; // پلاک
  unit?: string;
}

export type PaymentMethod = 'online' | 'card_to_card' | 'wallet';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type OrderStatus =
  | 'created'
  | 'payment_confirmed'
  | 'processing'
  | 'packaging'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  refNumber?: string;
  paidAt?: string;
  gatewayName?: string;
}

export interface OrderItem {
  numberId: string;
  phoneNumber: string;
  formattedNumber: string;
  type: 'permanent' | 'credit';
  price: number;
  giftInternetGb: number;
  giftCallMinutes: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  description?: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. IRN-98421
  trackingCode: string; // e.g. TRK-481920
  customer: Customer;
  item: OrderItem;
  basePrice: number;
  serviceFee: number;
  shippingPrice: number;
  shippingMethodTitle: string;
  discountAmount: number;
  discountCode?: string;
  totalPrice: number;
  payment: PaymentInfo;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ==========================================
// INTERNET PACKAGES
// ==========================================

export type PackageValidity = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';

export interface InternetPackage {
  id: string;
  title: string; // e.g. "بسته ۳۰ گیگابایت یک‌ماهه"
  volume: number; // e.g. 30
  volumeUnit: 'MB' | 'GB'; // e.g. "GB"
  validityDays: number; // e.g. 30
  validityLabel: string; // e.g. "یک ماهه"
  price: number; // قیمت به تومان
  discountPrice?: number;
  description: string;
  isActive: boolean;
  isPopular?: boolean;
  features?: string[];
  createdAt: string;
}

// ==========================================
// PRICING CONFIGURATION
// ==========================================

export interface PricingConfig {
  id: string;
  baseSimPrice: number; // قیمت پایه سیمکارت
  saleSimPrice: number; // قیمت فروش سیمکارت
  activationFee: number; // هزینه فعال‌سازی (معمولا 0 یا رایگان)
  serviceFee: number; // هزینه خدمات و ارزش افزوده
  defaultDiscountPercent: number; // درصد تخفیف پیش‌فرض
  isServiceFeeActive: boolean;
  isActivationFree: boolean;
  shippingIncluded: boolean;
  updatedAt: string;
}

// ==========================================
// SHIPPING MANAGEMENT
// ==========================================

export interface ShippingMethod {
  id: string;
  title: string; // e.g. "پست پیشتاز سراسری", "ارسال با پیک اکسپرس"
  description: string;
  price: number; // 0 for free/pay-on-delivery
  isPayOnDelivery: boolean; // پس‌کرایه
  estimatedDays: string; // e.g. "۲ تا ۴ روز کاری"
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// DISCOUNT CODES
// ==========================================

export type DiscountType = 'percentage' | 'fixed_amount';

export interface Discount {
  id: string;
  code: string; // e.g. "NOROOZ1404"
  type: DiscountType;
  amount: number; // 20 (%) or 50000 (Toman)
  minOrderAmount: number; // حداقل مبلغ سفارش
  maxUsageCount: number; // سقف کل استفاده
  currentUsageCount: number; // تعداد استفاده شده تاکنون
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// ==========================================
// STORE SETTINGS & CONTACT
// ==========================================

export interface StoreSettings {
  storeName: string; // "نمایندگی رسمی ایرانسل - خسروییکی"
  storeCode: string; // "۹۳۶۵۶۹۴۲۱۹"
  officialOwner: string; // "خسروییکی"
  supportPhone: string; // "۰۲۱۶۵۱۹۶۰۵۱"
  supportMobile: string; // "۰۹۳۶۵۶۹۴۲۱۹"
  address: string; // "کرج، فردیس، خیابان اصلی، نبش خیابان نهم، نمایندگی ایرانسل"
  workingHours: string; // "شنبه تا پنجشنبه ۹:۰۰ الی ۲۱:۰۰"
  isStoreOnline: boolean;
  deliveryGuaranteeText: string; // "تحویل: تا ۲ تا ۳ روز کاری"
  authenticityGuaranteeText: string; // "ضمانت اصالت ۱۰۰٪ خطوط و نمایندگی رسمی"
  paymentNotice: string; // "در صورت عدم موفقیت در پرداخت از طریق درگاه با شماره های پشتیبانی ما تماس بگیرید"
}

// ==========================================
// CONTENT MANAGEMENT
// ==========================================

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface StoreContent {
  aboutUs: string;
  rules: string;
  faqList: FaqItem[];
  contactUs: {
    address: string;
    phone: string;
    mobile: string;
    email: string;
    postalCode: string;
    googleMapsUrl?: string;
  };
}

// ==========================================
// ADMIN USERS
// ==========================================

export type AdminRole = 'Admin' | 'Manager' | 'Support';

export interface AdminUser {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string;
  avatarUrl?: string;
  createdAt: string;
}

// ==========================================
// DASHBOARD & REPORTS
// ==========================================

export interface DashboardMetrics {
  todaySales: number;
  monthSales: number;
  totalSales: number;
  totalOrders: number;
  newOrdersCount: number;
  pendingPaymentCount: number;
  inShippingCount: number;
  deliveredCount: number;
}

export interface SalesChartDataPoint {
  date: string;
  label: string;
  salesAmount: number;
  orderCount: number;
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  statusLabel: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ReportsFilter {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
}

// ==========================================
// NUMBER SEARCH API (shop.irancell.ir)
// ==========================================

/** بخش محلی‌سازی‌شده‌ی پاسخ API (کلیدهای `en` و `fa`). */
export interface IrancellLocalizedInfo {
  message?: string;
  name?: string;
  title?: string;
  description?: string;
  descriptionShort?: string;
  features?: (string | null)[];
  thumbnailUrl?: string;
}

export interface IrancellLocalized<T = IrancellLocalizedInfo> {
  en: T;
  fa: T;
}

/** یک شماره در `result.numbers`؛ `msisdn` با جداکننده می‌آید: «900 - 120 - 8591». */
export interface IrancellApiNumber {
  msisdn: string;
  pool: string;
  price: number;
}

/** یک محصول در `result.products` که با کلید `pool` به شماره وصل می‌شود. */
export interface IrancellApiProduct {
  id: number;
  addons: string[];
  discount: number;
  finalPrice: number;
  netPrice: number;
  price: number;
  vat: number;
  isDiscounted: boolean;
  sim_type: string;
  format_pattern: string | null;
  info: IrancellLocalized;
  addon_numberSelection?: {
    id: number;
    info: IrancellLocalized;
    max_msisdn_count: number;
    price_display: boolean;
  };
}

/** پاسخ خام سرویس جستجوی شماره. */
export interface IrancellNumberSearchResponse {
  correlation_id: string;
  info: IrancellLocalized;
  result: {
    numbers: IrancellApiNumber[];
    products: Record<string, IrancellApiProduct>;
    similar_numbers: boolean;
  };
  result_code: number;
}

/**
 * شکل نرمال‌شده‌ی یک شماره به‌همراه محصولش.
 * تمام اطلاعاتی که مراحل خرید لازم دارند از همین ساختار خوانده می‌شود.
 */
export interface NumberSearchResult {
  /** شناسه‌ی یکتا برای key در لیست (msisdn + pool). */
  id: string;
  /** شماره‌ی ملی بدون صفر: 9001208547 */
  msisdn: string;
  /** شماره‌ی کامل با صفر: 09001208547 — همین در URL قرار می‌گیرد. */
  phoneNumber: string;
  /** نمایش خوانا: «0900 120 8547» */
  formattedNumber: string;

  // ---- محصول متصل به شماره (از طریق کلید pool) ----
  pool: string;
  productId: number;
  /** عنوان فارسی: «سیم‌کارت دائمی 0900 - تک ستاره» */
  title: string;
  name: string;
  /** مقدار خام سرویس: POSTPAID / PREPAID */
  simType: string;
  /** برچسب فارسی متناظر: دائمی / اعتباری */
  simTypeLabel: string;
  thumbnailUrl?: string;
  /** فهرست امکانات؛ مقادیر null سرویس حذف شده‌اند. */
  features: string[];

  // ---- قیمت‌ها (تومان) ----
  /** بهای خود شماره (اغلب صفر است) */
  numberPrice: number;
  /** مبلغ محصول پیش از مالیات */
  netPrice: number;
  /** مالیات بر ارزش افزوده */
  vat: number;
  discount: number;
  isDiscounted: boolean;
  /** بهای نهایی محصول با احتساب مالیات */
  productPrice: number;
  /** جمع قابل پرداخت = numberPrice + productPrice */
  totalPrice: number;
}

/** خروجی یک جستجو، همراه با اینکه نتایج «دقیق» هستند یا «مشابه». */
export interface NumberSearchOutcome {
  /** الگوی جستجوشده به شکل ملی: 9001201156 */
  pattern: string;
  /** همان الگو به شکل خوانا: «0900 120 1156» */
  formattedPattern: string;
  results: NumberSearchResult[];
  /** true یعنی شماره‌ی درخواستی موجود نیست و لیست، پیشنهادهای مشابه است. */
  isSimilar: boolean;
}
