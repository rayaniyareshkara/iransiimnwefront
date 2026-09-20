/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';

interface CheckoutOrderSummaryProps {
  phoneNumber: string;
  totalPrice: number;
  operator?: string;
  simType?: string;
}

/**
 * CheckoutOrderSummary: Compact order & number summary for the top of the Checkout screen.
 * Displays the chosen number and final payable amount dynamically.
 */
export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  phoneNumber,
  totalPrice,
  operator = 'ایرانسل',
  simType = 'دائمی',
}) => {
  const toPersianDigits = (numStr: string) =>
    numStr.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);

  return (
    <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-4 shadow-lg select-none space-y-3">
      {/* Header row: Title and Operator Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">خلاصه شماره انتخابی</span>
        <div className="flex items-center gap-1.5">
          <span className="bg-[#242731] text-gray-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
            {simType}
          </span>
          <span className="bg-[#FFBE00]/15 text-[#FFBE00] text-[11px] font-bold px-2 py-0.5 rounded-md">
            {operator}
          </span>
        </div>
      </div>

      {/* Main row: Phone number & Price */}
      <div className="bg-[#121214] border border-[#232630] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFBE00]/15 border border-[#FFBE00]/30 flex items-center justify-center text-[#FFBE00]">
            <Phone className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xs text-gray-400">شماره سیم‌کارت</div>
            <div className="text-white font-mono font-black text-base sm:text-lg tracking-wider" dir="ltr">
              {toPersianDigits(phoneNumber)}
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="text-xs text-gray-400">مبلغ سفارش</div>
          <div className="text-[#FFBE00] font-black text-sm sm:text-base font-mono">
            {totalPrice.toLocaleString('fa-IR')} <span className="text-xs font-normal text-gray-300">تومان</span>
          </div>
        </div>
      </div>

      {/* Assurance Note */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>تخصیص رسمی و فعال‌سازی سیم‌کارت به نام خریدار</span>
      </div>
    </div>
  );
};
