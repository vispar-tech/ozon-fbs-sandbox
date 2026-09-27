# AGENTS.md

Монорепо-песочница: FastAPI-бэкенд + React/Vite-фронтенд; node-тулинг — только в `frontend/` (это не pnpm workspace).

## Стек

- Python 3.14 + Poetry — `backend/` (FastAPI)
- Node ≥ 26.9.0, pnpm 12.3.4 — `frontend/` (React 19 + Vite 8 + react-router-dom); все node-утилиты (package.json, .nvmrc, eslint, tsconfig, lockfile) только внутри `frontend/`
- Типы — во `frontend/src/shared/model/` (FSD shared/model, только типы, без runtime); доменные типы — тонкие алиасы на `generated/backend-api.ts`, который генерируется из схемы бэкенда, поэтому контракт правь в бэке, а не в `.ts`
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
| `make lint` | все линтеры: ruff + mypy (backend) + eslint (frontend) |
| `make lint-backend` | ruff-format + ruff + mypy (backend) |
| `make lint-frontend` | eslint (love + simple-import-sort + no-separators) |
| `make build` | `tsc6 -b && vite build` → `dist/` |
| `make migrate` | alembic upgrade head (backend) |
| `make generate-types` | `frontend/src/shared/model/generated/ozon-api.ts` из `ozon-seller-api-schema/schemas/ozon-seller-api-openapi.json` (openapi-typescript) |
| `make generate-api-types` | `frontend/src/shared/model/generated/backend-api.ts` из схемы самого бэкенда (openapi-typescript; промежуточный дамп — `backend/scripts/dump_openapi.py`, офлайн, без БД и сервера) |
| `make docker-up` | prod-стек: frontend `:8080` (nginx) → backend `:3000` + postgres `:5432` + migrator |
| `make docker-dev-up` | dev-стек: reload + migrator + изолированная БД (override `docker-compose.dev.yml`) |
| `make docker-down` / `make docker-dev-down` | остановка стеков |

## Порты

- backend: `3000` — в Docker порт хоста закреплён маппингом compose (`127.0.0.1:3000:3000`), поэтому `BACKEND_PORT` из `.env` переопределяет только порт **внутри** контейнера; локально (`make dev-backend`) — `BACKEND_PORT` из `backend/.env`
- postgres: `5432` (prod-compose, `127.0.0.1:5432:5432`); в dev-оверлее — `5433` (изолированная БД `ozon_fbs_sandbox_dev`, свой volume `pgdata_dev`)
- frontend dev: `5173` (Vite; прокси `/api`, `/static` и `^/v[0-9]+/` → `http://localhost:3000` — seller-контур)
- frontend prod: `8080` (nginx, прокси `/api`, `/static` и `~ ^/v[0-9]+/` → `backend:3000`)

## Структура и где что менять

- `backend/` — FastAPI бэкенд: routes, services, db, settings, tests, scripts; контракт — `backend/AGENTS.md`
- `frontend/src/app/main.tsx` — entry (StrictMode), импортирует `index.scss`; `frontend/src/app/App.tsx` — BrowserRouter + Routes; `frontend/src/app/AppShell.tsx` — шапка с навигацией
- `frontend/src/pages/admin/` — дашборд продавцов; `frontend/src/pages/seller/` — детали кабинета; `frontend/src/pages/showcase/` — витрина дизайн-системы
- `frontend/src/shared/api/` — типизированный API-клиент; `frontend/src/shared/model/` — типы; `frontend/src/shared/ui/` — дизайн-система
- `frontend/eslint.config.js` — lint (love + simple-import-sort + no-separators)
- `frontend/tsconfig.base.json` — strict-конфиг (extends из app/node конфигов)
- `frontend/package.json` — единственный package.json (скрипты, зависимости, packageManager)
- `frontend/.husky/pre-commit` — husky-хук (ставится `prepare` при `pnpm install`): обновляет субмодуль схемы (fetch на каждый коммит — нужна сеть) → печатает `make generate-api-types` (дамп схемы бэкенда → `backend-api.ts`) → `pnpm generate:types` (`ozon-api.ts`) → `pnpm typecheck` → `make lint`
- `ozon-seller-api-schema/` — git submodule (vispar-tech/ozon-seller-api-schema): ежедневное зеркало OpenAPI-схемы Ozon Seller API; контракт — `ozon-seller-api-schema/AGENTS.md`
- `.github/workflows/ci.yml` — единственный CI-workflow (см. секцию CI)
- `Makefile` — команды из корня
- `docker-compose.yml` — prod-стек (frontend, backend, postgres `db`, one-shot `migrator`); `docker-compose.dev.yml` — dev-оверлей (reload, migrator, изолированная БД); `backend/Dockerfile`, `frontend/Dockerfile` — контейнеризация
- backend-линтеры: ruff-format + ruff + mypy (конфиг — `backend/pyproject.toml`); запускаются напрямую через `make lint` (внутри husky-хука)
- `backend/.env.example` — шаблон окружения (переменные `BACKEND_*` + `OZON_CLIENT_ID`/`OZON_API_KEY`, которые читают только скрипты)

## Окружение

- pydantic-settings читает `backend/.env` на старте приложения (env_prefix `BACKEND_`); шаблон — `backend/.env.example`.
- Docker-стеки (prod и dev) читают тот же `backend/.env` через `env_file` (`required: false`); `environment:` в compose имеет приоритет — пины: prod — `BACKEND_HOST`/`BACKEND_PORT`/`BACKEND_RELOAD=False` + `BACKEND_DB_HOST=db`/`BACKEND_DB_PORT=5432`/`BACKEND_DB_USER`/`BACKEND_DB_PASS`/`BACKEND_DB_BASE` (postgres-сервис); dev-оверлей поверх prod — `BACKEND_RELOAD=True` (backend), `BACKEND_RELOAD=False` (migrator).
- У frontend нет env; прокси-URL захардкожен в `frontend/vite.config.ts` и `frontend/nginx.conf`.
- Локально рядом с compose-файлами может лежать gitignored `docker-compose.override.yml` — Compose подхватывает его **автоматически**, когда в команде нет явного `-f`. `make docker-up`/`make docker-down` поэтому заданы с `-f docker-compose.yml` явно; чистый prod-стек = `docker compose -f docker-compose.yml up -d --build`.

## Работа с AI-агентами (opencode)

- `AGENTS.md` (корень) + `backend/AGENTS.md` + `frontend/AGENTS.md` + `ozon-seller-api-schema/AGENTS.md` (субмодуль) — контракты; ближайший файл в дереве имеет приоритет.
- `CODE_STYLE.md` (корень) — как выглядит код: разделы `General code style`, `Frontend`, `Backend`. Правила помечены источником (`[ruff]`, `[eslint]`, `[tsc]`, `[pytest]` или `[наблюдение]`). Читать перед правкой кода, этот файл не дублирует стек и структуру.

## Конвенции

- Импорты: относительные — всегда с расширением `.js` (house-style; `tsconfig.app.json` использует `moduleResolution: "bundler"`, `nodenext` — только в `tsconfig.node.json` для `vite.config.ts`); порядок — `simple-import-sort`.
- Separator-комментарии (`// ---`) запрещены.
- `no-magic-numbers`: для frontend разрешены `[0,1]` (идиоматика React).
- Тесты: backend — pytest; тестов во frontend нет.
- Docker: backend — образ `python:3.14-slim-trixie` (один базовый образ + dev-target, Poetry), HEALTHCHECK на `127.0.0.1:$BACKEND_PORT/api/health`; frontend — сборка pnpm на node → runtime `nginx:alpine` (конфиг и общий `proxy-headers.conf` копируются в образ), HEALTHCHECK на `127.0.0.1`. Директив `USER`/dumb-init в Dockerfile нет.

## Git flow

- Долгоживущий `develop` + релизная `main`. Обычная работа — коммиты в `develop` и `git push origin develop`; PR для этого не нужны, squash/rebase на `develop` безвреден (он не release-база).
- Релиз: preflight `git fetch origin && git merge-base --is-ancestor origin/main origin/develop` (если `false` — `git merge origin/main`, **никогда** rebase) → PR `develop` → `main` с assignee `vispar-tech` → **merge-коммитом** `gh pr merge <N> --merge` → сразу синхронизировать develop: `git fetch origin && git push origin origin/main:develop`.
- На release-PR запрещены squash и rebase-merge: squash подменяет N коммитов develop одним посторонним коммитом в main, после чего develop перестаёт быть предком main и каждая следующая синхронизация требует rebase + force-push от человека. Именно это ломало flow после PR #9.
- Шаг синхронизации develop обязателен: merge-коммит создаётся *на* main, значит `main` не становится предком develop сам по себе. Но шаг — fast-forward, то есть безопасный: force-push не нужен ни человеку, ни агенту. Забыть недорого — `strict: true` блокирует следующий merge и предлагает «Update branch».
- Что держит схему: на `main` `required_linear_history: false` (при `true` GitHub отвергает merge-коммиты, даже когда `allow_merge_commit: true`); ruleset `main: merge-commit only` — **только на `main`** — с `allowed_merge_methods: ["merge"]`, `non_fast_forward` и `deletion`, то есть одна кнопка и серверный запрет force-push **в `main` плюс merge-коммит только**. Отдельный ruleset `Protect main and develop from deletion` накрывает `main` и `develop`, но правило в нём одно — `deletion`; force-push на `develop` сервером **не запрещён**, это осознанный риск: `develop` не release-база, force-push там ломает только историю. `dependabot.yml` со `target-branch: "develop"` у всех трёх записей, иначе dependabot растёт в `main` мимо `develop`.
- `--delete-branch` при мержаге не указывать: head release-PR — это `develop`.

## CI

- `ci.yml` — единственный workflow: триггеры — push в main + все PR; path-filter (dorny/paths-filter) только на PR, на push — все outputs true; jobs: `changes` / `frontend` / `backend` / `docker` / `verify`.
- backend-job: Python 3.14, из `backend/` — poetry install --no-root --with dev, ruff-format + ruff + mypy, pytest.
- docker-job: валидация compose (prod + dev-оверлей, merged `config --quiet`), `docker compose up -d --build` (prod) + retry-curl `http://localhost:8080/api/health`.
