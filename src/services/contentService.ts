/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialStoreContent } from '../mock/mockContent';
import { FaqItem, StoreContent } from '../types';

let currentContent: StoreContent = JSON.parse(JSON.stringify(initialStoreContent));

export const contentService = {
  /**
   * Get store content (about, rules, faq, contact)
   */
  async getContent(): Promise<StoreContent> {
    await new Promise((res) => setTimeout(res, 80));
    return JSON.parse(JSON.stringify(currentContent));
  },

  /**
   * Update content sections
   */
  async updateContent(updates: Partial<StoreContent>): Promise<StoreContent> {
    await new Promise((res) => setTimeout(res, 180));
    currentContent = {
      ...currentContent,
      ...updates,
    };
    return JSON.parse(JSON.stringify(currentContent));
  },

  /**
   * Update FAQ items
   */
  async updateFaq(faqList: FaqItem[]): Promise<FaqItem[]> {
    await new Promise((res) => setTimeout(res, 150));
    currentContent.faqList = [...faqList];
    return [...currentContent.faqList];
  },
};
