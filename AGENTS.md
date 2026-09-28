# AGENTS.md

Монорепо-песочница: FastAPI-бэкенд в `backend/`, React/Vite-фронтенд в `frontend/`.

## Стек

- Python 3.14 + Poetry, `backend/`: FastAPI, SQLAlchemy 2.0 + asyncpg, alembic, loguru, pydantic-settings с префиксом `BACKEND_`.
- Node ≥ 26.9.0, pnpm 12.3.4, `frontend/`: React 19, Vite 8, react-router-dom, zod. Пакет `typescript` заалиасен на `@typescript/typescript6`, бинарь `tsc6`.

Как выглядит код, описано в `CODE_STYLE.md`; читать перед правкой.

## Команды

Все команды из корня через `make` (`make help` печатает цели). В скобках эквивалент без make.

| Команда | Что делает |
|---|---|
| `make install` | зависимости: backend (Poetry) + frontend (pnpm) |
| `make dev` | backend + Vite; падение любого останавливает второй и завершает make |
| `make dev-backend` / `make dev-frontend` | по отдельности (`cd backend && poetry run python -m backend` / `cd frontend && pnpm dev`) |
| `make test` | pytest + coverage-гейт ≥70% (backend) |
| `make lint` | ruff + mypy (backend) + eslint (frontend) |
| `make lint-backend` / `make lint-frontend` | линтеры по одному стеку |
| `make build` | `tsc6 -b && vite build` → `frontend/dist/` |
| `make migrate` | `alembic upgrade head` (backend) |
| `make generate-types` | `frontend/src/shared/model/generated/ozon-api.ts` из `ozon-seller-api-schema/schemas/ozon-seller-api-openapi.json` |
| `make generate-api-types` | `frontend/src/shared/model/generated/backend-api.ts` из схемы бэкенда; промежуточный дамп `backend/scripts/dump_openapi.py` работает офлайн, без БД и сервера |
| `make docker-up` | prod-стек: nginx-фронт + backend + postgres + one-shot migrator |
| `make docker-dev-up` | dev-стек: reload + migrator + изолированная БД + dev-фронт (оверлей `docker-compose.dev.yml`) |
| `make docker-down` / `make docker-dev-down` | остановить стек |

Husky-хук `frontend/.husky/pre-commit` обновляет субмодуль схемы, перегенерирует оба `generated/*.ts` и зовёт `pnpm typecheck` + `make lint`. Типы коммитятся уже прогнанными, руками их не править.

## Порты

- backend `3000`. В Docker порт хоста закреплён маппингом compose (`127.0.0.1:3000:3000`), поэтому `BACKEND_PORT` из `.env` меняет порт только внутри контейнера; локально его читает `make dev-backend`.
- postgres `5432` в prod-compose и `5433` в dev-оверлее, где БД `ozon_fbs_sandbox_dev` изолирована и живёт в своём volume `pgdata_dev`.
- frontend `5173` (Vite) локально и в dev-стеке Docker; в dev-стеке `8080` не публикуется.
- frontend `8080` (nginx) в prod-стеке.

## Структура

- `backend/`, `frontend/`, `ozon-seller-api-schema/` (git submodule, ежедневное зеркало OpenAPI-схемы Ozon Seller API) — у каждого свой контракт рядом, ближайший файл в дереве приоритетнее.

## Окружение

- Приложение читает `backend/.env` через pydantic-settings, шаблон `backend/.env.example`. Список переменных в `backend/AGENTS.md`.
- Docker-стеки читают тот же файл через `env_file`, а `environment:` в compose перекрывает его пинами.
- Рядом с compose-файлами может лежать gitignored `docker-compose.override.yml`, и Compose подхватывает его сам, если в команде нет явного `-f`. `make docker-up`/`make docker-down` заданы с `-f docker-compose.yml` явно. Чистый prod-стек: `docker compose -f docker-compose.yml up -d --build`.

## Границы

- Меняй только тот каталог, в котором работаешь. Все node-конфиги (package.json, .nvmrc, eslint, tsconfig, lockfile) лежат только в `frontend/`, pnpm workspace в корне нет.
- `frontend/dist/` это артефакт сборки, не редактировать.

## Git flow

- Долгоживущий `develop`, релизная `main`. Обычная работа идёт коммитами в `develop` и `git push origin develop`; PR для этого не нужен, squash/rebase на `develop` безвреден.
- Релиз: `git fetch origin && git merge-base --is-ancestor origin/main origin/develop`. Если `false`, делаем `git merge origin/main` (никогда rebase). Дальше PR `develop` → `main` с assignee `vispar-tech`, мерж `gh pr merge <N> --merge`, и сразу синхронизация develop: `git fetch origin && git push origin origin/main:develop`.
- На release-PR только merge-коммит. Squash подменяет N коммитов develop одним коммитом в main, после чего develop перестаёт быть предком main и каждая следующая синхронизация требует rebase и force-push от человека. Шаг синхронизации сам по себе fast-forward, force-push не требуется. `--delete-branch` не указывать: head это develop.
- Схему держит сервер: на `main` `required_linear_history: false`, ruleset разрешает merge-коммит и запрещает force-push и удаление `main`. Удаление `develop` запрещено отдельным ruleset, а force-push на `develop` сервером разрешён намеренно: `develop` не release-база. Dependabot у всех трёх записей target `develop`.
- Заголовок PR пишется по тем же правилам, что и сообщение коммита: Conventional Commits с gitmoji, английский, с маленькой буквы, без точки в конце. Описание PR — по-русски, проект для русскоязычной аудитории. Заголовок не пересказывает список коммитов, а называет результат одной строкой, как `feat: :sparkles: ship the coverage page`.
- Заголовок issue следует той же логике, что и заголовок PR: английский, с маленькой буквы, префикс из шаблона. Тело issue и PR по-русски. Шаблоны в `.github/` переведены, потому что видят люди: `name`, `description`, подписи полей, плейсхолдеры и варианты списков — по-русски, а `labels` и префиксы заголовков остаются английскими, они нужны для фильтров и поиска.

## CI

`.github/workflows/ci.yml`, единственный workflow: push в main и все PR, jobs `changes` / `frontend` / `backend` / `docker` / `verify`.
- path-filter (dorny/paths-filter) считает затронутые файлы только на PR. На push все outputs true, потому что CI гоняет всё.
- Гейт покрытия отдельным шагом не описан: `fail_under = 70` лежит в `[tool.coverage.report]` (`backend/pyproject.toml`), поэтому `backend` краснеет на падении покрытия сам.
- `docker` поднимает prod-стек и ждёт `http://localhost:8080/api/health`, так что локальная проверка `make docker-up` перед коммитом не лишняя.
