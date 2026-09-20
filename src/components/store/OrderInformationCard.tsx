/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, Clock, ShieldCheck } from 'lucide-react';

interface OrderInformationCardProps {
  operator?: string;
  simType?: string;
  deliveryEstimate?: string;
  guaranteeText?: string;
}

/**
 * OrderInformationCard: Exact replica of the complementary information card in 002.png
 * Two columns:
 * - اپراتور: ایرانسل (آیکون CheckCircle زرد)
 * - تحویل: تا ۲۰ روز کاری (آیکون Clock زرد)
 * - نوع: دائمی (آیکون CheckCircle زرد)
 * - ضمانت اصالت (آیکون ShieldCheck زرد)
 */
export const OrderInformationCard: React.FC<OrderInformationCardProps> = ({
  operator = 'ایرانسل',
  simType = 'دائمی',
  deliveryEstimate = 'تا ۲۰ روز کاری',
  guaranteeText = 'ضمانت اصالت',
}) => {
  return (
    <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-4 sm:p-4.5 shadow-lg select-none">
      <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs sm:text-xs">
        {/* Row 1, Right in RTL: اپراتور */}
        <div className="flex items-center gap-1.5 text-gray-200 font-medium">
          <CheckCircle className="w-4 h-4 text-[#FFBE00] shrink-0 stroke-[2.2]" />
          <span>اپراتور: {operator}</span>
        </div>

        {/* Row 1, Left in RTL: نوع */}
        <div className="flex items-center gap-1.5 text-gray-200 font-medium">
          <CheckCircle className="w-4 h-4 text-[#FFBE00] shrink-0 stroke-[2.2]" />
          <span>نوع: {simType}</span>
        </div>

        {/* Row 2, Right in RTL: تحویل */}
        <div className="flex items-center gap-1.5 text-gray-200 font-medium">
          <Clock className="w-4 h-4 text-[#FFBE00] shrink-0 stroke-[2.2]" />
          <span>تحویل: {deliveryEstimate}</span>
        </div>

        {/* Row 2, Left in RTL: ضمانت اصالت */}
        <div className="flex items-center gap-1.5 text-gray-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#FFBE00] shrink-0 stroke-[2.2]" />
          <span>{guaranteeText}</span>
        </div>
      </div>
    </div>
  );
};
