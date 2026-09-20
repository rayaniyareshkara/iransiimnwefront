/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Discount } from '../types';

export const initialDiscounts: Discount[] = [
  {
    id: 'disc-1',
    code: 'IRANSELL1404',
    type: 'percentage',
    amount: 10,
    minOrderAmount: 2000000,
    maxUsageCount: 500,
    currentUsageCount: 42,
    startDate: '2025-01-01',
    endDate: '2025-12-29',
    isActive: true,
    description: 'تخفیف ۱۰ درصدی ویژه اعیاد و مشتریان جدید',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'disc-2',
    code: 'VIP50',
    type: 'fixed_amount',
    amount: 150000,
    minOrderAmount: 2500000,
    maxUsageCount: 200,
    currentUsageCount: 118,
    startDate: '2025-02-01',
    endDate: '2025-06-30',
    isActive: true,
    description: '۱۵۰ هزار تومان تخفیف خرید شماره‌های رند',
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'disc-3',
    code: 'SPRING90',
    type: 'percentage',
    amount: 15,
    minOrderAmount: 3000000,
    maxUsageCount: 100,
    currentUsageCount: 100,
    startDate: '2025-01-10',
    endDate: '2025-02-28',
    isActive: false,
    description: 'جشنواره بهاره (تکمیل ظرفیت)',
    createdAt: '2025-01-10T00:00:00Z',
  },
];
