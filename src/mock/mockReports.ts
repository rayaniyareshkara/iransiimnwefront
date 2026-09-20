/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardMetrics, OrderStatusDistribution, SalesChartDataPoint } from '../types';

export const initialDashboardMetrics: DashboardMetrics = {
  todaySales: 7115000,
  monthSales: 184500000,
  totalSales: 940000000,
  totalOrders: 284,
  newOrdersCount: 8,
  pendingPaymentCount: 3,
  inShippingCount: 14,
  deliveredCount: 259,
};

export const initialSalesChartData: SalesChartDataPoint[] = [
  { date: '1404/12/10', label: 'شنبه', salesAmount: 14200000, orderCount: 5 },
  { date: '1404/12/11', label: 'یکشنبه', salesAmount: 18500000, orderCount: 7 },
  { date: '1404/12/12', label: 'دوشنبه', salesAmount: 22800000, orderCount: 9 },
  { date: '1404/12/13', label: 'سه‌شنبه', salesAmount: 16400000, orderCount: 6 },
  { date: '1404/12/14', label: 'چهارشنبه', salesAmount: 28900000, orderCount: 11 },
  { date: '1404/12/15', label: 'پنج‌شنبه', salesAmount: 31200000, orderCount: 12 },
  { date: '1404/12/16', label: 'جمعه (امروز)', salesAmount: 7115000, orderCount: 4 },
];

export const initialOrderStatusDistribution: OrderStatusDistribution[] = [
  { status: 'delivered', statusLabel: 'تحویل داده شده', count: 259, percentage: 76, color: '#10B981' },
  { status: 'shipping', statusLabel: 'در حال ارسال', count: 14, percentage: 11, color: '#3B82F6' },
  { status: 'packaging', statusLabel: 'در حال بسته‌بندی', count: 5, percentage: 5, color: '#F59E0B' },
  { status: 'processing', statusLabel: 'در حال بررسی هویت', count: 3, percentage: 4, color: '#8B5CF6' },
  { status: 'created', statusLabel: 'در انتظار پرداخت', count: 3, percentage: 4, color: '#EF4444' },
];
