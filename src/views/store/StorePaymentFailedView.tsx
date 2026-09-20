/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XCircle, RefreshCw, ArrowRight, Phone, AlertTriangle } from 'lucide-react';
import { useRouter } from '../../router';
import { StoreHeader } from '../../components/store/StoreHeader';
import { StoreStepIndicator } from '../../components/store/StoreStepIndicator';
import { StoreBottomBar } from '../../components/store/StoreBottomBar';
import { ContentModal, ContentModalType } from '../../components/store/ContentModal';

export const StorePaymentFailedView: React.FC = () => {
  const { query, navigate } = useRouter();
  const [contentModalType, setContentModalType] = useState<ContentModalType>(null);

  const phoneNumber = query.get('number') || '09002841435';
  const reason =
    query.get('reason') ||
    'تراکنش توسط کاربر لغو گردید یا درگاه پرداخت با خطا مواجه شد.';

  const handleRetry = () => {
    navigate(`/store/checkout?number=${encodeURIComponent(phoneNumber)}`);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-between font-['Vazirmatn',sans-serif] selection:bg-[#FFBE00] selection:text-black">
      {/* 1. Header */}
      <StoreHeader
        storeName="نمایندگی رسمی ایرانسل - مختارزاده"
        storeCode="09301002412"
        isOnline={true}
        showBackButton={true}
        onBack={handleRetry}
      />

      {/* 2. Main Container */}
      <main className="w-full max-w-[420px] px-4 py-3 flex-1 flex flex-col items-center space-y-4">
        {/* Step Indicator: Payment stage */}
        <StoreStepIndicator currentStep="payment" />

        {/* Failed Hero Card */}
        <div className="w-full bg-[#181A20] border border-[#272A33] rounded-3xl p-6 text-center space-y-4 shadow-xl select-none">
          {/* Glowing Red Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_28px_rgba(244,63,94,0.35)]">
            <XCircle className="w-9 h-9 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">پرداخت ناموفق بود</h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              {reason}
            </p>
          </div>

          {/* Refund Notice Box */}
          <div className="bg-[#121214] border border-amber-500/20 rounded-2xl p-4 text-xs space-y-2 text-right">
            <div className="flex items-center gap-1.5 text-[#FFBE00] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>کسر وجه از حساب</span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              در صورتی که مبلغی از حساب شما کسر گردیده است، ظرف مدت حداکثر ۷۲ ساعت توسط سامانه شاپرک به صورت خودکار به حسابتان عودت داده خواهد شد.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>تلاش مجدد برای پرداخت</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-[#242731] hover:bg-[#2F3340] active:scale-[0.98] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به صفحه اصلی فروشگاه</span>
            </button>
          </div>
        </div>

        {/* Support Help Box */}
        <div className="w-full bg-[#181A20] border border-[#272A33] rounded-2xl p-3.5 flex items-center justify-between text-xs text-gray-300 select-none">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#FFBE00]" />
            <span>نیاز به راهنمایی دارید؟</span>
          </div>
          <a
            href="tel:09301002412"
            className="text-[#FFBE00] font-mono font-bold hover:underline"
          >
            09301002412
          </a>
        </div>
      </main>

      {/* 3. Footer */}
      <StoreBottomBar
        onOpenRules={() => setContentModalType('rules')}
        onOpenAddress={() => setContentModalType('address')}
        onOpenContact={() => setContentModalType('contact')}
      />

      {/* Content Modal */}
      <ContentModal
        type={contentModalType}
        onClose={() => setContentModalType(null)}
      />
    </div>
  );
};
