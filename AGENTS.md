# AGENTS.md

Монорепо-песочница: FastAPI-бэкенд + React/Vite-фронтенд; node-тулинг — только в `frontend/` (это не pnpm workspace).

## Стек

- Python 3.14 + Poetry — `backend/` (FastAPI)
- Node ≥ 26.9.0, pnpm 12.3.4 — `frontend/` (React 19 + Vite 8 + react-router-dom); все node-утилиты (package.json, .nvmrc, eslint, tsconfig, lockfile) только внутри `frontend/`
- Типы — во `frontend/src/shared/model/` (FSD shared/model, только типы, без runtime)
- Docker: nginx для frontend, python для backend, postgres для БД, docker-compose для стека
- TypeScript: `typescript` заалиасен на `@typescript/typescript6` (бинарь `tsc6`)

## Команды

Все команды — из корня через `make` (см. `make help`); эквиваленты без make — в скобках.

| Команда | Что делает |
|---|---|
| `make install` | установка зависимостей: backend (Poetry) + frontend (pnpm) |
| `make dev` | backend `:3000` + Vite `:5173`; падение любого останавливает второй и завершает make |
| `make dev-backend` / `make dev-frontend` | по отдельности (`cd backend && poetry run python -m backend` / `cd frontend && pnpm dev`) |
| `make test` | pytest (backend) |
| `make lint` | все линтеры: pre-commit (backend) + eslint (frontend) |
| `make lint-backend` | pre-commit: ruff-format + ruff + mypy (конфиг — `.pre-commit-config.yaml` в корне) |
| `make lint-frontend` | eslint (love + simple-import-sort + no-separators) |
| `make build` | `tsc6 -b && vite build` → `dist/` |
| `make migrate` | alembic upgrade head (backend) |
| `make generate-types` | `frontend/src/shared/model/generated/ozon-api.ts` из `.schemas/ozon-seller-api-openapi.json` (openapi-typescript) |
| `make docker-up` | prod-стек: frontend `:8080` (nginx) → backend `:3000` + postgres `:5432` + migrator |
| `make docker-dev-up` | dev-стек: reload + migrator + изолированная БД (override `docker-compose.dev.yml`) |
| `make docker-down` / `make docker-dev-down` | остановка стеков |

## Порты

- backend: `3000` (переопределяется `BACKEND_PORT` из `backend/.env`)
- postgres: `5432` (сервис `db` из compose)
- frontend dev: `5173` (Vite, прокси `/api` → `http://localhost:3000`)
- frontend prod: `8080` (nginx, прокси `/api` → `backend:3000`)

## Структура и где что менять

- `backend/` — FastAPI бэкенд: routes, services, db, settings, tests; контракт — `backend/AGENTS.md`
- `frontend/src/app/main.tsx` — entry (StrictMode), импортирует `index.scss`; `frontend/src/app/App.tsx` — BrowserRouter + Routes; `frontend/src/app/AppShell.tsx` — шапка с навигацией
- `frontend/src/pages/admin/` — дашборд продавцов; `frontend/src/pages/seller/` — детали кабинета; `frontend/src/pages/showcase/` — витрина дизайн-системы
- `frontend/src/shared/api/` — типизированный API-клиент; `frontend/src/shared/model/` — типы; `frontend/src/shared/ui/` — дизайн-система
- `frontend/eslint.config.js` — lint (love + simple-import-sort + no-separators)
- `frontend/tsconfig.base.json` — strict-конфиг (extends из app/node конфигов)
- `frontend/package.json` — единственный package.json (скрипты, зависимости, packageManager)
- `.github/workflows/ci.yml` — единственный CI-workflow (см. секцию CI)
- `Makefile` — команды из корня
- `docker-compose.yml` — prod-стек (frontend, backend, postgres `db`, one-shot `migrator`); `docker-compose.dev.yml` — dev-оверлей (reload, migrator, изолированная БД); `backend/Dockerfile`, `frontend/Dockerfile` — контейнеризация
- `.pre-commit-config.yaml` — pre-commit в корне (ruff-format + ruff + mypy для backend); `pre-commit install` из git-root работает
- `backend/.env.example` — шаблон окружения (переменные `BACKEND_*`)

## Окружение

- pydantic-settings читает `backend/.env` на старте приложения (env_prefix `BACKEND_`); шаблон — `backend/.env.example`.
- Docker-стеки (prod и dev) читают тот же `backend/.env` через `env_file` (`required: false`); `environment:` в compose имеет приоритет — пины: prod — `BACKEND_HOST`/`BACKEND_PORT`/`BACKEND_RELOAD=False` + `BACKEND_DB_HOST=db`/`BACKEND_DB_PORT=5432`/`BACKEND_DB_USER`/`BACKEND_DB_PASS`/`BACKEND_DB_BASE` (postgres-сервис); dev-оверлей поверх prod — `BACKEND_RELOAD=True` (backend), `BACKEND_RELOAD=False` (migrator).
- У frontend нет env; прокси-URL захардкожен в `frontend/vite.config.ts` и `frontend/nginx.conf`.

## Работа с AI-агентами (opencode)

- `AGENTS.md` (корень) + `backend/AGENTS.md` + `frontend/AGENTS.md` — контракты; ближайший файл в дереве имеет приоритет.

## Конвенции

- Импорты: расширение `.js` (NodeNext); порядок — `simple-import-sort`.
- Separator-комментарии (`// ---`) запрещены.
- `no-magic-numbers`: для frontend разрешены `[0,1]` (идиоматика React).
- Тесты: backend — pytest; тестов во frontend нет.
- Docker: backend — образ `python:3.14-slim-trixie` (multi-stage, Poetry), HEALTHCHECK на `127.0.0.1:3000/api/health`; frontend — сборка pnpm на node → runtime `nginx:alpine`, HEALTHCHECK на `127.0.0.1`. Директив `USER`/dumb-init в Dockerfile нет.

## CI

- `ci.yml` — единственный workflow: триггеры — push в main/develop + все PR; path-filter (dorny/paths-filter) только на PR, на push — все outputs true; jobs: `changes` / `frontend` / `backend` / `docker` / `verify`.
- backend-job: Python 3.14, из `backend/` — poetry install --no-root --with dev, pre-commit (ruff-format, ruff, mypy), pytest.
- docker-job: валидация compose (prod + dev-оверлей, merged `config --quiet`), `docker compose up -d --build` (prod) + retry-curl `http://localhost:8080/api/health`.
