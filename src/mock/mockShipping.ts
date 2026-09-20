/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShippingMethod } from '../types';

export const initialShippingMethods: ShippingMethod[] = [
  {
    id: 'ship-1',
    title: 'ارسال به صورت پس‌کرایه',
    description: 'پرداخت هزینه ارسال در محل توسط مشتری (تیپاکس یا پیک)',
    price: 0,
    isPayOnDelivery: true,
    estimatedDays: 'تا ۲ تا ۳ روز کاری',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ship-2',
    title: 'پست پیشتاز سراسری',
    description: 'تحویل درب منزل با کد رهگیری پستی به سراسر کشور',
    price: 45000,
    isPayOnDelivery: false,
    estimatedDays: '۲ الی ۴ روز کاری',
    isActive: true,
    createdAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'ship-3',
    title: 'پیک موتوری اکسپرس (تهران و البرز)',
    description: 'تحویل سریع در همان روز ثبت سفارش ویژه مناطق تحت پوشش',
    price: 85000,
    isPayOnDelivery: false,
    estimatedDays: 'همان روز (۳ الی ۵ ساعت)',
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
  },
];
