/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialPricingConfig } from '../mock/mockPricing';
import { PricingConfig } from '../types';

let currentPricing: PricingConfig = { ...initialPricingConfig };

export const pricingService = {
  /**
   * Retrieve active pricing parameters
   */
  async getPricing(): Promise<PricingConfig> {
    await new Promise((res) => setTimeout(res, 100));
    return { ...currentPricing };
  },

  /**
   * Update pricing parameters (base, sale, service fee, discounts, toggles)
   */
  async updatePricing(updates: Partial<PricingConfig>): Promise<PricingConfig> {
    await new Promise((res) => setTimeout(res, 200));
    currentPricing = {
      ...currentPricing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...currentPricing };
  },
};
