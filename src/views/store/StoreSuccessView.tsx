/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Check, Search, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { useRouter } from '../../router';
import { StoreHeader } from '../../components/store/StoreHeader';
import { StoreStepIndicator } from '../../components/store/StoreStepIndicator';
import { StoreBottomBar } from '../../components/store/StoreBottomBar';
import { ContentModal, ContentModalType } from '../../components/store/ContentModal';
import { TrackingModal } from '../../components/store/TrackingModal';
import { fetchPaymentResult, PaymentResultBody } from '../../services';

export const StoreSuccessView: React.FC = () => {
  const { query, navigate } = useRouter();
  const [contentModalType, setContentModalType] = useState<ContentModalType>(null);
  const [trackingOpen, setTrackingOpen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [result, setResult] = useState<PaymentResultBody | null>(null);

  // سرور پس از تأیید پرداخت به این صفحه هدایت می‌کند و جزئیات تراکنش را تا
  // مدت کوتاهی نگه می‌دارد؛ آنچه در URL است فقط شناسه‌هاست.
  const trackId = query.get('trackId') || '';

  useEffect(() => {
    if (!trackId) return;

    let cancelled = false;
    fetchPaymentResult(trackId).then((data) => {
      if (!cancelled && data?.ok) setResult(data);
    });

    return () => {
      cancelled = true;
    };
  }, [trackId]);

  const orderNumber = result?.refNumber || query.get('orderId') || trackId || '—';
  const trackingCode = trackId || '—';
  const phoneNumber = result?.buyer?.purchasedNumber || query.get('number') || '';
  const amount = result?.amountToman ?? 0;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toPersianDigits = (numStr: string) =>
    numStr.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-between font-['Vazirmatn',sans-serif] selection:bg-[#FFBE00] selection:text-black">
      {/* 1. Header */}
      <StoreHeader
        storeName="نمایندگی رسمی ایرانسل - مختارزاده"
        storeCode="09301002412"
        isOnline={true}
        showBackButton={false}
      />

      {/* 2. Main Container */}
      <main className="w-full max-w-[420px] px-4 py-3 flex-1 flex flex-col items-center space-y-4">
        {/* Step Indicator: Complete */}
        <StoreStepIndicator currentStep="complete" />

        {/* Success Hero Card */}
        <div className="w-full bg-[#181A20] border border-[#272A33] rounded-3xl p-6 text-center space-y-4 shadow-xl select-none">
          {/* Glowing Green Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_28px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">پرداخت با موفقیت انجام شد</h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              سفارش سیم‌کارت شما با موفقیت در سامانه نمایندگی ثبت گردید و در صف بررسی قرار گرفت.
            </p>
          </div>

          {/* Details Breakdown */}
          <div className="bg-[#121214] border border-[#232630] rounded-2xl p-4 text-xs space-y-3 text-right">
            {/* Order Number */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">شماره سفارش:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(orderNumber, 'order')}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="کپی شماره سفارش"
                >
                  {copiedField === 'order' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-white font-mono font-bold tracking-wider" dir="ltr">
                  {orderNumber}
                </span>
              </div>
            </div>

            {/* Tracking Code */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">کد پیگیری:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(trackingCode, 'track')}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="کپی کد پیگیری"
                >
                  {copiedField === 'track' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-[#FFBE00] font-mono font-bold tracking-wider" dir="ltr">
                  {trackingCode}
                </span>
              </div>
            </div>

            <div className="h-px bg-[#20222a]" />

            {/* Selected Number */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">شماره انتخابی:</span>
              <span className="text-white font-mono font-bold" dir="ltr">
                {toPersianDigits(phoneNumber)}
              </span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">مبلغ پرداخت‌شده:</span>
              <span className="text-[#10B981] font-black font-mono">
                {amount.toLocaleString('fa-IR')} تومان
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400 font-medium">وضعیت سفارش:</span>
              <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-md">
                تأیید پرداخت اینترنتی
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setTrackingOpen(true)}
              className="w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-extrabold text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>پیگیری وضعیت سفارش</span>
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

        {/* Guarantee Banner */}
        <div className="w-full bg-[#181A20] border border-[#272A33] rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-gray-300 select-none">
          <ShieldCheck className="w-5 h-5 text-[#FFBE00] shrink-0" />
          <span className="text-[11px] leading-relaxed">
            اطلاعات احراز هویت و سیم‌کارت به صورت رسمی از طریق سامانه اپراتور ایرانسل فعال می‌گردد.
          </span>
        </div>
      </main>

      {/* 3. Footer */}
      <StoreBottomBar
        onOpenRules={() => setContentModalType('rules')}
        onOpenAddress={() => setContentModalType('address')}
        onOpenContact={() => setContentModalType('contact')}
      />

      {/* Modals */}
      <ContentModal
        type={contentModalType}
        onClose={() => setContentModalType(null)}
      />

      <TrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
      />
    </div>
  );
};
