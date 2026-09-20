#!/usr/bin/env bash
# Packs everything the server needs to build and run, into one archive.
#
#   ./scripts/pack-source.sh
#
# Copying files one at a time is where deployments go wrong: a forgotten file
# or a stale leftover produces errors that look like code bugs. This ships the
# whole source tree in one shot, and deletes on the server anything no longer
# in the project.

set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="${OUT_DIR:-dist-images}"
OUT_FILE="$OUT_DIR/iransiim-source.tar.gz"

mkdir -p "$OUT_DIR"

# node_modules and build output are rebuilt on the server; dist-images holds
# archives like this one. .env is included because the server needs it — keep
# the archive private, it carries the merchant id.
tar --exclude='./node_modules' \
    --exclude='./dist' \
    --exclude='./dist-images' \
    --exclude='./server-data' \
    --exclude='./.git' \
    -czf "$OUT_FILE" \
    --transform 's|^\./||' \
    .

SIZE=$(du -h "$OUT_FILE" | cut -f1)
COUNT=$(tar -tzf "$OUT_FILE" | grep -vc '/$')

printf '\n\033[1;33m== %s (%s، %s فایل)\033[0m\n' "$OUT_FILE" "$SIZE" "$COUNT"

cat <<MSG

روی سرور:

  # ۱) کپی
  scp $OUT_FILE root@SERVER:/home/sasa/iransiim-store-&-admin/

  # ۲) استخراج روی فایل‌های فعلی
  cd /home/sasa/iransiim-store-&-admin
  tar -xzf iransiim-source.tar.gz

  # ۳) حذف دو فایلی که دیگر در پروژه نیستند
  rm -f docker/nginx/default.conf src/components/store/GiftPackagesCard.tsx

  # ۴) ساخت و اجرا
  docker compose build --no-cache
  docker compose up -d

مرحله‌ی ۳ مهم است: tar فایل‌های قدیمی را حذف نمی‌کند، و اگر
docker/nginx/default.conf بماند، nginx هم آن و هم نسخه‌ی template را
بارگذاری می‌کند و روی location ها تداخل می‌شود.
MSG
