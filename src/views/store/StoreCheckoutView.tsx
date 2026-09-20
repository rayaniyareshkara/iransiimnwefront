/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CreditCard, Shield, AlertCircle, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from '../../router';
import { StoreHeader } from '../../components/store/StoreHeader';
import { StoreStepIndicator } from '../../components/store/StoreStepIndicator';
import { CheckoutOrderSummary } from '../../components/store/CheckoutOrderSummary';
import { StoreBottomBar } from '../../components/store/StoreBottomBar';
import { ContentModal, ContentModalType } from '../../components/store/ContentModal';
import { startZibalPayment } from '../../services';
import { useNumberOffer } from '../../hooks';

interface FormValues {
  fullName: string;
  mobileNumber: string;
  fatherName: string;
  nationalId: string;
  secondaryMobile: string;
  fullAddress: string;
  buildingNumber: string;
}

interface FormErrors {
  fullName?: string;
  mobileNumber?: string;
  fatherName?: string;
  nationalId?: string;
  secondaryMobile?: string;
  fullAddress?: string;
  buildingNumber?: string;
}

export const StoreCheckoutView: React.FC = () => {
  const { query, navigate } = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [contentModalType, setContentModalType] = useState<ContentModalType>(null);

  // شماره و مبلغ از همان منبعی می‌آیند که مرحله‌ی قبل استفاده می‌کند.
  const phoneParam = query.get('number');
  const { offer, loading } = useNumberOffer(phoneParam);

  // Form State
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    mobileNumber: '',
    fatherName: '',
    nationalId: '',
    secondaryMobile: '',
    fullAddress: '',
    buildingNumber: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 2. Validate Form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Full name
    if (!values.fullName.trim()) {
      newErrors.fullName = 'وارد کردن نام و نام خانوادگی الزامی است.';
    } else if (values.fullName.trim().length < 3) {
      newErrors.fullName = 'نام و نام خانوادگی باید حداقل ۳ حرف باشد.';
    }

    // 2. Mobile number
    const cleanMobile = values.mobileNumber.replace(/\s+/g, '').trim();
    if (!cleanMobile) {
      newErrors.mobileNumber = 'وارد کردن شماره موبایل الزامی است.';
    } else if (!/^09\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'شماره موبایل معتبر نیست (مثال: 09123456789).';
    }

    // 3. Father name
    if (!values.fatherName.trim()) {
      newErrors.fatherName = 'وارد کردن نام پدر الزامی است.';
    }

    // 4. National ID
    const cleanNationalId = values.nationalId.replace(/\s+/g, '').trim();
    if (!cleanNationalId) {
      newErrors.nationalId = 'وارد کردن کد ملی الزامی است.';
    } else if (!/^\d{10}$/.test(cleanNationalId)) {
      newErrors.nationalId = 'کد ملی باید ۱۰ رقم باشد.';
    }

    // 5. Secondary phone (optional, but if filled must be valid)
    if (values.secondaryMobile.trim()) {
      const cleanSec = values.secondaryMobile.replace(/\s+/g, '').trim();
      if (!/^09\d{9}$/.test(cleanSec) && !/^\d{8,11}$/.test(cleanSec)) {
        newErrors.secondaryMobile = 'شماره تماس دوم نامعتبر است.';
      }
    }

    // 6. Address
    if (!values.fullAddress.trim()) {
      newErrors.fullAddress = 'وارد کردن آدرس محل سکونت الزامی است.';
    } else if (values.fullAddress.trim().length < 8) {
      newErrors.fullAddress = 'لطفاً آدرس دقیق را وارد فرمایید.';
    }

    // 7. Pelak / Building number
    if (!values.buildingNumber.trim()) {
      newErrors.buildingNumber = 'وارد کردن پلاک الزامی است.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 3. Submit and Initiate Payment Flow
  const handleSubmitAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validateForm()) {
      const firstErrorEl = document.querySelector('[data-error="true"]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!offer) return;

    try {
      setIsSubmitting(true);

      const result = await startZibalPayment({
        fullName: values.fullName.trim(),
        mobile: values.mobileNumber.trim(),
        fatherName: values.fatherName.trim(),
        nationalCode: values.nationalId.trim(),
        secondaryRequestNumber: values.secondaryMobile.trim(),
        address: values.fullAddress.trim(),
        plaque: values.buildingNumber.trim(),
        purchasedNumber: offer.phoneNumber,
        amount: offer.totalPrice,
      });

      if (result.status === 'redirect') {
        // از اینجا به بعد تصمیم با درگاه است؛ نتیجه از مسیر callback برمی‌گردد.
        window.location.href = result.paymentUrl;
        return;
      }

      if (result.status === 'invalid') {
        // اعتبارسنجی سرور مستقل از فرانت است؛ خطاهایش روی همان فیلدها می‌نشیند.
        setErrors({
          fullName: result.errors.fullName,
          mobileNumber: result.errors.mobile,
          fatherName: result.errors.fatherName,
          nationalId: result.errors.nationalCode,
          secondaryMobile: result.errors.secondaryRequestNumber,
          fullAddress: result.errors.address,
          buildingNumber: result.errors.plaque,
        });
        setPaymentError(result.errors.purchasedNumber ?? 'اطلاعات واردشده کامل یا معتبر نیست.');
        return;
      }

      if (result.status === 'price-changed') {
        setPaymentError(
          `${result.message} مبلغ جدید: ${result.amountToman.toLocaleString('fa-IR')} تومان.`
        );
        return;
      }

      setPaymentError(result.message);
    } catch (err: unknown) {
      console.error('Checkout submission failure:', err);
      setPaymentError('خطا در برقراری ارتباط با درگاه پرداخت. لطفاً مجدداً امتحان فرمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center font-['Vazirmatn',sans-serif]">
        <div className="w-10 h-10 border-3 border-[#FFBE00] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-gray-400">در حال دریافت اطلاعات فرم و درگاه...</span>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-center px-4 font-['Vazirmatn',sans-serif]">
        <div className="w-full max-w-[420px] bg-[#181A20] border border-[#272A33] rounded-2xl p-6 text-center">
          <p className="text-sm font-bold leading-7 text-gray-200">این شماره دیگر موجود نیست.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-black text-sm py-3 px-6 rounded-xl transition-all cursor-pointer"
          >
            بازگشت به جستجوی شماره
          </button>
        </div>
      </div>
    );
  }

  const finalAmount = offer.totalPrice;

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center justify-between font-['Vazirmatn',sans-serif] selection:bg-[#FFBE00] selection:text-black">
      {/* 1. Standard Header with Back Button */}
      <StoreHeader
        storeName="نمایندگی رسمی ایرانسل - مختارزاده"
        storeCode="09301002412"
        isOnline={true}
        showBackButton={true}
        onBack={() => navigate(`/store/details?number=${offer.phoneNumber}`)}
      />

      {/* 2. Main Content Container */}
      <main className="w-full max-w-[420px] px-4 py-3 flex-1 flex flex-col items-center space-y-4">
        {/* Step Indicator: اطلاعات (Completed), پرداخت (Active), تکمیل (Inactive) */}
        <StoreStepIndicator currentStep="payment" />

        {/* Dynamic Number & Order Summary */}
        <CheckoutOrderSummary
          phoneNumber={offer.phoneNumber}
          totalPrice={finalAmount}
          operator="ایرانسل"
          simType={offer.simTypeLabel}
        />

        {/* Checkout Form */}
        <form onSubmit={handleSubmitAndPay} className="w-full space-y-4" noValidate>
          {/* Card: Customer Information (اطلاعات خریدار) */}
          <div className="w-full bg-[#181A20] border border-[#272A33] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 select-none">
            <div className="flex items-center gap-2 border-b border-[#262934] pb-3">
              <span className="w-2 h-4 bg-[#FFBE00] rounded-xs inline-block" />
              <h2 className="text-white font-extrabold text-sm sm:text-base">
                اطلاعات خریدار
              </h2>
            </div>

            {/* Field 1: نام و نام خانوادگی */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                نام و نام خانوادگی <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={values.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="مثلاً: علی رضایی"
                data-error={!!errors.fullName}
                className={`w-full bg-[#121214] border ${
                  errors.fullName ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors`}
              />
              {errors.fullName && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Field 2: شماره موبایل (به نام صاحب سیم‌کارت) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                شماره موبایل (به نام صاحب سیم‌کارت) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={values.mobileNumber}
                onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                placeholder="0913XXXXXXXX"
                data-error={!!errors.mobileNumber}
                className={`w-full bg-[#121214] border ${
                  errors.mobileNumber ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white font-mono text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors text-right`}
              />
              {errors.mobileNumber && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.mobileNumber}</span>
                </p>
              )}
            </div>

            {/* Field 3: نام پدر */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                نام پدر <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={values.fatherName}
                onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                placeholder="مثلاً: علی"
                data-error={!!errors.fatherName}
                className={`w-full bg-[#121214] border ${
                  errors.fatherName ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors`}
              />
              {errors.fatherName && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fatherName}</span>
                </p>
              )}
            </div>

            {/* Field 4: کد ملی */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                کد ملی <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={10}
                value={values.nationalId}
                onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                placeholder="کد ملی ۱۰ رقمی"
                data-error={!!errors.nationalId}
                className={`w-full bg-[#121214] border ${
                  errors.nationalId ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white font-mono text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors text-right`}
              />
              {errors.nationalId && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.nationalId}</span>
                </p>
              )}
            </div>

            {/* Field 5: شماره درخواست دوم */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                شماره درخواست دوم <span className="text-gray-500 text-[11px] font-normal">(اختیاری)</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={values.secondaryMobile}
                onChange={(e) => handleFieldChange('secondaryMobile', e.target.value)}
                placeholder="شماره درخواست دوم"
                data-error={!!errors.secondaryMobile}
                className={`w-full bg-[#121214] border ${
                  errors.secondaryMobile ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white font-mono text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors text-right`}
              />
              {errors.secondaryMobile && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.secondaryMobile}</span>
                </p>
              )}
            </div>

            {/* Field 6: آدرس کامل */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                آدرس کامل <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={values.fullAddress}
                onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                placeholder="آدرس محل سکونت"
                data-error={!!errors.fullAddress}
                className={`w-full bg-[#121214] border ${
                  errors.fullAddress ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors resize-none`}
              />
              {errors.fullAddress && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fullAddress}</span>
                </p>
              )}
            </div>

            {/* Field 7: پلاک */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                پلاک <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={values.buildingNumber}
                onChange={(e) => handleFieldChange('buildingNumber', e.target.value)}
                placeholder="پلاک"
                data-error={!!errors.buildingNumber}
                className={`w-full bg-[#121214] border ${
                  errors.buildingNumber ? 'border-rose-500' : 'border-[#272A33] focus:border-[#FFBE00]'
                } rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm placeholder:text-gray-600 focus:outline-hidden transition-colors`}
              />
              {errors.buildingNumber && (
                <p className="text-rose-400 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.buildingNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Card: Payment Method (روش پرداخت) */}
          <div className="w-full bg-[#181A20] border border-[#272A33] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 select-none">
            <div className="flex items-center gap-2 border-b border-[#262934] pb-3">
              <span className="w-2 h-4 bg-[#FFBE00] rounded-xs inline-block" />
              <h2 className="text-white font-extrabold text-sm sm:text-base">
                روش پرداخت
              </h2>
            </div>

            {/* Online Payment Option - Preselected */}
            <div className="bg-[#1D1E24] border-2 border-[#FFBE00] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFBE00]/20 flex items-center justify-center text-[#FFBE00] shrink-0">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm">پرداخت آنلاین</div>
                  <div className="text-gray-400 text-[11px] mt-0.5">
                    پرداخت کامل از طریق درگاه بانکی
                  </div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className="w-5 h-5 rounded-full border-2 border-[#FFBE00] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBE00]" />
              </div>
            </div>
          </div>

          {/* Section: Final Price Row */}
          <div className="w-full bg-[#181A20] border border-[#272A33] rounded-2xl p-4 shadow-lg flex items-center justify-between select-none">
            <span className="text-white font-extrabold text-sm sm:text-base">
              مبلغ قابل پرداخت
            </span>
            <span className="text-[#FFBE00] font-black text-lg sm:text-xl font-mono tracking-tight">
              {finalAmount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-gray-300">تومان</span>
            </span>
          </div>

          {/* Error Banner if submit failed */}
          {paymentError && (
            <div className="bg-rose-950/70 border border-rose-600/50 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Confirm and Pay Button */}
          <div className="w-full pt-1 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-black font-black text-base sm:text-lg py-3.5 px-6 rounded-2xl shadow-[0_6px_28px_rgba(255,190,0,0.32)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>در حال انتقال به درگاه...</span>
                </>
              ) : (
                <>
                  <span>تایید و پرداخت</span>
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs select-none">
              <Shield className="w-3.5 h-3.5 text-gray-400 stroke-[2.2]" />
              <span>پرداخت امن از طریق درگاه بانکی شاپرک</span>
            </div>

            {/* Back Button Link */}
            <button
              type="button"
              onClick={() => navigate(`/store/details?number=${offer.phoneNumber}`)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center border border-[#272A33]"
            >
              بازگشت به مشخصات شماره
            </button>
          </div>
        </form>
      </main>

      {/* 3. Footer */}
      <StoreBottomBar
        onOpenRules={() => setContentModalType('rules')}
        onOpenAddress={() => setContentModalType('address')}
        onOpenContact={() => setContentModalType('contact')}
      />

      {/* Interactive Modal */}
      <ContentModal
        type={contentModalType}
        onClose={() => setContentModalType(null)}
      />
    </div>
  );
};
