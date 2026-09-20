/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PricingConfig } from '../types';

export const initialPricingConfig: PricingConfig = {
  id: 'price-config-1',
  baseSimPrice: 2686000,
  saleSimPrice: 2686000,
  activationFee: 0, // رایگان
  serviceFee: 0,
  defaultDiscountPercent: 0,
  isServiceFeeActive: false,
  isActivationFree: true,
  shippingIncluded: false, // پس‌کرایه
  updatedAt: new Date().toISOString(),
};
