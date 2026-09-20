#!/usr/bin/env bash
# Finds an npm registry that is actually reachable from the machine it runs on.
#
# Run it ON THE SERVER:
#   bash scripts/probe-registries.sh
#
# Whichever line comes back 200 quickly can be used as NPM_REGISTRY in .env.
# Everything else is unreachable from there, and pointing the build at it will
# reproduce the 40-minute hang that ends in "Exit handler never called!".
#
# Add your own candidates as arguments:
#   bash scripts/probe-registries.sh https://my-mirror.example/npm/

set -uo pipefail

# The package fetched is small and universally present, so the timing reflects
# the link rather than the payload.
PROBE_PATH="express/latest"
TIMEOUT="${TIMEOUT:-15}"

CANDIDATES=(
  "https://mirror.abrha.net/repository/npm/"
  "https://registry.npmjs.org"
  "https://registry.npmmirror.com"
  "$@"
)

printf '%-6s %-9s %s\n' "CODE" "TIME" "REGISTRY"
printf '%-6s %-9s %s\n' "----" "----" "--------"

for registry in "${CANDIDATES[@]}"; do
  [ -n "$registry" ] || continue
  base="${registry%/}"

  read -r code time < <(
    curl -s -o /dev/null -m "$TIMEOUT" \
      -w '%{http_code} %{time_total}' \
      "$base/$PROBE_PATH" 2>/dev/null || echo "000 timeout"
  )

  printf '%-6s %-9s %s\n' "$code" "$time" "$registry"
done

cat <<'MSG'

کدِ 200 یعنی آن مخزن از این ماشین در دسترس است. آن را در .env بگذارید:

  NPM_REGISTRY="https://..."

و دوباره build کنید:

  docker compose build --no-cache

اگر هیچ‌کدام 200 نداد، این سرور اصلاً به مخزن npm نمی‌رسد. در آن صورت
از راه انتقال ایمیج استفاده کنید — ./scripts/save-images.sh روی ماشینی که
اینترنت دارد.
MSG
