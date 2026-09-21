# AGENTS.md — backend

Hono-воркспейс монорепо `ozon-fbs-sandbox`. Корневые правила — в `../AGENTS.md`; этот файл уточняет их для backend.

## Стек

- Hono 4 + `@hono/node-server`, TypeScript (NodeNext), vitest
- Node ≥ 26.9.0, pnpm 12.3.4 (workspace)

## Команды (из корня репо)

| Команда | Что делает |
|---|---|
| `pnpm dev:backend` | dev-сервер на `:3000` (tsx watch, читает `backend/.env`) |
| `pnpm --filter backend build` | `tsc -p tsconfig.build.json` → `dist/` |
| `pnpm --filter backend start` | `node --env-file-if-exists=.env dist/index.js` |
| `pnpm test` | vitest (backend) |

## Структура

- `src/app.ts` — Hono app и ВСЕ роуты (`GET /`, `GET /api/hello`). Новые эндпоинты — сюда.
- `src/index.ts` — точка входа: `serve` + валидация `PORT` (throw при нечисловом/вне 1–65535).
- `src/app.test.ts` — vitest-тесты через `app.request()` без поднятия сервера.
- `tsconfig.json` — dev/editor (включает тесты); `tsconfig.build.json` — build (исключает `src/**/*.test.ts`).
- `Dockerfile` — multi-stage: `pnpm --filter backend deploy --prod`, `USER node`, `dumb-init`, HEALTHCHECK на `127.0.0.1:3000/api/hello`.

## Конвенции

- Порядок объявлений: imports → константы → типы → функции/классы; вспомогательные функции ПОСЛЕ основной.
- Separator-комментарии (`// ---`) запрещены (eslint `no-separators`).
- `no-magic-numbers`: для тестов выключено; в коде — именованные константы (`DEFAULT_PORT`, `MIN_PORT`, `MAX_PORT`).
- Тесты: vitest, `app.request()`, без реального сервера.
- Импорты с расширением `.js` (NodeNext).
- Типы seller-фикстур и API — из `@ozon-sandbox/shared` (`workspace:*`), не дублировать и не хардкодить.

## Границы

- Меняй только `backend/`. Корневые конфиги (`eslint.config.js`, `tsconfig.base.json`, `package.json`, `pnpm-lock.yaml`) — общие для обоих воркспейсов: правки согласуй с корневым AGENTS.md.
- `backend/.env` — локальный, не коммитится; `.env.example` (корень) — единственный источник для новых переменных.
- `dist/` — артефакт сборки, не редактировать.