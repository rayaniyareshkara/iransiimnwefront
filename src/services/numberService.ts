/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialAvailableNumbers } from '../mock/mockNumbers';
import { AvailableNumber } from '../types';

let numbersData: AvailableNumber[] = [...initialAvailableNumbers];

/**
 * Service for retrieving, searching, and selecting available numbers for the Customer Store.
 * NOTE: Absolutely NO SIM inventory management or SIM CRUD is permitted here.
 */
export const numberService = {
  /**
   * Search available numbers by partial digits or prefix
   */
  async searchNumbers(query: string = ''): Promise<AvailableNumber[]> {
    await new Promise((res) => setTimeout(res, 150));
    const cleanQuery = query.replace(/\s+/g, '').trim();
    if (!cleanQuery) {
      return [...numbersData];
    }
    return numbersData.filter((item) =>
      item.phoneNumber.includes(cleanQuery) || item.formattedNumber.includes(cleanQuery)
    );
  },

  /**
   * Get a specific number by its ID or phone number
   */
  async getNumberById(idOrPhone: string): Promise<AvailableNumber | null> {
    await new Promise((res) => setTimeout(res, 100));
    const clean = idOrPhone.replace(/\s+/g, '').trim();
    const found = numbersData.find(
      (n) => n.id === clean || n.phoneNumber === clean
    );
    return found ? { ...found } : null;
  },

  /**
   * Get the primary default featured number for the store
   */
  async getDefaultNumber(): Promise<AvailableNumber> {
    await new Promise((res) => setTimeout(res, 80));
    return { ...numbersData[0] };
  },
};
