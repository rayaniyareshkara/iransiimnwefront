# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Iransiim Store & Admin — Vite + React 19 SPA
#
# Targets:
#   dev     -> Vite dev server with HMR (used by the "dev" compose profile)
#   runtime -> nginx serving the static production build (default target)
# ---------------------------------------------------------------------------

ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=1.27-alpine


# ---------------------------------------------------------------------------
# deps: install node modules once and share them with the other stages
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Registry to install from. Defaults to the Parspack mirror, which is reachable
# from Iranian hosts that cannot get to registry.npmjs.org. npm rewrites the
# registry host in package-lock.json's "resolved" URLs, so the lockfile stays
# portable and no request leaves for npmjs.org.
# Override for a host with direct access:
#   docker compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_REGISTRY=https://mirror.abrha.net/repository/npm/

COPY package.json package-lock.json* ./

# Long, patient retries. On a slow link npm's stock timeout aborts mid-download
# and the run dies with "Exit handler never called!", which reads like an npm
# bug but is really the network giving up.
#
# --no-audit and --no-fund drop two extra registry round-trips that add nothing
# to a build and are often the ones that stall.
ENV NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_PROGRESS=false

RUN --mount=type=cache,target=/root/.npm \
    npm config set registry "$NPM_REGISTRY" && \
    if [ -f package-lock.json ]; then \
        npm ci --prefer-offline; \
    else \
        npm install; \
    fi


# ---------------------------------------------------------------------------
# dev: hot-reloading development server
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# `npm run dev` already binds 0.0.0.0:3000 so the port is reachable from the host.
CMD ["npm", "run", "dev"]


# ---------------------------------------------------------------------------
# api: Express payment server (Zibal gateway)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY server ./server
# The transaction ledger lives here; mount a volume so it survives restarts.
RUN mkdir -p /app/server-data
ENV DATA_DIR=/app/server-data
EXPOSE 8787
# Call the local binary rather than `npx`: on a host without registry access
# npx can decide the package is missing and try to fetch it, which would hang
# the container at startup instead of failing fast.
CMD ["node_modules/.bin/tsx", "server/index.ts"]


# ---------------------------------------------------------------------------
# build: produce the static bundle in /app/dist
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# ---------------------------------------------------------------------------
# runtime: nginx serving the build with SPA history-API fallback
# ---------------------------------------------------------------------------
FROM nginx:${NGINX_VERSION} AS runtime

# Replace the stock server block with the SPA-aware one. It is a template:
# the nginx entrypoint runs envsubst over /etc/nginx/templates at startup, so
# upstream origins come from the environment instead of being baked in.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Only substitute our own placeholders; nginx runtime variables such as $host
# and $uri must survive untouched.
ENV NGINX_ENVSUBST_FILTER="^(NUMBER_SEARCH_|PRODUCT_IMAGE_)"


COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
