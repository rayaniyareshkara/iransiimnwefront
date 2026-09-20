/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AvailableNumber } from '../types';

/**
 * Notice: This is strictly an external list of available numbers provided for search/selection.
 * No SIM management, no SIM stock/CRUD is provided or managed here.
 */
export const initialAvailableNumbers: AvailableNumber[] = [
  {
    id: 'num-1',
    phoneNumber: '09002841435',
    formattedNumber: '0900 284 1435',
    type: 'permanent',
    price: 2686000,
    category: 'golden',
    hasFreeCallGift: true,
    freeCallMinutes: 900,
    hasFreeInternetGift: true,
    freeInternetGb: 90,
    operator: 'ایرانسل',
    isAvailable: true,
  },
  {
    id: 'num-2',
    phoneNumber: '09351234567',
    formattedNumber: '0935 123 4567',
    type: 'permanent',
    price: 3450000,
    category: 'golden',
    hasFreeCallGift: true,
    freeCallMinutes: 900,
    hasFreeInternetGift: true,
    freeInternetGb: 90,
    operator: 'ایرانسل',
    isAvailable: true,
  },
  {
    id: 'num-3',
    phoneNumber: '09357894512',
    formattedNumber: '0935 789 4512',
    type: 'credit',
    price: 1850000,
    category: 'silver',
    hasFreeCallGift: true,
    freeCallMinutes: 500,
    hasFreeInternetGift: true,
    freeInternetGb: 45,
    operator: 'ایرانسل',
    isAvailable: true,
  },
  {
    id: 'num-4',
    phoneNumber: '09365694219',
    formattedNumber: '0936 569 4219',
    type: 'permanent',
    price: 4200000,
    category: 'golden',
    hasFreeCallGift: true,
    freeCallMinutes: 1200,
    hasFreeInternetGift: true,
    freeInternetGb: 120,
    operator: 'ایرانسل',
    isAvailable: true,
  },
  {
    id: 'num-5',
    phoneNumber: '09005556677',
    formattedNumber: '0900 555 6677',
    type: 'permanent',
    price: 5500000,
    category: 'golden',
    hasFreeCallGift: true,
    freeCallMinutes: 1000,
    hasFreeInternetGift: true,
    freeInternetGb: 100,
    operator: 'ایرانسل',
    isAvailable: true,
  },
];
