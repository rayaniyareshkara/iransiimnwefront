/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, Truck, Package, Phone } from 'lucide-react';
import { orderService } from '../../services';
import { Order } from '../../types';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setQuery('');
    setOrder(null);
    setErrorMsg(null);
    onClose();
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const found = await orderService.trackOrder(query);
      if (found) {
        setOrder(found);
      } else {
        setOrder(null);
        setErrorMsg('سفارشی با این شماره موبایل یا کد رهگیری یافت نشد.');
      }
    } catch {
      setErrorMsg('خطا در استعلام سفارش. لطفاً مجدداً بررسی نمایید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#181A20] border border-[#2B2E38] rounded-3xl p-6 shadow-2xl text-white relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <h3 className="text-lg sm:text-xl font-black text-[#FFBE00]">
            پیگیری وضعیت سفارش سیم‌کارت
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            شماره همراه خریدار یا کد پیگیری سفارش را وارد نمایید
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleTrack} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: 09001234567 یا TRK-984210"
            className="flex-1 bg-[#121316] border border-[#2A2D36] text-white placeholder:text-gray-500 text-center py-2.5 px-3 rounded-xl text-sm font-medium focus:outline-hidden focus:border-[#FFBE00]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#FFBE00] hover:bg-[#E5AA00] text-black font-extrabold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>استعلام</span>
          </button>
        </form>

        {/* Search Result */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              <div className="w-8 h-8 border-2 border-[#FFBE00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              در حال استعلام از سامانه نمایندگی...
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* Order Overview Card */}
              <div className="bg-[#121316] border border-[#282B33] rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">شماره سفارش:</span>
                  <span className="font-mono font-bold text-amber-400">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">شماره سیم‌کارت:</span>
                  <span className="font-mono font-bold text-white tracking-wider">
                    {order.item.formattedNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">نام خریدار:</span>
                  <span className="font-bold text-gray-200">{order.customer.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">مبلغ سفارش:</span>
                  <span className="font-bold text-white">
                    {order.totalPrice.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">وضعیت پرداخت:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      order.payment.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {order.payment.status === 'paid' ? 'پرداخت موفق' : 'در انتظار پرداخت'}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400">مراحل و روند ارسال:</h4>
                <div className="space-y-2 bg-[#121316] p-3 rounded-2xl border border-[#282B33]">
                  {order.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs py-1">
                      <div className="mt-0.5">
                        {step.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-bold ${
                            step.isCompleted ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {step.title}
                        </div>
                        {step.description && (
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {step.description}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {step.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Phone Footer in Modal */}
        <div className="mt-4 pt-3 border-t border-[#262831] text-center text-xs text-gray-400">
          <span>پشتیبانی نمایندگی: </span>
          <a
            href="tel:02165196051"
            className="text-[#FFBE00] font-mono font-bold hover:underline"
          >
            ۰۲۱۶۵۱۹۶۰۵۱
          </a>
        </div>
      </div>
    </div>
  );
};
