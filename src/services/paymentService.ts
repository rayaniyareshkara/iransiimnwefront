/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Order } from '../types';
import { orderService } from './orderService';

export interface PaymentRequest {
  customer: Customer;
  phoneNumber: string;
  simPrice: number;
  totalPrice: number;
  freeCallMinutes?: number;
  freeInternetGb?: number;
  operator?: string;
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  trackingCode: string;
  amount: number;
  redirectUrl: string | null;
  errorMessage?: string;
  order?: Order;
}

/**
 * ============================================================================
 * PAYMENT SERVICE (Architecture Guide for Backend Developers)
 * ============================================================================
 *
 * Current State:
 * - Mock implementation for Frontend Checkout flow.
 * - Simulates network round-trip, creates the pending/paid order record via
 *   orderService, and returns structured success response.
 *
 * How to replace with Real Backend & Bank Payment Gateway:
 * 1. Replace the mock delay with a real fetch / axios POST to your server:
 *    `const res = await fetch('/api/orders/payment', { method: 'POST', body: JSON.stringify(request) });`
 * 2. In your backend:
 *    - Validate customer data & SIM availability.
 *    - Save order in database with status 'pending_payment'.
 *    - Request a transaction token from your payment gateway (e.g., Shaparak / Asan Pardakht / Zarinpal / Mellat).
 *    - Return `{ success: true, redirectUrl: "https://gateway.bank.ir/pay/...", paymentId: "..." }`.
 * 3. Frontend Checkout logic:
 *    If `response.redirectUrl` is present:
 *       `window.location.href = response.redirectUrl;`
 *    Otherwise, for local/app-level confirmation:
 *       Navigates to `/store/success?orderNumber=...&trackingCode=...`.
 * ============================================================================
 */
export const paymentService = {
  /**
   * Initiates payment for the customer order.
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // 1. Simulate server request delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // 2. Persist order via orderService
      const order = await orderService.createOrder({
        customer: request.customer,
        item: {
          numberId: request.phoneNumber,
          phoneNumber: request.phoneNumber,
          formattedNumber: request.phoneNumber,
          type: 'permanent',
          price: request.simPrice,
          giftInternetGb: request.freeInternetGb || 90,
          giftCallMinutes: request.freeCallMinutes || 900,
        },
        basePrice: request.simPrice,
        serviceFee: 0,
        shippingPrice: 0,
        shippingMethodTitle: 'پس‌کرایه',
        discountAmount: 0,
        totalPrice: request.totalPrice,
        payment: {
          method: 'online',
          status: 'paid', // Will be 'pending' when redirectUrl is provided by backend
          amount: request.totalPrice,
          transactionId: `TX-${Date.now()}`,
          refNumber: `REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
          paidAt: new Date().toISOString(),
          gatewayName: 'درگاه پرداخت شاپرک',
        },
        orderStatus: 'payment_confirmed',
        notes: request.notes,
      });

      const paymentId = `PAY-${Date.now()}`;

      return {
        success: true,
        paymentId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingCode: order.trackingCode,
        amount: request.totalPrice,
        // When real backend is ready, redirectUrl can be returned:
        redirectUrl: null,
        order,
      };
    } catch (error: unknown) {
      console.error('Payment error:', error);
      return {
        success: false,
        paymentId: '',
        orderId: '',
        orderNumber: '',
        trackingCode: '',
        amount: request.totalPrice,
        redirectUrl: null,
        errorMessage: 'خطا در برقراری ارتباط با سرور پرداخت. لطفاً دوباره تلاش کنید.',
      };
    }
  },

  /**
   * Verify an existing payment / callback from gateway
   */
  async verifyPayment(orderId: string, trackId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const order = await orderService.getOrderById(orderId);
    return !!order && (order.trackingCode === trackId || order.id === orderId);
  },
};
