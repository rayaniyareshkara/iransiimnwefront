/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * تست خودکار منطق پرداخت، بدون نیاز به پرداخت واقعی.
 *
 * یک درگاه و یک سرویس قیمت ساختگی بالا می‌آورد، سرور پرداخت را با آن‌ها اجرا
 * می‌کند و مسیرهایی را می‌سنجد که با curl و درگاه واقعی قابل آزمودن نیستند:
 * تأیید موفق، جلوگیری از پردازش تکراری، و ردّ مبلغ ناهم‌خوان.
 *
 *   npx tsx scripts/test-payment-logic.ts
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const MOCK_PORT = 8899;
const SERVER_PORT = 8788;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

const PRODUCT_PRICE_TOMAN = 2_090_000;
const EXPECTED_RIAL = PRODUCT_PRICE_TOMAN * 10;

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`);
    if (detail !== undefined) console.error('    ', JSON.stringify(detail));
  }
}

// ---------------------------------------------------------------------------
// درگاه و سرویس قیمت ساختگی
// ---------------------------------------------------------------------------

interface MockState {
  /** description ثبت‌شده هنگام ساخت تراکنش، برای بازگرداندن در verify. */
  descriptions: Map<string, string>;
  verifyCount: Map<string, number>;
  /** وقتی true باشد، verify مبلغی متفاوت برمی‌گرداند. */
  returnWrongAmount: boolean;
  nextTrackId: number;
}

const state: MockState = {
  descriptions: new Map(),
  verifyCount: new Map(),
  returnWrongAmount: false,
  nextTrackId: 1_000_000_001,
};

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const mockServer = http.createServer(async (req, res) => {
  const body = await readBody(req);
  const send = (payload: unknown) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  if (req.url === '/api/search') {
    const pattern = String(body.pattern ?? '');
    return send({
      result_code: 0,
      info: { fa: { message: 'ok' } },
      result: {
        numbers: [{ msisdn: pattern, pool: '900S1', price: 0 }],
        products: {
          '900S1': {
            id: 560,
            finalPrice: PRODUCT_PRICE_TOMAN,
            netPrice: 1_900_000,
            vat: 190_000,
            sim_type: 'POSTPAID',
            info: { fa: { title: 'سیم‌کارت دائمی 0900 - تک ستاره' } },
          },
        },
        similar_numbers: false,
      },
    });
  }

  if (req.url === '/v1/request') {
    const trackId = String(state.nextTrackId++);
    state.descriptions.set(trackId, String(body.description ?? ''));
    return send({ result: 100, trackId: Number(trackId) });
  }

  if (req.url === '/v1/verify') {
    const trackId = String(body.trackId ?? '');
    const seen = (state.verifyCount.get(trackId) ?? 0) + 1;
    state.verifyCount.set(trackId, seen);

    return send({
      // اولین بار ۱۰۰، دفعات بعد ۲۰۱ — دقیقاً رفتار زیبال.
      result: seen === 1 ? 100 : 201,
      amount: state.returnWrongAmount ? EXPECTED_RIAL + 50_000 : EXPECTED_RIAL,
      status: 1,
      paidAt: new Date().toISOString(),
      refNumber: 987654321,
      description: state.descriptions.get(trackId) ?? '',
    });
  }

  res.writeHead(404).end();
});

// ---------------------------------------------------------------------------

const buyer = {
  fullName: 'علی رضایی',
  mobile: '09123456789',
  fatherName: 'حسن',
  nationalCode: '1234567890',
  secondaryRequestNumber: '02112345678',
  address: 'تهران، خیابان آزادی، کوچه بهار',
  plaque: '12',
  purchasedNumber: '09001208547',
};

async function post(pathname: string, payload: unknown) {
  const response = await fetch(`${SERVER_URL}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: (await response.json()) as Record<string, never> };
}

/**
 * اگر پورت آزاد نباشد، سرورِ تازه ساکت می‌میرد و تست علیه یک نمونه‌ی قدیمی
 * اجرا می‌شود — که خطاهای گیج‌کننده می‌دهد. پس اول صراحتاً بررسی می‌شود.
 */
function assertPortFree(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = net
      .createServer()
      .once('error', () =>
        reject(
          new Error(
            `پورت ${port} اشغال است. احتمالاً سرور یک اجرای قبلی هنوز زنده است: ` +
              `pkill -f "server/index.ts"`
          )
        )
      )
      .once('listening', () => probe.close(() => resolve()))
      .listen(port, '127.0.0.1');
  });
}

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${SERVER_URL}/fapi/payment/healthz`);
      if (res.ok) return;
    } catch {
      // هنوز بالا نیامده است.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('payment server did not start');
}

async function main(): Promise<void> {
  await assertPortFree(SERVER_PORT);
  await assertPortFree(MOCK_PORT);

  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zibal-test-'));
  await new Promise<void>((resolve) => mockServer.listen(MOCK_PORT, resolve));

  // tsx خودش یک پروسه‌ی فرزند می‌سازد، بنابراین kill روی فرزند مستقیم کافی
  // نیست؛ با detached یک گروه پروسه ساخته می‌شود تا کل درخت با هم بسته شود.
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    detached: true,
    env: {
      ...process.env,
      ZIBAL_MERCHANT: 'zibal',
      ZIBAL_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      NUMBER_SEARCH_URL: `http://127.0.0.1:${MOCK_PORT}/api/search`,
      PORT: String(SERVER_PORT),
      PUBLIC_BASE_URL: SERVER_URL,
      DATA_DIR: dataDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout?.on('data', (chunk) => (serverOutput += chunk));
  server.stderr?.on('data', (chunk) => (serverOutput += chunk));

  try {
    try {
      await waitForServer();
    } catch (err) {
      // خروجی سرور تنها سرنخ است وقتی اصلاً بالا نمی‌آید.
      console.error('--- server output ---\n' + serverOutput);
      throw err;
    }

    console.log('\n۱. اعتبارسنجی سمت سرور');
    const invalid = await post('/fapi/payment/request', { ...buyer, nationalCode: '123' });
    check('کد ملی ناقص رد می‌شود', invalid.status === 422, invalid.body);
    check('پیام خطا روی همان فیلد می‌نشیند', Boolean(invalid.body.errors?.['nationalCode']));

    const badMobile = await post('/fapi/payment/request', { ...buyer, mobile: '12345' });
    check('موبایل نامعتبر رد می‌شود', badMobile.status === 422, badMobile.body);

    console.log('\n۲. مبلغ از منبع معتبر خوانده می‌شود');
    const tampered = await post('/fapi/payment/request', { ...buyer, amount: 1000 });
    check('مبلغ دستکاری‌شده پذیرفته نمی‌شود', tampered.status === 409, tampered.body);
    check(
      'مبلغ درست از سرویس قیمت برمی‌گردد',
      tampered.body.amountToman === (PRODUCT_PRICE_TOMAN as never),
      tampered.body
    );

    console.log('\n۳. شروع پرداخت');
    const started = await post('/fapi/payment/request', buyer);
    check('درخواست موفق است', started.status === 200 && started.body.ok === (true as never), started.body);
    const trackId = String(started.body.trackId);
    check('trackId برگردانده می‌شود', Boolean(trackId));
    check(
      'آدرس درگاه ساخته می‌شود',
      String(started.body.paymentUrl).endsWith(`/start/${trackId}`),
      started.body
    );

    console.log('\n۴. تأیید پرداخت');
    const first = await post('/fapi/payment/verify', { trackId });
    check('پرداخت تأیید می‌شود', first.body.success === (true as never), first.body);
    check('اولین پردازش است', first.body.firstTime === (true as never), first.body);
    check(
      'به صفحه‌ی موفقیت هدایت می‌شود',
      String(first.body.redirectTo).startsWith('/store/success'),
      first.body
    );

    console.log('\n۵. جلوگیری از پردازش تکراری');
    const second = await post('/fapi/payment/verify', { trackId });
    check('همچنان موفق گزارش می‌شود', second.body.success === (true as never), second.body);
    check('ولی دوباره پردازش نمی‌شود', second.body.firstTime === (false as never), second.body);

    console.log('\n۶. اطلاعات خریدار از description بازخوانی می‌شود');
    const result = await fetch(`${SERVER_URL}/fapi/payment/result/${trackId}`);
    const resultBody = (await result.json()) as { ok: boolean; buyer?: typeof buyer };
    check('نتیجه در دسترس است', resultBody.ok === true, resultBody);
    check('نام خریدار درست است', resultBody.buyer?.fullName === buyer.fullName, resultBody.buyer);
    check(
      'شماره‌ی خریداری‌شده درست است',
      resultBody.buyer?.purchasedNumber === buyer.purchasedNumber,
      resultBody.buyer
    );

    console.log('\n۷. دفتر تراکنش‌ها');
    const ledger = JSON.parse(
      await fs.readFile(path.join(dataDir, 'transactions.json'), 'utf8')
    ) as Array<Record<string, unknown>>;
    const record = ledger.find((r) => r.trackId === trackId);
    check('تراکنش ثبت شده است', Boolean(record), ledger);
    check('وضعیت verified است', record?.status === 'verified', record);
    check('delivered ثبت شده است', record?.delivered === true, record);
    check('مبلغ مورد انتظار سمت سرور نگه داشته شده', record?.amountRial === EXPECTED_RIAL, record);
    check(
      'هیچ اطلاعات هویتی در دفتر ذخیره نشده',
      !JSON.stringify(ledger).includes(buyer.nationalCode) &&
        !JSON.stringify(ledger).includes(buyer.fullName),
      record
    );

    console.log('\n۸. مبلغ ناهم‌خوان رد می‌شود');
    state.returnWrongAmount = true;
    const mismatchStart = await post('/fapi/payment/request', buyer);
    const mismatchVerify = await post('/fapi/payment/verify', {
      trackId: String(mismatchStart.body.trackId),
    });
    check('پرداخت با مبلغ متفاوت تأیید نمی‌شود', mismatchVerify.body.success === (false as never), mismatchVerify.body);
    check(
      'به صفحه‌ی خطا هدایت می‌شود',
      String(mismatchVerify.body.redirectTo).startsWith('/store/payment-failed'),
      mismatchVerify.body
    );

    console.log('\n۹. تراکنش ناشناس');
    const unknown = await post('/fapi/payment/verify', { trackId: '999999999' });
    check('تراکنشی که این سرور نساخته رد می‌شود', unknown.body.success === (false as never), unknown.body);
  } finally {
    // کشتن کل گروه پروسه، نه فقط فرزند مستقیم.
    try {
      if (server.pid) process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
    mockServer.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\nهمه‌ی تست‌ها موفق بودند.\n' : `\n${failures} تست ناموفق.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
