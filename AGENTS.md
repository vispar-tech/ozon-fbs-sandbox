# AGENTS.md

Монорепо-песочница: Hono-бэкенд + React/Vite-клиент, pnpm workspace.

## Стек

- pnpm 12.3.4 (`packageManager` в корневом package.json), Node ≥ 26.9.0 (`.nvmrc`)
- `backend/` — Hono 4 + `@hono/node-server`, TypeScript (NodeNext), vitest
- `client/` — React 19 + Vite 8, TypeScript, без роутера/стейт-менеджера (один компонент)
- Docker: multi-stage (pnpm monorepo pattern), nginx для client, docker-compose для стека
- TypeScript 7 (native) для сборки; корневой `typescript` заалиасен на `@typescript/typescript6` — type-aware eslint работает через TS 6 API (у TS 7 нет programmatic API). Backend/client держат `typescript: ~7.0.2` для `tsc`

## Команды

| Команда | Что делает |
|---|---|
| `pnpm install` | установка (в CI — `--frozen-lockfile`) |
| `pnpm dev` | backend (`:3000`) + client (`:5173`) через concurrently |
| `pnpm dev:backend` / `pnpm dev:client` | отдельный воркспейс |
| `pnpm build` | backend (`tsc -p tsconfig.build.json`) + client (`tsc -b && vite build`) |
| `pnpm generate:types` | `shared/src/generated/ozon-api.ts` из `.schemas/ozon-seller-api-openapi.json` (openapi-typescript) |
| `pnpm lint` | eslint (eslint-config-love, корневой `eslint.config.js`) |
| `pnpm test` | vitest (backend) |
| `docker compose up --build` | стек: client `:8080` (nginx) → backend `:3000` |

## Порты

- backend: `3000` (переопределяется `PORT` из `.env` / `backend/.env`)
- client dev: `5173` (Vite, прокси `/api` → `http://localhost:3000`)
- client prod: `8080` (nginx, прокси `/api` → `backend:3000`)

## Структура и где что менять

- `backend/src/app.ts` — Hono app и ВСЕ роуты (`GET /`, `GET /api/hello`). Новые API-эндпоинты — сюда.
- `backend/src/index.ts` — точка входа: `serve` + валидация `PORT` (throw при нечисловом/вне 1–65535).
- `backend/src/app.test.ts` — vitest-тесты через `app.request()` без поднятия сервера.
- `backend/tsconfig.json` — dev/editor-конфиг (включает тесты); `tsconfig.build.json` — build (исключает `src/**/*.test.ts`).
- `client/src/main.tsx` — entry (StrictMode); `client/src/App.tsx` — единственный компонент (счётчик + fetch `/api/hello`).
- `client/src/App.css` / `index.css` — plain CSS, CSS-переменные, dark mode. Без CSS-модулей/Tailwind.
- `client/vite.config.ts` — dev-прокси `/api` (хардкод `localhost:3000`).
- `client/nginx.conf` — prod: раздача `dist/`, прокси `/api`, security-заголовки, gzip, кэш `/assets/` (immutable, Vite хэширует имена).
- `shared/` — workspace-пакет `@ozon-sandbox/shared` (ТОЛЬКО типы, без runtime): доменные типы (`fixtures`/`cabinet`/`errors`/`api`) + `src/generated/ozon-api.ts` (генерация из OpenAPI-схемы Ozon, коммитится). `shared/src/generated/**` исключён из eslint.
- `.schemas/ozon-seller-api-openapi.json` — OpenAPI 3.0 схема Ozon (git-ignored, локальная); источник для `pnpm generate:types`.
- `eslint.config.js` — корневой lint (love + кастомное правило no-separators; no-magic-numbers ослаблен для client `[0,1]` и тестов).
- `tsconfig.base.json` — общий strict-конфиг (strict, verbatimModuleSyntax, noUnused*).
- `.github/workflows/` — CI: `ci.yml` (push main/develop), `pull-request.yml` (path-filter backend/client/docker + verify).
- `docker-compose.yml`, `backend/Dockerfile`, `client/Dockerfile` — контейнеризация.
- `.env.example` — единственная переменная `PORT`.

## Окружение

- `.env.example` → `.env` (только `PORT`). `pnpm dev:backend` и `pnpm start` читают `.env` автоматически (`--env-file-if-exists`).
- У client нет env; прокси-URL захардкожен в `vite.config.ts` и `nginx.conf`.

## Работа с AI-агентами (opencode)

- `AGENTS.md` (корень) + `backend/AGENTS.md` + `client/AGENTS.md` — контракты; ближайший файл в дереве имеет приоритет.
- `.opencode/opencode.json` — project config: локальные разрешения (docker compose allow).
- `.slim/deepwork/` — прогресс-файлы длинных сессий (git-ignored, локально).

## Конвенции

- Порядок объявлений в файле: imports → константы → типы/interfaces → функции/классы; вспомогательные функции ПОСЛЕ основной (файл читается сверху вниз).
- Separator-комментарии (`// ---`) запрещены — eslint-правило `no-separators/no-separator-comments`.
- Объектные типы — через `interface`; unions/utility (`Omit<>`, `A | B`) — через `type` (eslint-config-love `consistent-type-definitions`). Приоритет над общими рекомендациями скиллов.
- `no-magic-numbers`: для client разрешены `[0,1]` (идиоматика React), для тестов выключено.
- Тесты: vitest, `app.request()` без сервера; build не должен компилировать тесты в `dist/`.
- Docker: `pnpm --filter <ws> deploy --prod` (самодостаточное prod-дерево), `USER node`, `dumb-init` (PID 1), HEALTHCHECK строго на `127.0.0.1` (busybox wget резолвит `localhost` → `::1`, а nginx слушает только IPv4).
- Dockerfile'ы копируют `tsconfig.base.json` из корня (backend tsconfig extends его — без этого docker build падает).
- Версия pnpm берётся из `packageManager` (не хардкодить в Dockerfile/CI).

## CI

- `ci.yml`: push в main/develop → lint, build, test, затем `docker compose up -d --build` + retry-curl `http://localhost:8080/api/hello` (валидирует healthcheck/depends_on/прокси).
- `pull-request.yml`: path-filter по `backend/**` / `client/**` / docker-файлам, джобы lint / build-test / docker, финальная verify-джоба.