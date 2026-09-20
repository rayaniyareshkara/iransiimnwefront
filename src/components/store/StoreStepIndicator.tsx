/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';

export type StepType = 'info' | 'payment' | 'complete';

interface StoreStepIndicatorProps {
  currentStep?: StepType;
}

/**
 * StoreStepIndicator: Exact replica of the step indicator in 002.png & 003.png
 * In RTL layout:
 * - 1st child (Right side in RTL): "اطلاعات"
 * - 2nd child (Center in RTL): "پرداخت"
 * - 3rd child (Left side in RTL): "تکمیل"
 */
export const StoreStepIndicator: React.FC<StoreStepIndicatorProps> = ({
  currentStep = 'info',
}) => {
  const isStep1Done = currentStep === 'payment' || currentStep === 'complete';
  const isStep2Active = currentStep === 'payment';
  const isStep2Done = currentStep === 'complete';
  const isStep3Active = currentStep === 'complete';

  return (
    <div className="w-full max-w-[420px] py-3.5 select-none">
      {/* Stepper Dots & Horizontal Track */}
      <div className="flex items-center justify-between px-8 relative mb-2">
        {/* Base Track Line */}
        <div className="absolute top-1/2 -translate-y-1/2 right-12 left-12 h-[2px] bg-[#272A33] -z-0" />

        {/* Active Track Highlight: Right half (between Step 1 and Step 2) */}
        {isStep1Done && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 right-12 h-[2px] bg-[#FFBE00] -z-0 transition-all ${
              isStep2Done ? 'left-12' : 'left-1/2'
            }`}
          />
        )}

        {/* Step 1 (Right in RTL): اطلاعات */}
        <div className="relative z-10 flex flex-col items-center">
          {isStep1Done ? (
            <div className="w-4 h-4 rounded-full bg-[#FFBE00] flex items-center justify-center text-black shadow-[0_0_8px_rgba(255,190,0,0.4)]">
              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
            </div>
          ) : (
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                currentStep === 'info'
                  ? 'bg-[#FFBE00] shadow-[0_0_10px_rgba(255,190,0,0.5)] ring-4 ring-[#FFBE00]/20'
                  : 'bg-[#272A33]'
              }`}
            />
          )}
        </div>

        {/* Step 2 (Center in RTL): پرداخت */}
        <div className="relative z-10 flex flex-col items-center">
          {isStep2Done ? (
            <div className="w-4 h-4 rounded-full bg-[#FFBE00] flex items-center justify-center text-black shadow-[0_0_8px_rgba(255,190,0,0.4)]">
              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
            </div>
          ) : (
            <div
              className={`rounded-full transition-all ${
                isStep2Active
                  ? 'w-3.5 h-3.5 bg-[#FFBE00] shadow-[0_0_10px_rgba(255,190,0,0.5)] ring-4 ring-[#FFBE00]/20'
                  : 'w-3 h-3 bg-[#272A33]'
              }`}
            />
          )}
        </div>

        {/* Step 3 (Left in RTL): تکمیل */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`rounded-full transition-all ${
              isStep3Active
                ? 'w-3.5 h-3.5 bg-[#FFBE00] shadow-[0_0_10px_rgba(255,190,0,0.5)] ring-4 ring-[#FFBE00]/20'
                : 'w-3 h-3 bg-[#272A33]'
            }`}
          />
        </div>
      </div>

      {/* Stepper Labels */}
      <div className="flex items-center justify-between text-xs px-5">
        {/* Step 1 (Right in RTL): اطلاعات */}
        <span
          className={`transition-colors ${
            currentStep === 'info'
              ? 'font-black text-sm text-[#FFBE00]'
              : isStep1Done
              ? 'font-bold text-gray-300'
              : 'text-gray-500'
          }`}
        >
          اطلاعات
        </span>

        {/* Step 2 (Center in RTL): پرداخت */}
        <span
          className={`transition-colors ${
            isStep2Active
              ? 'font-black text-sm text-[#FFBE00]'
              : isStep2Done
              ? 'font-bold text-gray-300'
              : 'text-gray-500'
          }`}
        >
          پرداخت
        </span>

        {/* Step 3 (Left in RTL): تکمیل */}
        <span
          className={`transition-colors ${
            isStep3Active
              ? 'font-black text-sm text-[#FFBE00]'
              : 'text-gray-500'
          }`}
        >
          تکمیل
        </span>
      </div>
    </div>
  );
};
