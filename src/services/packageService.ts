/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialInternetPackages } from '../mock/mockPackages';
import { InternetPackage } from '../types';

let packagesData: InternetPackage[] = [...initialInternetPackages];

export const packageService = {
  /**
   * Get all packages, optionally including inactive packages
   */
  async getPackages(includeInactive: boolean = true): Promise<InternetPackage[]> {
    await new Promise((res) => setTimeout(res, 150));
    if (!includeInactive) {
      return packagesData.filter((p) => p.isActive);
    }
    return [...packagesData];
  },

  /**
   * Get package by ID
   */
  async getPackageById(id: string): Promise<InternetPackage | null> {
    await new Promise((res) => setTimeout(res, 100));
    const found = packagesData.find((p) => p.id === id);
    return found ? { ...found } : null;
  },

  /**
   * Create a new internet package
   */
  async createPackage(
    newPkg: Omit<InternetPackage, 'id' | 'createdAt'>
  ): Promise<InternetPackage> {
    await new Promise((res) => setTimeout(res, 200));
    const created: InternetPackage = {
      ...newPkg,
      id: `pkg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    packagesData.unshift(created);
    return { ...created };
  },

  /**
   * Update an existing package
   */
  async updatePackage(
    id: string,
    updates: Partial<InternetPackage>
  ): Promise<InternetPackage> {
    await new Promise((res) => setTimeout(res, 200));
    const index = packagesData.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`بسته با شناسه ${id} یافت نشد.`);
    }
    packagesData[index] = { ...packagesData[index], ...updates };
    return { ...packagesData[index] };
  },

  /**
   * Delete an internet package
   */
  async deletePackage(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 150));
    const initialLen = packagesData.length;
    packagesData = packagesData.filter((p) => p.id !== id);
    return packagesData.length < initialLen;
  },

  /**
   * Toggle package active/inactive state
   */
  async togglePackageStatus(id: string): Promise<InternetPackage> {
    await new Promise((res) => setTimeout(res, 150));
    const index = packagesData.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`بسته با شناسه ${id} یافت نشد.`);
    }
    packagesData[index].isActive = !packagesData[index].isActive;
    return { ...packagesData[index] };
  },
};
