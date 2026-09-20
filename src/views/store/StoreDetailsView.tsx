/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Shield } from 'lucide-react';
import { useRouter } from '../../router';
import { StoreHeader } from '../../components/store/StoreHeader';
import { StoreStepIndicator } from '../../components/store/StoreStepIndicator';
import { SelectedNumberCard } from '../../components/store/SelectedNumberCard';
import { SimProductCard } from '../../components/store/SimProductCard';
import { PriceSummaryCard } from '../../components/store/PriceSummaryCard';
import { OrderInformationCard } from '../../components/store/OrderInformationCard';
import { StoreBottomBar } from '../../components/store/StoreBottomBar';
import { ContentModal, ContentModalType } from '../../components/store/ContentModal';
import { useNumberOffer } from '../../hooks';
import { pricingService } from '../../services';
import { PricingConfig } from '../../types';

export const StoreDetailsView: React.FC = () => {
  const { query, navigate } = useRouter();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [contentModalType, setContentModalType] = useState<ContentModalType>(null);

  // شماره از URL خوانده می‌شود تا رفرش و اشتراک‌گذاری لینک هم کار کند.
  const phoneParam = query.get('number');
  const { offer, loading, error } = useNumberOffer(phoneParam);

  useEffect(() => {
    // هزینه‌ی فعال‌سازی و ارسال بخشی از سرویس ایرانسل نیست و از تنظیمات
    // فروشگاه می‌آید.
    pricingService
      .getPricing()
      .then(setPricing)
      .catch((err) => console.error('Failed to load pricing config:', err));
  }, []);

  const handleContinue = () => {
    if (!offer) return;
    navigate(`/store/checkout?number=${encodeURIComponent(offer.phoneNumber)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center font-['Vazirmatn',sans-serif]">
        <div className="w-10 h-10 border-3 border-[#FFBE00] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-gray-400">در حال دریافت اطلاعات شماره و بسته...</span>
      </div>
    );
  }

  // شماره در دسترس نیست: یا لینک نامعتبر است، یا شماره بین جستجو و اینجا
  // فروخته شده، یا ارتباط با سرویس برقرار نشده.
  if (!offer) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center gap-4 px-4 font-['Vazirmatn',sans-serif]">
        <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-6 text-center">
          <p className="text-sm font-bold leading-7 text-gray-200">
            {error ?? 'این شماره دیگر موجود نیست.'}
          </p>
          {!error && phoneParam && (
            <p className="mt-2 text-xs text-gray-400">
              <span dir="ltr" className="inline-block font-mono">
                {phoneParam}
              </span>{' '}
              در حال حاضر قابل خرید نیست. شماره‌ی دیگری را جستجو کنید.
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-black text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>بازگشت به جستجوی شماره</span>
            <Search className="w-4 h-4 stroke-[2.8]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-between font-['Vazirmatn',sans-serif] selection:bg-[#FFBE00] selection:text-black">
      {/* 1. Header: Yellow background, branch name, phone and green online indicator matching 002.png */}
      <StoreHeader
        storeName="نمایندگی رسمی ایرانسل - مختارزاده"
        storeCode="09301002412"
        isOnline={true}
        showBackButton={true}
        onBack={() => navigate('/')}
      />

      {/* 2. Main Content Container: Constrained centered column */}
      <main className="w-full max-w-[420px] px-4 py-3 flex-1 flex flex-col items-center space-y-4">
        {/* Step Indicator: اطلاعات (Active), پرداخت, تکمیل */}
        <StoreStepIndicator currentStep="info" />

        {/* Golden Hero Selected Number Card */}
        <SelectedNumberCard
          phoneNumber={offer.phoneNumber}
          typeLabel={offer.simTypeLabel}
          categoryLabel="ایرانسل"
        />

        {/* Product title, thumbnail and feature list — all straight from the API */}
        <SimProductCard
          title={offer.title}
          features={offer.features}
          thumbnailUrl={offer.thumbnailUrl}
          simTypeLabel={offer.simTypeLabel}
        />

        {/* Price Breakdown Card */}
        <PriceSummaryCard
          netPrice={offer.netPrice}
          vat={offer.vat}
          numberPrice={offer.numberPrice}
          discount={offer.discount}
          totalPrice={offer.totalPrice}
          isActivationFree={pricing?.isActivationFree ?? true}
          shippingLabel="به صورت پس‌کرایه"
        />

        {/* Complementary Order Information Card */}
        <OrderInformationCard
          operator="ایرانسل"
          simType={offer.simTypeLabel}
          deliveryEstimate="تا ۲۰ روز کاری"
          guaranteeText="ضمانت اصالت"
        />

        {/* Continue to Checkout Button */}
        <div className="w-full pt-2">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-black text-base sm:text-lg py-3.5 px-6 rounded-2xl shadow-[0_6px_28px_rgba(255,190,0,0.32)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ادامه خرید</span>
            <ArrowLeft className="w-5 h-5 stroke-[2.8] text-black" />
          </button>

          {/* Bank Security Notice Text */}
          <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mt-3 select-none">
            <Shield className="w-3.5 h-3.5 text-gray-400 stroke-[2.2]" />
            <span>پرداخت امن از طریق درگاه بانکی</span>
          </div>

          {/* Secondary Back Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center border border-[#272A33]"
          >
            بازگشت به جستجوی شماره و صفحه اصلی
          </button>
        </div>
      </main>

      {/* 3. Footer: Pill gradient with rules, address, contact */}
      <StoreBottomBar
        onOpenRules={() => setContentModalType('rules')}
        onOpenAddress={() => setContentModalType('address')}
        onOpenContact={() => setContentModalType('contact')}
      />

      {/* Interactive Content Modal */}
      <ContentModal
        type={contentModalType}
        onClose={() => setContentModalType(null)}
      />
    </div>
  );
};
