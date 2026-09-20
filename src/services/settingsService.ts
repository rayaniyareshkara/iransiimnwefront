/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialStoreSettings } from '../mock/mockSettings';
import { StoreSettings } from '../types';

let currentSettings: StoreSettings = { ...initialStoreSettings };

export const settingsService = {
  /**
   * Get store and representative settings
   */
  async getSettings(): Promise<StoreSettings> {
    await new Promise((res) => setTimeout(res, 80));
    return { ...currentSettings };
  },

  /**
   * Update store settings
   */
  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    await new Promise((res) => setTimeout(res, 180));
    currentSettings = { ...currentSettings, ...updates };
    return { ...currentSettings };
  },
};
