/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialAdminUsers } from '../mock/mockAdminUsers';
import { AdminUser } from '../types';

let adminUsersData: AdminUser[] = [...initialAdminUsers];

export const adminUserService = {
  /**
   * Get all admin panel users
   */
  async getUsers(): Promise<AdminUser[]> {
    await new Promise((res) => setTimeout(res, 120));
    return [...adminUsersData];
  },

  /**
   * Create an admin panel user
   */
  async createUser(
    user: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>
  ): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 200));
    const created: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      lastLogin: 'هنوز وارد نشده',
      createdAt: new Date().toISOString(),
    };
    adminUsersData.push(created);
    return { ...created };
  },

  /**
   * Update admin user details or role
   */
  async updateUser(
    id: string,
    updates: Partial<AdminUser>
  ): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 180));
    const index = adminUsersData.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`کاربر با شناسه ${id} یافت نشد.`);
    }
    adminUsersData[index] = { ...adminUsersData[index], ...updates };
    return { ...adminUsersData[index] };
  },

  /**
   * Delete admin user
   */
  async deleteUser(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 150));
    const initialLen = adminUsersData.length;
    adminUsersData = adminUsersData.filter((u) => u.id !== id);
    return adminUsersData.length < initialLen;
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 150));
    const index = adminUsersData.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`کاربر با شناسه ${id} یافت نشد.`);
    }
    adminUsersData[index].isActive = !adminUsersData[index].isActive;
    return { ...adminUsersData[index] };
  },
};
