/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PriceSummaryCardProps {
  /** مبلغ محصول پیش از مالیات (`netPrice` سرویس) */
  netPrice: number;
  /** مالیات بر ارزش افزوده (`vat` سرویس) */
  vat: number;
  /** بهای خود شماره (`numbers[].price` سرویس)؛ اغلب صفر است */
  numberPrice?: number;
  /** تخفیف محصول (`discount` سرویس) */
  discount?: number;
  /** جمع قابل پرداخت */
  totalPrice: number;
  isActivationFree?: boolean;
  shippingLabel?: string;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between text-xs sm:text-sm">
    <span className="text-gray-400 font-medium">{label}</span>
    {children}
  </div>
);

const Amount: React.FC<{ value: number }> = ({ value }) => (
  <span className="text-white font-bold font-mono tracking-wide">
    {value.toLocaleString('fa-IR')} تومان
  </span>
);

/**
 * PriceSummaryCard: ریز مبالغ بر اساس اجزای قیمتی که سرویس جستجو برمی‌گرداند
 * (netPrice / vat / discount / finalPrice) به‌علاوه‌ی بهای خود شماره.
 * هزینه‌ی فعال‌سازی و ارسال از تنظیمات فروشگاه می‌آید، نه از سرویس ایرانسل.
 */
export const PriceSummaryCard: React.FC<PriceSummaryCardProps> = ({
  netPrice,
  vat,
  numberPrice = 0,
  discount = 0,
  totalPrice,
  isActivationFree = true,
  shippingLabel = 'به صورت پس‌کرایه',
}) => {
  return (
    <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-5 shadow-lg space-y-3">
      <Row label="قیمت سیم‌کارت">
        <Amount value={netPrice} />
      </Row>

      <Row label="مالیات بر ارزش افزوده">
        <Amount value={vat} />
      </Row>

      {/* سرویس برای شماره‌های معمولی صفر برمی‌گرداند؛ فقط وقتی مبلغ دارد نمایش بده. */}
      {numberPrice > 0 && (
        <Row label="بهای شماره">
          <Amount value={numberPrice} />
        </Row>
      )}

      {discount > 0 && (
        <Row label="تخفیف">
          <span className="text-[#10B981] font-bold font-mono tracking-wide">
            {discount.toLocaleString('fa-IR')} تومان −
          </span>
        </Row>
      )}

      <Row label="هزینه فعال‌سازی">
        <span className="text-[#10B981] font-bold">
          {isActivationFree ? 'رایگان' : '۵۰,۰۰۰ تومان'}
        </span>
      </Row>

      <Row label="هزینه ارسال">
        <span className="text-[#10B981] font-bold">{shippingLabel}</span>
      </Row>

      <div className="h-px bg-[#262831] my-2" />

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-white font-extrabold text-sm sm:text-base">مبلغ نهایی</span>
        <span className="text-[#FFBE00] font-black text-lg sm:text-xl font-mono tracking-tight">
          {totalPrice.toLocaleString('fa-IR')} تومان
        </span>
      </div>
    </div>
  );
};
