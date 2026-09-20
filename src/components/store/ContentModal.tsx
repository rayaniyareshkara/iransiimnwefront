/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { contentService, settingsService } from '../../services';
import { StoreContent, StoreSettings } from '../../types';

export type ContentModalType = 'rules' | 'address' | 'contact' | null;

interface ContentModalProps {
  type: ContentModalType;
  onClose: () => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({ type, onClose }) => {
  const [content, setContent] = useState<StoreContent | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (type) {
      contentService.getContent().then(setContent);
      settingsService.getSettings().then(setSettings);
    }
  }, [type]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#181A20] border border-[#2B2E38] rounded-3xl p-6 shadow-2xl text-white relative flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-5 pb-3 border-b border-[#2A2D36]">
          <h3 className="text-lg sm:text-xl font-black text-[#FFBE00]">
            {type === 'rules' && 'قوانین و مقررات خرید سیم‌کارت'}
            {type === 'address' && 'آدرس و موقعیت نمایندگی'}
            {type === 'contact' && 'اطلاعات تماس و پشتیبانی'}
          </h3>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-gray-300 pr-1">
          {type === 'rules' && (
            <div className="space-y-3">
              <div className="bg-[#121316] p-4 rounded-2xl border border-[#282B33] space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>احراز هویت قانونی</span>
                </div>
                <p className="text-gray-300 leading-6 whitespace-pre-line">
                  {content?.rules || 'ثبت سیم‌کارت مطابق مصوبات رگولاتوری با کدملی معتبر خریدار انجام می‌گردد.'}
                </p>
              </div>

              <div className="bg-[#121316] p-4 rounded-2xl border border-[#282B33] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>ضمانت فعال‌سازی و سند</span>
                </div>
                <p className="text-gray-300 leading-6">
                  {settings?.authenticityGuaranteeText || 'تمامی خطوط با سند رسمی و انتقال مالکیت قانونی تحویل می‌گردند.'}
                </p>
              </div>
            </div>
          )}

          {type === 'address' && (
            <div className="space-y-3">
              <div className="bg-[#121316] p-4 rounded-2xl border border-[#282B33] space-y-2.5">
                <div className="flex items-center gap-2 text-[#FFBE00] font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>نشانی نمایندگی رسمی</span>
                </div>
                <p className="text-white font-medium text-sm leading-6">
                  {settings?.address || 'استان تهران - شهرستان ملارد بخش مرکزی - شهر ملارد خیابان کسری ۲۰ متری مارلیک - بلوار رسول اکرم پلاک ۱۷۳ طبقه ۱'}
                </p>
              </div>

              <div className="bg-[#121316] p-4 rounded-2xl border border-[#282B33] space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>ساعات کاری و پاسخگویی</span>
                </div>
                <p className="text-gray-300 font-medium">
                  {settings?.workingHours || 'همه روزه از ساعت ۹:۰۰ الی ۲۱:۰۰'}
                </p>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-3">
              <div className="bg-[#121316] p-4 rounded-2xl border border-[#282B33] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Phone className="w-4 h-4" />
                  <span>خطوط پشتیبانی نمایندگی</span>
                </div>

                <div className="flex justify-between items-center bg-[#1A1C22] p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">تلفن ثابت نمایندگی:</span>
                  <a
                    href="tel:02165196051"
                    className="text-[#FFBE00] font-mono font-black text-base hover:underline"
                  >
                    ۰۲۱۶۵۱۹۶۰۵۱
                  </a>
                </div>

                <div className="flex justify-between items-center bg-[#1A1C22] p-3 rounded-xl">
                  <span className="text-gray-400 text-xs">تلفن همراه و پیام‌رسان:</span>
                  <a
                    href="tel:09301002412"
                    className="text-[#FFBE00] font-mono font-black text-base hover:underline"
                  >
                    ۰۹۳۰۱۰۰۲۴۱۲
                  </a>
                </div>
              </div>

              <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-center text-xs text-amber-200">
                پاسخگویی در تمامی ساعات کاری به صورت تلفنی و حضوری برقرار است.
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#FFBE00] hover:bg-[#E5AA00] text-black font-extrabold py-3 rounded-xl text-sm transition-all"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
