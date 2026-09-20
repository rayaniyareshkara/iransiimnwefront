/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StoreBottomBarProps {
  onOpenRules: () => void;
  onOpenAddress: () => void;
  onOpenContact: () => void;
}

/**
 * StoreBottomBar: High-fidelity replica of the bottom footer pill bar in 001.png, 002.png, 003.png
 * Features:
 * - Gradient capsule from vivid red on the left to warm orange/amber on the right
 * - 3 crisp white action buttons aligned to the left: "تماس", "آدرس", "قوانین"
 * - Responsive container max-w-[420px] centered at bottom
 */
export const StoreBottomBar: React.FC<StoreBottomBarProps> = ({
  onOpenRules,
  onOpenAddress,
  onOpenContact,
}) => {
  return (
    <footer className="w-full max-w-[420px] px-2 py-4 select-none">
      <div className="w-full bg-gradient-to-r from-[#DC2626] via-[#EA580C] to-[#D97706] p-2.5 rounded-2xl shadow-[0_8px_25px_rgba(220,38,38,0.25)] flex items-center justify-start gap-2">
        {/* Contact Us button (تماس) */}
        <button
          type="button"
          onClick={onOpenContact}
          className="bg-white hover:bg-neutral-100 active:scale-95 text-black font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all focus:outline-hidden"
        >
          تماس
        </button>

        {/* Address button (آدرس) */}
        <button
          type="button"
          onClick={onOpenAddress}
          className="bg-white hover:bg-neutral-100 active:scale-95 text-black font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all focus:outline-hidden"
        >
          آدرس
        </button>

        {/* Rules & Regulations button (قوانین) */}
        <button
          type="button"
          onClick={onOpenRules}
          className="bg-white hover:bg-neutral-100 active:scale-95 text-black font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all focus:outline-hidden"
        >
          قوانین
        </button>
      </div>
    </footer>
  );
};
