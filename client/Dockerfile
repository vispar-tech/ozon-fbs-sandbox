# syntax=docker/dockerfile:1
# Build context: repo root (docker build -f client/Dockerfile .)
# Pattern: pnpm.io/docker monorepo (Example 2) build stage + nginx runtime

FROM node:26.9.0-alpine AS base
# pnpm version from packageManager field (single source of truth)
COPY package.json ./
RUN npm install --global pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]") \
  && pnpm config set store-dir /pnpm/store
WORKDIR /app

FROM base AS build
# Lockfile + manifests first: layer cached until dependencies change
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY backend/package.json backend/
COPY client/package.json client/
COPY shared/package.json shared/
RUN --mount=type=cache,id=pnpm-client,target=/pnpm/store \
  pnpm install --frozen-lockfile
COPY client/ client/
COPY shared/ shared/
RUN pnpm --filter client build

FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1