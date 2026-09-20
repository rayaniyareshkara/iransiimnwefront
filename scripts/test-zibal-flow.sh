#!/usr/bin/env bash
# Walks the whole Zibal flow against a running payment server.
#
#   npm run start:api        # in another terminal
#   npm run test:zibal       # or: bash scripts/test-zibal-flow.sh 09001208547
#
# The merchant comes from ZIBAL_MERCHANT in .env — "zibal" is the sandbox
# merchant, which accepts requests and lets you complete a test payment in the
# browser. Everything up to the browser step is exercised automatically; the
# actual card entry cannot be scripted, so the script prints the gateway URL
# and then shows what verify returns before and after you pay.

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
NUMBER="${1:-}"

say() { printf '\n\033[1;33m== %s\033[0m\n' "$1"; }
json() { python3 -m json.tool 2>/dev/null || cat; }

# ---------------------------------------------------------------------------
say "0. سرور و مرچنت"
curl -fsS -m 10 "$BASE_URL/fapi/payment/healthz" | json

# ---------------------------------------------------------------------------
say "1. پیدا کردن یک شماره‌ی موجود"
if [ -z "$NUMBER" ]; then
  NUMBER=$(curl -fsS -m 20 -X POST 'https://iransiim.ir/api/search' \
    -H 'Content-Type: application/json' -d '{"pattern":"900120*"}' \
    | python3 -c 'import sys,json;n=json.load(sys.stdin)["result"]["numbers"];print("0"+"".join(c for c in n[0]["msisdn"] if c.isdigit()))')
fi
echo "شماره: $NUMBER"

# ---------------------------------------------------------------------------
say "2. اعتبارسنجی: کد ملی ناقص باید رد شود (انتظار: 422)"
curl -s -o /tmp/zibal-invalid.json -w 'HTTP %{http_code}\n' -m 20 \
  -X POST "$BASE_URL/fapi/payment/request" -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{"fullName":"علی رضایی","mobile":"09123456789","fatherName":"حسن",
 "nationalCode":"123","secondaryRequestNumber":"","address":"تهران خیابان آزادی پلاک ۱",
 "plaque":"12","purchasedNumber":"$NUMBER"}
JSON
)"
json < /tmp/zibal-invalid.json

# ---------------------------------------------------------------------------
say "3. امنیت مبلغ: مبلغ دستکاری‌شده‌ی فرانت باید رد شود (انتظار: 409 price-changed)"
curl -s -o /tmp/zibal-amount.json -w 'HTTP %{http_code}\n' -m 30 \
  -X POST "$BASE_URL/fapi/payment/request" -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{"fullName":"علی رضایی","mobile":"09123456789","fatherName":"حسن",
 "nationalCode":"1234567890","secondaryRequestNumber":"","address":"تهران خیابان آزادی پلاک ۱",
 "plaque":"12","purchasedNumber":"$NUMBER","amount":1000}
JSON
)"
json < /tmp/zibal-amount.json

# ---------------------------------------------------------------------------
say "4. شروع پرداخت (انتظار: 200 و یک trackId)"
curl -fsS -m 30 -X POST "$BASE_URL/fapi/payment/request" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<JSON
{"fullName":"علی رضایی","mobile":"09123456789","fatherName":"حسن",
 "nationalCode":"1234567890","secondaryRequestNumber":"02112345678",
 "address":"تهران، خیابان آزادی، کوچه بهار","plaque":"12","purchasedNumber":"$NUMBER"}
JSON
)" > /tmp/zibal-request.json
json < /tmp/zibal-request.json

TRACK_ID=$(python3 -c 'import json;print(json.load(open("/tmp/zibal-request.json")).get("trackId",""))')
PAY_URL=$(python3 -c 'import json;print(json.load(open("/tmp/zibal-request.json")).get("paymentUrl",""))')
[ -n "$TRACK_ID" ] || { echo "trackId دریافت نشد"; exit 1; }

# ---------------------------------------------------------------------------
say "5. verify پیش از پرداخت (انتظار: success=false، کد ۲۰۲ زیبال)"
curl -fsS -m 30 -X POST "$BASE_URL/fapi/payment/verify" \
  -H 'Content-Type: application/json' -d "{\"trackId\":\"$TRACK_ID\"}" | json

# ---------------------------------------------------------------------------
say "6. صفحه‌ی بازگشت از درگاه (انتظار: HTML «در حال بررسی»)"
curl -fsS -m 20 "$BASE_URL/fapi/payment/callback?trackId=$TRACK_ID&success=1&status=2&orderId=x" \
  | grep -o 'در حال بررسی[^<]*' | head -1

# ---------------------------------------------------------------------------
say "7. پرداخت را در مرورگر کامل کنید"
cat <<MSG
  $PAY_URL

سپس این دستورها را بزنید:

  # verify بعد از پرداخت — انتظار: success=true و firstTime=true
  curl -s -X POST $BASE_URL/fapi/payment/verify \\
    -H 'Content-Type: application/json' -d '{"trackId":"$TRACK_ID"}' | python3 -m json.tool

  # همان درخواست دوباره — انتظار: success=true ولی firstTime=false (idempotency)
  curl -s -X POST $BASE_URL/fapi/payment/verify \\
    -H 'Content-Type: application/json' -d '{"trackId":"$TRACK_ID"}' | python3 -m json.tool

  # اطلاعات خریدار که از description بازخوانی شده است
  curl -s $BASE_URL/fapi/payment/result/$TRACK_ID | python3 -m json.tool

  # دفتر تراکنش‌ها؛ فقط شناسه، مبلغ و وضعیت delivered
  cat server-data/transactions.json
MSG
