/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import {
  NUMBER_PART1_LENGTH,
  NUMBER_PART2_LENGTH,
  numberSearchService,
  toLatinDigits,
} from '../../services';
import { NumberSearchOutcome, NumberSearchResult } from '../../types';

interface NumberSearchCardProps {
  onBuyNumber: (result: NumberSearchResult) => void;
  onOpenTracking: () => void;
}

/** پیش‌شماره‌های ایرانسل که در سلکت‌باکس نمایش داده می‌شوند. */
export const IRANCELL_PREFIXES = [
  '900', '901', '902', '903', '904', '905',
  '930', '933', '935', '936', '937', '938', '939',
] as const;

/**
 * NumberSearchCard: انتخاب پیش‌شماره + ورود کامل شماره.
 * ورودی به سه بخش تقسیم شده است: پیش‌شماره (سلکت)، ۳ رقم میانی و ۴ رقم پایانی.
 * تا زمانی که هر دو بخش رقمی کامل نشوند جستجو انجام نمی‌شود.
 */
export const NumberSearchCard: React.FC<NumberSearchCardProps> = ({
  onBuyNumber,
  onOpenTracking,
}) => {
  const [prefix, setPrefix] = useState<string>(IRANCELL_PREFIXES[0]);
  const [part1, setPart1] = useState<string>('');
  const [part2, setPart2] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<NumberSearchOutcome | null>(null);

  const part1Ref = useRef<HTMLInputElement>(null);
  const part2Ref = useRef<HTMLInputElement>(null);

  const isComplete =
    part1.length === NUMBER_PART1_LENGTH && part2.length === NUMBER_PART2_LENGTH;

  // هر تغییری در ورودی، نتیجه‌ی قبلی را بی‌اعتبار می‌کند.
  const resetOutcome = () => {
    if (error) setError(null);
    if (outcome) setOutcome(null);
  };

  const handlePart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = toLatinDigits(e.target.value).slice(0, NUMBER_PART1_LENGTH);
    setPart1(digits);
    resetOutcome();
    // پر شدن بخش اول، فوکوس را به بخش بعدی می‌برد.
    if (digits.length === NUMBER_PART1_LENGTH) part2Ref.current?.focus();
  };

  const handlePart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPart2(toLatinDigits(e.target.value).slice(0, NUMBER_PART2_LENGTH));
    resetOutcome();
  };

  // Backspace روی فیلد خالی، فوکوس را به فیلد قبلی برمی‌گرداند.
  const handlePart2KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && part2 === '') part1Ref.current?.focus();
  };

  /**
   * چسباندن یک شماره کامل (مثلاً 09001208591) در هر یک از فیلدها،
   * پیش‌شماره و هر دو بخش را با هم پر می‌کند.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = toLatinDigits(e.clipboardData.getData('text'));
    if (digits.length < 10) return;

    const national = digits.replace(/^(?:0098|98|0)/, '');
    const pasted = national.slice(0, 3);
    if (!IRANCELL_PREFIXES.includes(pasted as typeof IRANCELL_PREFIXES[number])) return;

    e.preventDefault();
    setPrefix(pasted);
    setPart1(national.slice(3, 3 + NUMBER_PART1_LENGTH));
    setPart2(national.slice(6, 6 + NUMBER_PART2_LENGTH));
    resetOutcome();
    part2Ref.current?.focus();
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isComplete) {
      setOutcome(null);
      setError('برای جستجو باید تمام ارقام شماره را وارد کنید.');
      (part1.length < NUMBER_PART1_LENGTH ? part1Ref : part2Ref).current?.focus();
      return;
    }

    setSearching(true);
    setError(null);
    setOutcome(null);

    try {
      setOutcome(await numberSearchService.search(prefix, part1, part2));
    } catch (err) {
      console.error('Number search failed:', err);
      setError('خطا در برقراری ارتباط با سامانه. لطفاً دوباره تلاش کنید.');
    } finally {
      setSearching(false);
    }
  };

  const fieldClass =
    'h-14 bg-[#121316] border border-[#2A2D36] text-white text-center text-xl font-bold rounded-2xl placeholder:text-gray-500/70 focus:outline-hidden focus:border-[#FFBE00] focus:ring-2 focus:ring-[#FFBE00]/20 transition-all font-mono tracking-[0.35em] shadow-inner';

  return (
    <div className="w-full max-w-[720px] bg-[#181A20] border border-[#272A33] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
      {/* عنوان و راهنما */}
      <h2 className="text-white text-right font-black text-xl sm:text-2xl tracking-tight">
        جستجوی شماره موبایل
      </h2>
      <p className="mt-2 text-right text-sm text-gray-400">
        پیش‌شماره را انتخاب کنید و تمام ارقام شماره را وارد کنید.
      </p>

      <form onSubmit={handleSearchSubmit} className="mt-6">
        {/* ردیف ورودی: از چپ به راست، مطابق ترتیب ارقام شماره */}
        <div dir="ltr" className="flex flex-wrap sm:flex-nowrap items-stretch gap-3">
          {/* سلکت پیش‌شماره */}
          <div className="relative shrink-0">
            <select
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value);
                resetOutcome();
              }}
              aria-label="پیش‌شماره"
              className={`${fieldClass} appearance-none w-[104px] pl-4 pr-9 tracking-normal cursor-pointer text-left`}
            >
              {IRANCELL_PREFIXES.map((p) => (
                <option key={p} value={p} className="bg-[#121316] text-white">
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* سه رقم میانی */}
          <input
            ref={part1Ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={part1}
            onChange={handlePart1Change}
            onPaste={handlePaste}
            placeholder="- - -"
            aria-label="سه رقم میانی شماره"
            className={`${fieldClass} flex-[3] min-w-[110px] px-3`}
          />

          {/* چهار رقم پایانی */}
          <input
            ref={part2Ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={part2}
            onChange={handlePart2Change}
            onKeyDown={handlePart2KeyDown}
            onPaste={handlePaste}
            placeholder="- - - -"
            aria-label="چهار رقم پایانی شماره"
            className={`${fieldClass} flex-[4] min-w-[130px] px-3`}
          />

          {/* دکمه جستجو */}
          <button
            type="submit"
            disabled={searching}
            className="h-14 shrink-0 grow sm:grow-0 bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-black text-base sm:text-lg px-8 rounded-2xl shadow-[0_4px_22px_rgba(255,190,0,0.32)] transition-all cursor-pointer disabled:opacity-75"
          >
            {searching ? 'در حال جستجو…' : 'جستجو'}
          </button>
        </div>

        {/* دکمه ثانویه: پیگیری سفارش */}
        <button
          type="button"
          onClick={onOpenTracking}
          className="mt-4 w-full bg-white/85 hover:bg-white/95 active:scale-[0.98] text-black font-black text-base sm:text-lg py-3.5 px-6 rounded-2xl shadow-[0_4px_18px_rgba(255,255,255,0.15)] transition-all cursor-pointer"
        >
          پیگیری سفارش
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-center text-xs font-bold text-amber-300">
          {error}
        </div>
      )}

      {/* نتیجه‌ی جستجو: عنوان، شماره، قیمت و دکمه‌ی خرید */}
      {outcome && outcome.results.length === 0 && (
        <div className="mt-4 flex items-start gap-2.5 bg-white/5 border border-[#2A2D36] rounded-xl p-3.5 text-right">
          <Info className="mt-0.5 w-4 h-4 shrink-0 text-gray-400" />
          <p className="text-xs font-bold leading-6 text-gray-300">
            شماره{' '}
            <span dir="ltr" className="inline-block font-mono text-gray-100">
              {outcome.formattedPattern}
            </span>{' '}
            موجود نیست و شماره‌ی مشابهی هم پیدا نشد. ارقام دیگری را امتحان کنید.
          </p>
        </div>
      )}

      {outcome && outcome.results.length > 0 && (
        <div className="mt-5">
          {/* شماره‌ی درخواستی موجود نبوده و سرویس گزینه‌های مشابه برگردانده است */}
          {outcome.isSimilar && (
            <div className="mb-3 flex items-start gap-2.5 bg-amber-400/10 border border-amber-400/25 rounded-xl p-3.5 text-right">
              <Info className="mt-0.5 w-4 h-4 shrink-0 text-amber-300" />
              <p className="text-xs font-bold leading-6 text-amber-200">
                شماره{' '}
                <span dir="ltr" className="inline-block font-mono text-amber-100">
                  {outcome.formattedPattern}
                </span>{' '}
                موجود نیست. شماره‌های مشابه زیر پیشنهاد می‌شوند:
              </p>
            </div>
          )}

          <ul
            className={`space-y-3 ${
              outcome.results.length > 3 ? 'max-h-[380px] overflow-y-auto pl-1' : ''
            }`}
          >
            {outcome.results.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 bg-[#121316] border border-[#2A2D36] rounded-2xl p-4"
              >
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="mt-1.5">
                    <span
                      dir="ltr"
                      className="inline-block font-mono text-lg sm:text-xl font-black tracking-wider text-[#FFBE00]"
                    >
                      {item.formattedNumber}
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-gray-400">
                    {item.totalPrice.toLocaleString('fa-IR')} تومان
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onBuyNumber(item)}
                  className="shrink-0 bg-[#FFBE00] hover:bg-[#E5AA00] active:scale-[0.98] text-black font-black text-sm sm:text-base py-3 px-7 rounded-xl shadow-[0_4px_18px_rgba(255,190,0,0.28)] transition-all cursor-pointer"
                >
                  خرید
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};
