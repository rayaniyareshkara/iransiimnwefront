/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { numberSearchService } from '../services';
import { NumberSearchResult } from '../types';

export interface NumberOfferState {
  offer: NumberSearchResult | null;
  loading: boolean;
  /** پیام خطای ارتباطی. اگر `null` بود و `offer` هم خالی، یعنی شماره موجود نیست. */
  error: string | null;
}

/**
 * اطلاعات یک شماره را از سرویس جستجو می‌گیرد.
 *
 * مراحل خرید شماره را از URL می‌خوانند، بنابراین با رفرش یا باز کردن مستقیم
 * لینک هم داده در دسترس است؛ سرویس نتایج قبلی را کش می‌کند تا رفتن از صفحه‌ی
 * جستجو به مرحله‌ی بعد درخواست اضافی نزند.
 */
export function useNumberOffer(phoneNumber: string | null): NumberOfferState {
  const [state, setState] = useState<NumberOfferState>({
    offer: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!phoneNumber) {
      setState({ offer: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ offer: null, loading: true, error: null });

    numberSearchService
      .getByPhoneNumber(phoneNumber)
      .then((offer) => {
        if (!cancelled) setState({ offer, loading: false, error: null });
      })
      .catch((err) => {
        console.error('Failed to load number offer:', err);
        if (!cancelled) {
          setState({
            offer: null,
            loading: false,
            error: 'خطا در دریافت اطلاعات شماره. لطفاً دوباره تلاش کنید.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phoneNumber]);

  return state;
}
