#!/usr/bin/env bash
# Builds the production images here and packs them into a single file to carry
# to a server that cannot reach the npm registry.
#
#   ./scripts/save-images.sh
#
# Everything npm is needed for happens on this machine. The server only loads
# finished images, so it never talks to a registry at all.

set -euo pipefail

cd "$(dirname "$0")/.."

WEB_IMAGE="iransiim-store-admin:latest"
API_IMAGE="iransiim-store-admin:api"
OUT_DIR="${OUT_DIR:-dist-images}"
OUT_FILE="$OUT_DIR/iransiim-images.tar.gz"

say() { printf '\n\033[1;33m== %s\033[0m\n' "$1"; }

say "۱. ساخت ایمیج‌ها"
docker compose build web api

say "۲. بسته‌بندی"
mkdir -p "$OUT_DIR"
docker save "$WEB_IMAGE" "$API_IMAGE" | gzip -1 > "$OUT_FILE"

SIZE=$(du -h "$OUT_FILE" | cut -f1)

say "آماده است: $OUT_FILE ($SIZE)"
cat <<MSG

روی سرور:

  # ۱) این فایل و فایل‌های کانفیگ را کپی کنید
  scp $OUT_FILE docker-compose.yml .env root@SERVER:/path/to/app/

  # ۲) روی سرور، ایمیج‌ها را بارگذاری کنید
  gunzip -c iransiim-images.tar.gz | docker load

  # ۳) بدون build بالا بیاورید
  docker compose up -d --no-build

سرور برای هیچ‌کدام از این مراحل به npm نیاز ندارد.
MSG
