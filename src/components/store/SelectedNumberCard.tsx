/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SelectedNumberCardProps {
  phoneNumber: string;
  typeLabel?: string;
  categoryLabel?: string;
}

/**
 * SelectedNumberCard: Exact replica of the golden hero number card in 002.png
 * Features:
 * - Bright gold background (#FFBE00)
 * - Text: "شماره انتخابی شما"
 * - Large Persian digits: ۰۹۰۰۲۸۴۱۴۳۵
 * - Badges: "دائمی" and "هم شماره"
 */
export const SelectedNumberCard: React.FC<SelectedNumberCardProps> = ({
  phoneNumber,
  typeLabel = 'دائمی',
  categoryLabel = 'هم شماره',
}) => {
  // Convert digits to Persian display format
  const toPersianDigits = (str: string) =>
    str.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);

  return (
    <div className="w-full max-w-[420px] bg-[#FFBE00] text-black rounded-3xl p-6 sm:p-7 shadow-[0_12px_36px_rgba(255,190,0,0.3)] flex flex-col items-center justify-center text-center select-none transition-all">
      <span className="text-xs sm:text-sm font-bold text-black/85 mb-1.5">
        شماره انتخابی شما
      </span>

      <div className="text-3xl sm:text-4xl font-black tracking-widest text-black my-1 font-mono">
        {toPersianDigits(phoneNumber)}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="bg-[#E5AA00] hover:bg-[#D99E00] text-black font-extrabold text-xs px-3.5 py-1 rounded-full transition-colors">
          {typeLabel}
        </span>
        <span className="bg-[#E5AA00] hover:bg-[#D99E00] text-black font-extrabold text-xs px-3.5 py-1 rounded-full transition-colors">
          {categoryLabel}
        </span>
      </div>
    </div>
  );
};
