/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

interface StoreHeaderProps {
  storeName?: string;
  storeCode?: string;
  isOnline?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * StoreHeader: High-fidelity replica of the yellow header in 001.png, 002.png, 003.png
 * Features:
 * - Pure Irancell Gold/Yellow background (#FFBE00)
 * - Exact bold Persian typography: "نمایندگی رسمی ایرانسل - مختارزاده"
 * - Clickable phone link: "09301002412" that directly triggers phone call (tel:09301002412)
 * - Green "آنلاین" status indicator with pulsing dot
 * - Optional Back Button (دکمه برگشت به عقب) for sub-pages like /store/details
 * - Shadow gradient fade at the bottom
 */
export const StoreHeader: React.FC<StoreHeaderProps> = ({
  storeName = 'نمایندگی رسمی ایرانسل - مختارزاده',
  storeCode = '09301002412',
  isOnline = true,
  showBackButton = false,
  onBack,
}) => {
  // Normalize phone digits for tel: link
  const rawDigits = storeCode.replace(/[^\d]/g, '');
  const telHref = rawDigits ? `tel:${rawDigits}` : 'tel:09301002412';

  return (
    <header className="w-full bg-[#FFBE00] text-black pt-7 pb-6 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative z-20 flex flex-col items-center justify-center select-none">
      {/* Back Button (دکمه برگشت به عقب) if enabled */}
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          className="absolute right-3 sm:right-6 top-5 sm:top-6 bg-black/15 hover:bg-black/25 active:scale-95 text-black px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs sm:text-sm font-black transition-all cursor-pointer border border-black/15 shadow-xs"
          title="بازگشت به صفحه قبل"
        >
          <ArrowRight className="w-4 h-4 stroke-[3]" />
          <span>بازگشت</span>
        </button>
      )}

      {/* Representative Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-center text-black drop-shadow-xs">
        {storeName}
      </h1>

      {/* Clickable Representative Phone Number (کلیک برای تماس مستقیم) */}
      <a
        href={telHref}
        dir="ltr"
        className="group text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-black mt-1 font-mono hover:text-neutral-900 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer py-0.5 px-2 rounded-xl hover:bg-black/5"
        title="کلیک جهت تماس مستقیم با نمایندگی مختارزاده"
      >
        <Phone className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] text-black group-hover:rotate-12 transition-transform" />
        <span className="underline decoration-black/30 underline-offset-4 group-hover:decoration-black">
          {storeCode}
        </span>
      </a>

      {/* Online Status Indicator */}
      {isOnline && (
        <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm font-bold text-black/80">
          <span>آنلاین</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_8px_#10B981] inline-block animate-pulse"></span>
        </div>
      )}

      {/* Subtle bottom shadow edge */}
      <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
    </header>
  );
};
