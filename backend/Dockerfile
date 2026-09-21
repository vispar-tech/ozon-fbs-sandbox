# syntax=docker/dockerfile:1
# Build context: repo root (docker build -f backend/Dockerfile .)
# Pattern: pnpm.io/docker monorepo (Example 2) + nodejs/docker-node BestPractices

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
RUN --mount=type=cache,id=pnpm-backend,target=/pnpm/store \
  pnpm install --frozen-lockfile
COPY backend/ backend/
COPY shared/ shared/
RUN pnpm --filter backend build
# Self-contained prod tree: only backend deps, no devDeps
RUN pnpm --filter backend deploy --prod /app/backend-prod

FROM node:26.9.0-alpine
ENV NODE_ENV=production
WORKDIR /app
# Init wrapper: Node.js was not designed to run as PID 1 (docker-node BestPractices)
RUN apk add --no-cache dumb-init
# Only what is needed to run: dist + prod deps + manifest (pnpm deploy copies the whole package)
COPY --from=build /app/backend-prod/dist ./backend/dist
COPY --from=build /app/backend-prod/node_modules ./backend/node_modules
COPY --from=build /app/backend-prod/package.json ./backend/package.json

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/hello || exit 1
CMD ["dumb-init", "node", "backend/dist/index.js"]