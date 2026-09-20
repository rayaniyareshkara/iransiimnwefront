/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialDiscounts } from '../mock/mockDiscounts';
import { Discount } from '../types';

let discountsData: Discount[] = [...initialDiscounts];

export const discountService = {
  /**
   * Get all discount codes
   */
  async getDiscounts(): Promise<Discount[]> {
    await new Promise((res) => setTimeout(res, 150));
    return [...discountsData];
  },

  /**
   * Validate a discount code for customer checkout
   */
  async validateDiscount(
    code: string,
    orderAmount: number
  ): Promise<{ valid: boolean; discountAmount: number; message: string; discount?: Discount }> {
    await new Promise((res) => setTimeout(res, 200));
    const clean = code.trim().toUpperCase();
    const found = discountsData.find(
      (d) => d.code.toUpperCase() === clean && d.isActive
    );

    if (!found) {
      return { valid: false, discountAmount: 0, message: 'کد تخفیف وارد شده معتبر نیست یا منقضی شده است.' };
    }

    if (orderAmount < found.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `حداقل مبلغ سفارش برای استفاده از این کد ${found.minOrderAmount.toLocaleString('fa-IR')} تومان است.`,
      };
    }

    if (found.currentUsageCount >= found.maxUsageCount) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'سقف مجاز استفاده از این کد تخفیف تکمیل شده است.',
      };
    }

    let calculatedDiscount = 0;
    if (found.type === 'percentage') {
      calculatedDiscount = Math.round((orderAmount * found.amount) / 100);
    } else {
      calculatedDiscount = found.amount;
    }

    return {
      valid: true,
      discountAmount: calculatedDiscount,
      message: 'کد تخفیف با موفقیت اعمال گردید.',
      discount: { ...found },
    };
  },

  /**
   * Create discount code
   */
  async createDiscount(newDiscount: Omit<Discount, 'id' | 'currentUsageCount' | 'createdAt'>): Promise<Discount> {
    await new Promise((res) => setTimeout(res, 200));
    const created: Discount = {
      ...newDiscount,
      id: `disc-${Date.now()}`,
      currentUsageCount: 0,
      createdAt: new Date().toISOString(),
    };
    discountsData.unshift(created);
    return { ...created };
  },

  /**
   * Update discount code
   */
  async updateDiscount(id: string, updates: Partial<Discount>): Promise<Discount> {
    await new Promise((res) => setTimeout(res, 180));
    const index = discountsData.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`کد تخفیف با شناسه ${id} یافت نشد.`);
    }
    discountsData[index] = { ...discountsData[index], ...updates };
    return { ...discountsData[index] };
  },

  /**
   * Delete discount code
   */
  async deleteDiscount(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 150));
    const initialLen = discountsData.length;
    discountsData = discountsData.filter((d) => d.id !== id);
    return discountsData.length < initialLen;
  },

  /**
   * Toggle active status
   */
  async toggleDiscountStatus(id: string): Promise<Discount> {
    await new Promise((res) => setTimeout(res, 150));
    const index = discountsData.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`کد تخفیف با شناسه ${id} یافت نشد.`);
    }
    discountsData[index].isActive = !discountsData[index].isActive;
    return { ...discountsData[index] };
  },
};
