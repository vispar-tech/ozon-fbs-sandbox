# syntax=docker/dockerfile:1
# Build context: repo root (docker build -f frontend/Dockerfile .)
# Frontend is a standalone pnpm project.

FROM node:26.9.0-alpine AS base
COPY frontend/package.json /tmp/fpkg.json
RUN npm install --global pnpm@$(node -p "require('/tmp/fpkg.json').packageManager.split('@')[1]") \
  && pnpm config set store-dir /pnpm/store \
  && rm /tmp/fpkg.json
WORKDIR /app

FROM base AS build
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/
RUN --mount=type=cache,id=pnpm-frontend,target=/pnpm/store \
  cd frontend && pnpm install --frozen-lockfile
COPY frontend/ frontend/
RUN cd frontend && pnpm build

# Development build: Vite dev server (HMR) instead of the production bundle.
# Source is bind-mounted over /app/frontend; node_modules comes from a named
# volume so the mount does not shadow the dependencies installed here.
FROM base AS dev
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/
RUN --mount=type=cache,id=pnpm-frontend,target=/pnpm/store \
  cd frontend && pnpm install --frozen-lockfile

EXPOSE 5173

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/proxy-headers.conf /etc/nginx/proxy-headers.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
