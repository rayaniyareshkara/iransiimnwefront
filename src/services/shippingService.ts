/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialShippingMethods } from '../mock/mockShipping';
import { ShippingMethod } from '../types';

let shippingData: ShippingMethod[] = [...initialShippingMethods];

export const shippingService = {
  /**
   * Get all shipping methods
   */
  async getShippingMethods(onlyActive: boolean = false): Promise<ShippingMethod[]> {
    await new Promise((res) => setTimeout(res, 120));
    if (onlyActive) {
      return shippingData.filter((s) => s.isActive);
    }
    return [...shippingData];
  },

  /**
   * Create a shipping method
   */
  async createShippingMethod(
    method: Omit<ShippingMethod, 'id' | 'createdAt'>
  ): Promise<ShippingMethod> {
    await new Promise((res) => setTimeout(res, 200));
    const created: ShippingMethod = {
      ...method,
      id: `ship-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    shippingData.push(created);
    return { ...created };
  },

  /**
   * Update a shipping method
   */
  async updateShippingMethod(
    id: string,
    updates: Partial<ShippingMethod>
  ): Promise<ShippingMethod> {
    await new Promise((res) => setTimeout(res, 180));
    const index = shippingData.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`روش ارسال با شناسه ${id} یافت نشد.`);
    }
    shippingData[index] = { ...shippingData[index], ...updates };
    return { ...shippingData[index] };
  },

  /**
   * Delete a shipping method
   */
  async deleteShippingMethod(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 150));
    const initialLen = shippingData.length;
    shippingData = shippingData.filter((s) => s.id !== id);
    return shippingData.length < initialLen;
  },

  /**
   * Toggle shipping method active/inactive state
   */
  async toggleShippingStatus(id: string): Promise<ShippingMethod> {
    await new Promise((res) => setTimeout(res, 150));
    const index = shippingData.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`روش ارسال با شناسه ${id} یافت نشد.`);
    }
    shippingData[index].isActive = !shippingData[index].isActive;
    return { ...shippingData[index] };
  },
};
