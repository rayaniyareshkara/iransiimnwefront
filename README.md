<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d7715129-697d-4deb-b5e5-1feb19208432

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker

**Prerequisites:** Docker Engine with the Compose plugin.

### Production (static build served by nginx)

```bash
docker compose up -d --build web
```

The app is then available at <http://localhost:8080>. Override the host port with
`WEB_PORT=9000 docker compose up -d web`.

This builds the Vite bundle in a Node stage and copies only `dist/` into an nginx
image, so the runtime container carries no toolchain or `node_modules`
(~74 MB total). nginx is configured with:

- **SPA history fallback** — unknown paths return `index.html` so the client
  router (`src/router/RouterContext.tsx`) can resolve routes such as
  `/admin/orders`, while missing files under `/assets/` still return a real 404.
- **Cache policy** — content-hashed files under `/assets/` are immutable for a
  year; `index.html` is never cached, so clients cannot pin a stale shell that
  references deleted bundles.
- **gzip** and basic security headers (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`).
- **`/healthz`** — plain-text probe used by the container `HEALTHCHECK`.
- **`/api/` reverse proxy** — forwards to `https://iransiim.ir/api/` (see below).

### Development (Vite dev server with HMR)

```bash
docker compose --profile dev up dev
```

Available at <http://localhost:3000> (override with `DEV_PORT`). The working tree
is bind-mounted, so edits reload live; `node_modules` lives in a named volume and
is not shadowed by the host directory. File watching uses polling
(`CHOKIDAR_USEPOLLING`) because bind mounts do not reliably deliver inotify
events.

## Number-search API

`src/services/numberSearchService.ts` calls `POST /api/search` with a
`{"pattern":"9001201156"}` body. The upstream service at `https://iransiim.ir`
returns **no CORS headers**, so the browser must never call it directly — it
calls the same-origin `/api/` path instead, which is proxied:

Product thumbnails referenced by the response live on `shop.irancell.ir`, which
also refuses direct browser image requests, so they go through a second proxy at
`/product-image/`. `toProxiedImageUrl()` rewrites the absolute URLs the API
returns onto that path.

| Environment | Proxy |
| --- | --- |
| `npm run dev` / `npm run preview` | Vite `server.proxy` in `vite.config.ts` (targets: `API_PROXY_TARGET`, `IMAGE_PROXY_TARGET`) |
| Docker `web` service | `location /api/` and `location /product-image/` in `docker/nginx/default.conf` |

`/api/payment/*` and `/payment/callback` are more specific and route to the
Express service instead — see the Zibal section below.

Set `VITE_NUMBER_SEARCH_URL` at build time to point the client at a different
endpoint and bypass the API proxy.

The service returns three distinguishable outcomes, all handled by
`NumberSearchCard`:

| Upstream response | Meaning | UI |
| --- | --- | --- |
| `numbers: [n]`, `similar_numbers: false` | the exact number is available | result card with a buy button |
| `numbers: [...]`, `similar_numbers: true` | the number is taken; these are close matches | amber notice above the list saying the number is unavailable |
| `numbers: []` | nothing matched | "not available, no similar numbers either" notice |

### Data flow into the purchase steps

`parseNumberSearchResponse()` flattens each number together with its product
(joined on `pool`) into a `NumberSearchResult` carrying everything the checkout
needs: title, thumbnail, feature list, `sim_type`, and the price components
(`netPrice`, `vat`, `discount`, `finalPrice`).

Step 1 (`StoreDetailsView`) reads the number from `?number=` in the URL and
resolves it through `useNumberOffer()` → `numberSearchService.getByPhoneNumber()`.
Results are cached per number, so arriving from the search page costs no extra
request while a reload or a shared link refetches. If the number is gone by then,
the step renders an "unavailable" screen instead of silently substituting another
number.

> Step 2 (`StoreCheckoutView`) still reads from the mock `numberService`; it has
> not been migrated yet.

## Zibal payments

`server/` is an Express + TypeScript service (run with `tsx`) that owns the
payment flow. The browser never talks to Zibal directly.

### Setup

```bash
cp .env.example .env       # ZIBAL_MERCHANT=zibal is the sandbox merchant
npm run dev:all            # Vite on :3000 + payment API on :8787
```

`ZIBAL_MERCHANT` is read from `process.env` only — the server refuses to start
without it, so the value is never hardcoded. `PUBLIC_BASE_URL` must be the
origin buyers actually reach, because the gateway `callbackUrl` is built from it.

### Endpoints

Every route sits under **`/fapi/`**, never `/api/`. The store backend already
owns `/api/` on this domain, and while both APIs shared that prefix the host
nginx sent everything to the store backend — the payment endpoints answered
404. The prefix is `API_PREFIX` in `server/config.ts`, defined once.

| Route | Purpose |
| --- | --- |
| `POST /fapi/payment/request` | Validates the form, resolves the price, creates the Zibal transaction, returns `trackId` + `paymentUrl` |
| `GET /fapi/payment/callback` | Where the gateway returns the buyer; shows "در حال بررسی…" then calls verify |
| `GET /fapi/payment/callback/resolve` | Same, server-side, for browsers without JavaScript |
| `POST /fapi/payment/verify` | Calls `/v1/verify` and decides the outcome |
| `GET /fapi/payment/result/:trackId` | Buyer details parsed back out of `description` (in memory, 15 min TTL) |

### Flow

1. Checkout posts the form. The server validates every field again
   (`server/validation.ts`), sanitizes it, and **ignores the amount the browser
   sent** — `server/pricing.ts` re-reads the payable amount from the same
   `iransiim.ir/api/search` service the UI quotes from. A stale price comes back
   as `409 price-changed`; a sold number as `409 number-unavailable`.
2. A v4 UUID becomes `orderId`. The buyer fields are `JSON.stringify`-ed into
   `description` (field lengths are capped so the JSON always stays small and
   valid). Amount is converted Toman → Rial.
3. On `result: 100`, `trackId` is written to the ledger and the browser is sent
   to `gateway.zibal.ir/start/{trackId}`.
4. The callback's `success`/`status` params are used **only** for the interim
   message. The decision comes from `/v1/verify`: `100` = just verified,
   `201` = already verified. The returned `amount` must equal the amount stored
   at request time, or the payment is rejected.

### The transaction ledger — and why it exists

Purchase data is deliberately not written to the main database, but two things
still need to survive a page refresh, so `server/transactionStore.ts` keeps a
small JSON file (`DATA_DIR/transactions.json`, a named volume in Docker):

- **Idempotency.** The gateway can return the buyer to the callback more than
  once (refresh, back button, gateway retry), and Zibal answers `201` rather
  than an error for an already-verified transaction. Without a record of which
  `trackId`s were already fulfilled, one purchase could be processed twice. The
  `delivered` flag makes post-payment processing run exactly once — `firstTime`
  in the verify response tells the caller which case it hit.
- **A trustworthy expected amount.** Verify has to compare Zibal's reported
  amount against what the transaction was created with. Keeping that number in
  the browser or the query string would make it forgeable, so it lives here.

Each row holds only ids, amount, the purchased number and status. No buyer PII
is written to disk — that stays in Zibal's `description` and is read back at
verify time into a 15-minute in-memory map.

### Production deployment

```bash
cp .env.example .env       # then set the production values below
docker compose up -d --build
```

| Variable | Production value | Why it matters |
| --- | --- | --- |
| `PUBLIC_BASE_URL` | `https://iransiim.ir` | The gateway callback is built from it. With `NODE_ENV=production` the server refuses to start on http or localhost, so a wrong value fails loudly at boot instead of silently after a real payment. |
| `ZIBAL_MERCHANT` | sandbox `zibal`, or the real merchant id | Must match the domain registered with Zibal. |
| `NUMBER_SEARCH_ORIGIN` | the API backend origin | **Never the domain this server answers on** — see below. |
| `WEB_BIND` | `127.0.0.1` (default) | nginx listens on loopback; the CDN/edge or a host reverse proxy fronts it. Set `0.0.0.0` to publish directly. |

nginx reads its upstreams from the environment: `docker/nginx/default.conf.template`
is rendered by the nginx image's envsubst step at container start, filtered to
`NUMBER_SEARCH_*` and `PRODUCT_IMAGE_*` so nginx's own `$host`/`$uri` survive.

> **Proxy loop.** The app and the API share `iransiim.ir`, so `location /api/`
> must forward to the API backend's own address — not to the public domain,
> which routes through the CDN straight back into this same block.
>
> nginx tags every request it forwards with `X-Iransiim-Api-Proxy` and returns
> `508` the moment it sees that header arrive on an inbound request, so a wrong
> `NUMBER_SEARCH_ORIGIN` fails in about a millisecond with a readable message
> instead of consuming every worker. Verified by pointing the origin at the
> server itself:
>
> ```
> $ curl -X POST https://.../api/search -d '{"pattern":"..."}'
> NUMBER_SEARCH_ORIGIN points back at this server - fix it in .env
> [HTTP 508 in 0.001410s]
> ```

### Bare-metal nginx in front

`docker-compose.yml` publishes the web container on `127.0.0.1:8080`
(`WEB_BIND`/`WEB_PORT`), so a host nginx forwards everything to
`http://127.0.0.1:8080`. A ready server block is in
`docker/nginx/host-iransiim.ir.conf`:

```bash
sudo cp docker/nginx/host-iransiim.ir.conf /etc/nginx/sites-available/iransiim.ir
sudo ln -s /etc/nginx/sites-available/iransiim.ir /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Two backends share the domain, so the host splits them by prefix:

| Prefix | Goes to |
| --- | --- |
| `/api/` | the store backend (search, catalogue) |
| `/fapi/` | the payment server in Docker |
| `/` | the SPA container (also serves `/product-image/`, `/assets/`) |

Verified end to end with a host nginx in front of both: `/api/search` reached
the store backend, `/fapi/payment/healthz` reached the payment server, `/`
returned the SPA, a real `trackId` came back from Zibal through the full chain,
and the callback page rendered pointing at `/fapi/payment/verify`.
`X-Forwarded-For` survives the hop too — a request tagged `5.5.5.5` was logged
by the container as that address rather than as the proxy.

Because `/api/` now terminates at the store backend, the container's own
`/api/` proxy block is bypassed in this topology; it only matters when the
container runs standalone.

### Building on a server without international access

`registry.npmjs.org` is unreachable from the production server, so a stock
`npm ci` hangs until it dies with `Exit handler never called!` — that is npm
giving up on the network, not an npm bug. The build therefore defaults to the
Parspack mirror:

```
NPM_REGISTRY=https://mirror.abrha.net/repository/npm/
```

It is an `ARG` in the Dockerfile and an entry in `.env` that compose forwards as
a build arg, so `docker compose up --build` works on the server with no extra
flags. Override it on a host with direct access:

```bash
docker compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org
```

**The lockfile stays portable.** Its 272 `resolved` entries still name
`registry.npmjs.org`, but npm substitutes the configured registry host when it
fetches. Verified with a clean cache: 351 requests, all to `mirror.abrha.net`,
none to npmjs.org. The only `github.com` strings in the lockfile are `funding`
metadata, never fetched.

To check what a given machine can actually reach:

```bash
bash scripts/probe-registries.sh                          # run ON the server
bash scripts/probe-registries.sh https://another/mirror/  # add candidates
```

#### Shipping the source

The project is not under version control, so updates move as an archive rather
than a `git pull`:

```bash
./scripts/pack-source.sh        # ~108 KB, 80 files, excludes node_modules

scp dist-images/iransiim-source.tar.gz root@SERVER:/srv/app/
# on the server:
tar -xzf iransiim-source.tar.gz
rm -f docker/nginx/default.conf src/components/store/GiftPackagesCard.tsx
docker compose build --no-cache && docker compose up -d
```

`tar -x` overwrites but never deletes, so files dropped from the project have to
go by hand. `docker/nginx/default.conf` matters most: nginx loads every file in
`conf.d/`, so leaving the old one next to the rendered template gives duplicate
`location` blocks.

#### Fallback: ship prebuilt images

If the mirror is ever down, build where the network works and move the images:

```bash
./scripts/save-images.sh        # builds both images, packs them (~104 MB)

scp dist-images/iransiim-images.tar.gz docker-compose.yml .env root@SERVER:/srv/app/

# on the server:
gunzip -c iransiim-images.tar.gz | docker load
docker compose up -d --no-build
```

`--no-build` keeps the server out of any registry: the images already contain
`node_modules`, the built SPA and nginx. Loading takes about three seconds.

### Testing

```bash
npx tsx scripts/test-payment-logic.ts   # 23 assertions, mock gateway, no real payment
npm run test:zibal                      # real sandbox gateway, prints a payment URL
```

`test-payment-logic.ts` stubs both the gateway and the price service, so it can
cover what a real payment cannot be scripted through: successful verify, the
repeat-verify path, amount mismatch, and an unknown `trackId`.
`test-zibal-flow.sh` hits the real sandbox merchant and stops at the browser
step, printing the follow-up curl commands.

### Layout

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build; targets `dev`, `api`, `build`, `runtime` |
| `docker-compose.yml` | `web` (nginx), `api` (payments) and `dev` (profile-gated) services |
| `server/` | Express payment service (Zibal request / callback / verify) |
| `scripts/` | Payment flow tests |
| `docker/nginx/default.conf` | nginx server block for the runtime image |
| `.dockerignore` | Keeps `node_modules`, `dist`, `.env*` and VCS files out of the context |

### Notes

- `package-lock.json` is present, so the image builds with `npm ci` for
  reproducible installs.
- Apart from the number search and payments, the app still runs on mock
  services in `src/services/`. A static SPA bakes build-time values into the
  bundle, so secrets — `GEMINI_API_KEY` and `ZIBAL_MERCHANT` alike — must stay
  on the server, never in a `VITE_*` variable.
- `docker compose up` requires `ZIBAL_MERCHANT` in a `.env` next to the compose
  file; the `api` service refuses to start without it.
