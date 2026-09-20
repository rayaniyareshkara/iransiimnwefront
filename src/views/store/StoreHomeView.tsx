/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../../router';
import { StoreHeader } from '../../components/store/StoreHeader';
import { NumberSearchCard } from '../../components/store/NumberSearchCard';
import { StoreBottomBar } from '../../components/store/StoreBottomBar';
import { TrackingModal } from '../../components/store/TrackingModal';
import { ContentModal, ContentModalType } from '../../components/store/ContentModal';
import { NumberSearchResult } from '../../types';

export const StoreHomeView: React.FC = () => {
  const { navigate } = useRouter();
  const [trackingOpen, setTrackingOpen] = useState<boolean>(false);
  const [contentModalType, setContentModalType] = useState<ContentModalType>(null);

  /** شروع فرایند خرید: شماره‌ی انتخابی در URL مرحله‌ی اول قرار می‌گیرد. */
  const handleBuyNumber = (item: NumberSearchResult) => {
    navigate(`/store/details?number=${encodeURIComponent(item.phoneNumber)}`);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-between font-['Vazirmatn',sans-serif] selection:bg-[#FFBE00] selection:text-black">
      {/* 1. Yellow Official Irancell Header (100% replica of 001.png) */}
      <StoreHeader
        storeName="نمایندگی رسمی ایرانسل - مختارزاده"
        storeCode="09301002412"
        isOnline={true}
      />

      {/* 2. Main Centered Section: Number Search Card */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <NumberSearchCard
          onBuyNumber={handleBuyNumber}
          onOpenTracking={() => setTrackingOpen(true)}
        />
      </main>

      {/* 3. Bottom Capsule Footer: Contact, Address, Rules */}
      <StoreBottomBar
        onOpenRules={() => setContentModalType('rules')}
        onOpenAddress={() => setContentModalType('address')}
        onOpenContact={() => setContentModalType('contact')}
      />

      {/* Interactive Modal: Order Tracking (پیگیری) */}
      <TrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
      />

      {/* Interactive Modal: Content for Rules, Address, Contact */}
      <ContentModal
        type={contentModalType}
        onClose={() => setContentModalType(null)}
      />
    </div>
  );
};
