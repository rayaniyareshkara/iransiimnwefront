/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types';

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'user-1',
    fullName: 'مهندس خسروییکی',
    mobile: '09365694219',
    email: 'khosravibeigi@iransiim.ir',
    role: 'Admin',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۶ ۱۰:۳۰',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'user-2',
    fullName: 'سارا رضایی',
    mobile: '09123456789',
    email: 's.rezaei@iransiim.ir',
    role: 'Manager',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۶ ۰۹:۱۵',
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'user-3',
    fullName: 'امیرحسین عباسی',
    mobile: '09359876543',
    email: 'support@iransiim.ir',
    role: 'Support',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۵ ۱۸:۴۵',
    createdAt: '2024-06-15T11:30:00Z',
  },
];
