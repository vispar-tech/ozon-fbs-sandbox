# ozon-fbs-sandbox

<p align="center"><img src="frontend/public/favicon.svg" width="64" height="64" alt="Ozon FBS Sandbox"></p>

Монорепо-песочница: FastAPI-бэкенд + React/Vite-фронтенд.

## Требования

- Python ≥ 3.14 + Poetry (backend)
- Node.js ≥ 26.9.0 + pnpm 12.3.4 (frontend, только внутри `frontend/`)

## Запуск

Всё управление — из корня через `make` (см. `make help`).

Локальная разработка: `make install` (первый раз) → `make dev` — backend на `:3000` и Vite на `:5173` (Ctrl+C останавливает оба).

Docker: `make docker-up` — prod-стек (frontend на `http://localhost:8080`, nginx-прокси `/api` → backend, postgres + migrator); `make docker-dev-up` — dev-стек (reload + migrator + изолированная БД).

## Команды

| Команда | Что делает |
|---|---|
| `make install` | установка зависимостей backend (Poetry) и frontend (pnpm) |
| `make dev` | backend `:3000` + Vite `:5173` (Ctrl+C останавливает оба) |
| `make dev-backend` / `make dev-frontend` | по отдельности |
| `make test` | pytest (backend) |
| `make lint` | pre-commit (backend) + eslint (frontend) |
| `make build` | сборка frontend → `dist/` |
| `make migrate` | alembic upgrade head |
| `make generate-types` | `frontend/src/shared/model/generated/ozon-api.ts` из OpenAPI-схемы |
| `make docker-up` | prod-стек: frontend `:8080` (nginx) → backend `:3000` + postgres `:5432` + migrator |
| `make docker-dev-up` | dev-стек: reload + migrator + изолированная БД |
| `make docker-down` / `make docker-dev-down` | остановка стеков |

## Структура

- `backend/` — FastAPI-бэкенд (Python 3.14, Poetry), порт `3000`
  - `backend/` — приложение: routes, services, db, settings
  - `tests/` — pytest-тесты
  - `pyproject.toml` + `poetry.lock` — зависимости (Poetry)
  - `Dockerfile` — multi-stage (poetry)
- `frontend/` — React 19 + Vite 8, FSD:
  - `src/app/` — entry, router, shell
  - `src/pages/` — страницы (admin, seller, showcase)
  - `src/shared/model/` — типы (FSD shared/model, только типы)
  - `src/shared/ui/` — дизайн-система (SCSS Modules)
  - `pnpm-lock.yaml` — lockfile pnpm (только здесь)
  - `eslint.config.js`, `tsconfig.base.json`, `.nvmrc` — конфиги только внутри frontend

## Окружение

Скопируйте `backend/.env.example` в `backend/.env` при необходимости (переменные с префиксом `BACKEND_`, например `BACKEND_HOST`, `BACKEND_PORT`, `BACKEND_DB_HOST`, `BACKEND_DB_PORT`, `BACKEND_DB_USER`, `BACKEND_DB_PASS`, `BACKEND_DB_BASE`; читает pydantic-settings на старте). Docker-стеки читают тот же `backend/.env` через `env_file`.
