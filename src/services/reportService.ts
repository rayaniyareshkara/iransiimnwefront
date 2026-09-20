/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  initialDashboardMetrics,
  initialOrderStatusDistribution,
  initialSalesChartData,
} from '../mock/mockReports';
import { initialOrders } from '../mock/mockOrders';
import {
  DashboardMetrics,
  Order,
  OrderStatusDistribution,
  ReportsFilter,
  SalesChartDataPoint,
} from '../types';

export const reportService = {
  /**
   * Get main metrics for admin dashboard
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await new Promise((res) => setTimeout(res, 120));
    return { ...initialDashboardMetrics };
  },

  /**
   * Get chart points for recent sales
   */
  async getSalesChartData(): Promise<SalesChartDataPoint[]> {
    await new Promise((res) => setTimeout(res, 100));
    return [...initialSalesChartData];
  },

  /**
   * Get distribution of orders by their status
   */
  async getOrderStatusDistribution(): Promise<OrderStatusDistribution[]> {
    await new Promise((res) => setTimeout(res, 100));
    return [...initialOrderStatusDistribution];
  },

  /**
   * Get detailed analytics for Reports view
   */
  async getFilteredReports(filters: ReportsFilter = {}): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    orders: Order[];
  }> {
    await new Promise((res) => setTimeout(res, 180));
    let orders = [...initialOrders];

    if (filters.status && filters.status !== 'all') {
      orders = orders.filter((o) => o.orderStatus === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      orders = orders.filter((o) => o.payment.status === filters.paymentStatus);
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.payment.status === 'paid' ? o.totalPrice : 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      orders,
    };
  },
};
