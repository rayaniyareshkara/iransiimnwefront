/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.ts';

/**
 * ============================================================================
 * دفتر سبک تراکنش‌ها — چرا لازم است؟
 * ============================================================================
 * اطلاعات خرید در دیتابیس اصلی ذخیره نمی‌شود، ولی دو مسئله بدون یک دفتر کوچک
 * قابل حل نیستند:
 *
 * ۱) جلوگیری از پردازش تکراری (idempotency)
 *    درگاه ممکن است چند بار کاربر را به callback برگرداند (رفرش صفحه، دکمه‌ی
 *    back، تلاش دوباره‌ی خود درگاه). زیبال هم برای تراکنشی که یک‌بار verify شده
 *    کد ۲۰۱ برمی‌گرداند، نه خطا. اگر ندانیم کدام trackId قبلاً «تحویل» شده،
 *    ممکن است یک خرید دوبار پردازش/ارسال شود. فیلد `delivered` دقیقاً همین را
 *    یک‌بار-مصرف می‌کند.
 *
 * ۲) نگهداری امن مبلغ مورد انتظار
 *    هنگام verify باید مبلغ اعلامی درگاه با مبلغی که خودمان تراکنش را با آن
 *    ساخته‌ایم مقایسه شود. این عدد نباید از فرانت یا از query string بیاید،
 *    وگرنه قابل دستکاری است؛ پس در همین فایل کنار trackId نگه داشته می‌شود.
 *
 * آنچه ذخیره می‌شود عمداً حداقلی است: شناسه‌ها، مبلغ، شماره‌ی خریداری‌شده و
 * وضعیت. هیچ اطلاعات هویتی خریدار اینجا نوشته نمی‌شود — آن‌ها فقط در فیلد
 * description نزد خود درگاه می‌مانند و هنگام verify خوانده می‌شوند.
 * ============================================================================
 */

export type TransactionStatus = 'pending' | 'verified' | 'failed';

export interface TransactionRecord {
  trackId: string;
  orderId: string;
  /** مبلغ مورد انتظار به ریال؛ مرجع مقایسه با پاسخ verify. */
  amountRial: number;
  purchasedNumber: string;
  status: TransactionStatus;
  /** یعنی پردازش پس از پرداخت یک‌بار انجام شده و نباید تکرار شود. */
  delivered: boolean;
  createdAt: string;
  verifiedAt?: string;
  refNumber?: string;
  failureReason?: string;
}

const FILE_NAME = 'transactions.json';

let cache: Map<string, TransactionRecord> | null = null;
/** نوشتن‌ها پشت سر هم اجرا می‌شوند تا فایل نصفه‌کاره بازنویسی نشود. */
let writeChain: Promise<void> = Promise.resolve();

function filePath(): string {
  return path.join(config.dataDir, FILE_NAME);
}

async function load(): Promise<Map<string, TransactionRecord>> {
  if (cache) return cache;

  try {
    const content = await fs.readFile(filePath(), 'utf8');
    const records = JSON.parse(content) as TransactionRecord[];
    cache = new Map(records.map((r) => [r.trackId, r]));
  } catch {
    // نبودن فایل در اولین اجرا طبیعی است.
    cache = new Map();
  }

  return cache;
}

/** نوشتن اتمیک: ابتدا در فایل موقت، سپس rename. */
async function persist(): Promise<void> {
  const records = [...(cache?.values() ?? [])];
  const target = filePath();
  const temp = `${target}.${process.pid}.tmp`;

  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(temp, JSON.stringify(records, null, 2), 'utf8');
  await fs.rename(temp, target);
}

function enqueueWrite(): Promise<void> {
  writeChain = writeChain.then(persist, persist);
  return writeChain;
}

export const transactionStore = {
  async get(trackId: string): Promise<TransactionRecord | undefined> {
    return (await load()).get(trackId);
  },

  /** ثبت تراکنش تازه‌ساخته‌شده، پیش از هدایت کاربر به درگاه. */
  async create(record: Omit<TransactionRecord, 'status' | 'delivered' | 'createdAt'>): Promise<TransactionRecord> {
    const store = await load();
    const full: TransactionRecord = {
      ...record,
      status: 'pending',
      delivered: false,
      createdAt: new Date().toISOString(),
    };
    store.set(full.trackId, full);
    await enqueueWrite();
    return full;
  },

  async update(
    trackId: string,
    patch: Partial<Omit<TransactionRecord, 'trackId'>>
  ): Promise<TransactionRecord | undefined> {
    const store = await load();
    const existing = store.get(trackId);
    if (!existing) return undefined;

    const updated = { ...existing, ...patch };
    store.set(trackId, updated);
    await enqueueWrite();
    return updated;
  },
};
