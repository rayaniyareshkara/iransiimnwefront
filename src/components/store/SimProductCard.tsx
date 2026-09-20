/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface SimProductCardProps {
  title: string;
  /** فهرست امکانات، همان `info.fa.features` سرویس پس از حذف مقادیر null. */
  features: string[];
  thumbnailUrl?: string;
  simTypeLabel?: string;
}

/**
 * SimProductCard: مشخصات محصول سیم‌کارتِ متصل به شماره‌ی انتخابی.
 * محتوای این کارت کاملاً از پاسخ سرویس جستجو می‌آید (عنوان، تصویر و امکانات)؛
 * چیزی به‌صورت ثابت در کد نوشته نشده است.
 */
export const SimProductCard: React.FC<SimProductCardProps> = ({
  title,
  features,
  thumbnailUrl,
  simTypeLabel,
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  return (
    <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-start gap-3">
        {thumbnailUrl && !imageFailed && (
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-16 h-16 shrink-0 rounded-xl object-cover bg-[#121316] border border-[#272A33]"
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-white font-black text-sm sm:text-base leading-6">{title}</h3>
          {simTypeLabel && (
            <span className="inline-block mt-1.5 bg-[#3D3216] border border-[#6E5A26] text-[#FFBE00] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
              {simTypeLabel}
            </span>
          )}
        </div>
      </div>

      {features.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-[#262831] pt-4">
          {features.map((feature) => {
            // سرویس، سرشاخه‌ها را با «:» پایان می‌دهد؛ آن‌ها را بدون آیکون و
            // به‌عنوان عنوان بخش نمایش می‌دهیم.
            const isHeading = feature.trim().endsWith(':');

            return isHeading ? (
              <li
                key={feature}
                className="text-gray-400 text-xs font-bold pt-1 first:pt-0"
              >
                {feature}
              </li>
            ) : (
              <li key={feature} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#34D399] stroke-[2.6]" />
                <span className="text-gray-200 text-xs leading-6">{feature}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
