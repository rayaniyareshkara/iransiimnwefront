/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../router';

interface StoreLayoutProps {
  children: React.ReactNode;
}

/**
 * StoreLayout: Customer Store Layout adhering 100% to reference screenshots
 * - Irancell Yellow Header with official branch details & online badge
 * - Contrast Dark Background (#121214)
 * - Centered responsive card container (max-w-md / max-w-lg)
 * - Quick bottom navigation bar (Rules, Address, Contact)
 */
export const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
  const { path, navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col items-center select-none font-['Vazirmatn',sans-serif]">
      {/* Irancell Gold/Yellow Header Banner */}
      <header className="w-full bg-[#FFBE00] text-black py-4 px-4 shadow-md flex flex-col items-center justify-center relative">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-center">
          نمایندگی رسمی ایرانسل - مختارزاده
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <a
            href="tel:09301002412"
            dir="ltr"
            className="font-extrabold text-base md:text-lg tracking-wider hover:opacity-80 transition-opacity font-mono underline decoration-black/30 cursor-pointer"
            title="تماس مستقیم با 09301002412"
          >
            09301002412
          </a>
          <span className="inline-flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            آنلاین
          </span>
        </div>

        {/* Quick Switch to Admin Panel for developers & store managers */}
        <button
          onClick={() => navigate('/admin')}
          className="absolute left-3 top-3 text-[11px] bg-black/80 hover:bg-black text-amber-300 px-2.5 py-1 rounded-md transition-colors font-medium border border-amber-400/30"
          title="ورود به پنل مدیریت"
        >
          ورود به پنل ادمین
        </button>
      </header>

      {/* Main Content View Container */}
      <main className="w-full max-w-md px-4 py-6 flex-1 flex flex-col items-center">
        {children}
      </main>

      {/* Fixed/Sticky Bottom Floating Action Pill (as seen in screenshots) */}
      <footer className="w-full max-w-md px-4 pb-6 pt-2">
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 p-2.5 rounded-2xl shadow-lg flex items-center justify-around gap-2">
          <button
            onClick={() => navigate('/rules')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-center text-sm font-bold transition-all shadow-sm ${
              path === '/rules'
                ? 'bg-black text-amber-400'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            قوانین
          </button>
          <button
            onClick={() => navigate('/contact')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-center text-sm font-bold transition-all shadow-sm ${
              path === '/contact'
                ? 'bg-black text-amber-400'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            آدرس
          </button>
          <button
            onClick={() => navigate('/about')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-center text-sm font-bold transition-all shadow-sm ${
              path === '/about'
                ? 'bg-black text-amber-400'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            تماس
          </button>
        </div>
      </footer>
    </div>
  );
};
