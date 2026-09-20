/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialOrders } from '../mock/mockOrders';
import { Order, OrderStatus, PaymentStatus } from '../types';

let ordersData: Order[] = [...initialOrders];

export const orderService = {
  /**
   * Get all orders with optional search and filters
   */
  async getOrders(filters?: {
    query?: string;
    status?: OrderStatus | 'all';
    paymentStatus?: PaymentStatus | 'all';
  }): Promise<Order[]> {
    await new Promise((res) => setTimeout(res, 200));
    let result = [...ordersData];

    if (filters?.query) {
      const q = filters.query.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.trackingCode.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.mobileNumber.includes(q) ||
          o.item.phoneNumber.includes(q)
      );
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((o) => o.orderStatus === filters.status);
    }

    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      result = result.filter((o) => o.payment.status === filters.paymentStatus);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Get an order by internal ID or orderNumber
   */
  async getOrderById(id: string): Promise<Order | null> {
    await new Promise((res) => setTimeout(res, 120));
    const found = ordersData.find((o) => o.id === id || o.orderNumber === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Search an order for customer tracking by tracking code or mobile number
   */
  async trackOrder(identifier: string): Promise<Order | null> {
    await new Promise((res) => setTimeout(res, 200));
    const clean = identifier.replace(/\s+/g, '').trim();
    if (!clean) return null;

    const found = ordersData.find(
      (o) =>
        o.trackingCode.toLowerCase() === clean.toLowerCase() ||
        o.customer.mobileNumber === clean ||
        o.item.phoneNumber === clean ||
        o.orderNumber.toLowerCase() === clean.toLowerCase()
    );
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Create a new order during store checkout
   */
  async createOrder(
    newOrderData: Omit<
      Order,
      'id' | 'orderNumber' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'timeline'
    >
  ): Promise<Order> {
    await new Promise((res) => setTimeout(res, 250));
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const id = `ord-${Date.now()}`;
    const orderNumber = `IRN-${randomNum}`;
    const trackingCode = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      ...newOrderData,
      id,
      orderNumber,
      trackingCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'created',
          title: 'ثبت اولیه سفارش',
          description: 'سفارش توسط خریدار در سایت ثبت شد',
          timestamp: 'لحظاتی پیش',
          isCompleted: true,
        },
        {
          status: 'payment_confirmed',
          title: 'تأیید پرداخت اینترنتی',
          description: 'مبلغ سفارش از طریق درگاه پرداخت تایید گردید',
          timestamp: 'در انتظار پرداخت',
          isCompleted: newOrderData.payment.status === 'paid',
        },
        {
          status: 'processing',
          title: 'بررسی مدارک و احراز هویت',
          description: 'بررسی اطلاعات در سامانه نمایندگی',
          timestamp: 'مرحله بعد',
          isCompleted: false,
        },
        {
          status: 'packaging',
          title: 'آماده‌سازی و بسته‌بندی',
          timestamp: 'مرحله بعد',
          isCompleted: false,
        },
        {
          status: 'shipping',
          title: 'تحویل به واحد ارسال',
          timestamp: 'مرحله بعد',
          isCompleted: false,
        },
        {
          status: 'delivered',
          title: 'تحویل نهایی به مشتری',
          timestamp: 'مرحله بعد',
          isCompleted: false,
        },
      ],
    };

    ordersData.unshift(newOrder);
    return JSON.parse(JSON.stringify(newOrder));
  },

  /**
   * Update the status of an existing order
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<Order> {
    await new Promise((res) => setTimeout(res, 180));
    const index = ordersData.findIndex((o) => o.id === orderId);
    if (index === -1) {
      throw new Error(`سفارش با شناسه ${orderId} یافت نشد.`);
    }

    const order = ordersData[index];
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();
    if (note) order.notes = note;

    // Update timeline
    const statusOrder: OrderStatus[] = [
      'created',
      'payment_confirmed',
      'processing',
      'packaging',
      'shipping',
      'delivered',
    ];
    const currentIndex = statusOrder.indexOf(newStatus);

    order.timeline = order.timeline.map((event) => {
      const eventIndex = statusOrder.indexOf(event.status);
      if (eventIndex <= currentIndex && eventIndex !== -1) {
        return {
          ...event,
          isCompleted: true,
          timestamp: event.timestamp.includes('پیش') || event.timestamp.includes('۱۴۰') ? event.timestamp : 'تکمیل شد',
        };
      }
      return event;
    });

    ordersData[index] = order;
    return JSON.parse(JSON.stringify(order));
  },
};
