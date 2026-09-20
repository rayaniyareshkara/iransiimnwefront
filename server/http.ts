/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { config } from './config.ts';

/** خطای ارتباط با سرویس بیرونی، تا از خطاهای اعتبارسنجی قابل تفکیک باشد. */
export class UpstreamError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/** POST با بدنه‌ی JSON و تایم‌اوت. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UpstreamError(`${url} پاسخ ${response.status} برگرداند`);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError(`ارتباط با ${url} برقرار نشد`, err);
  } finally {
    clearTimeout(timer);
  }
}
