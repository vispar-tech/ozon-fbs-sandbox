# ozon-fbs-sandbox

Монорепо-песочница: Hono-бэкенд + React/Vite-клиент, pnpm workspace.

## Требования

Node.js ≥ 26.9.0, pnpm ≥ 12. Установка: `pnpm install`.

## Запуск

Dev: `pnpm dev` — backend на `:3000`, client на `:5173` (Vite-прокси `/api` → backend).

Docker: `docker compose up --build` — client на `http://localhost:8080` (nginx-прокси `/api` → backend).

## Команды

| Команда | Что делает |
|---|---|
| `pnpm dev` | backend + client (concurrently) |
| `pnpm dev:backend` / `pnpm dev:client` | отдельный воркспейс |
| `pnpm build` | сборка backend (tsc) и client (vite) |
| `pnpm lint` | eslint |
| `pnpm test` | vitest |

## Структура

- `backend/` — Hono API, порт `3000` (переопределяется через `PORT`)
- `client/` — React + Vite, nginx-прокси `/api` → backend

## Окружение

Скопируйте `.env.example` в `.env` при необходимости (используется только `PORT`). `pnpm dev:backend` и `pnpm start` читают `.env` автоматически.