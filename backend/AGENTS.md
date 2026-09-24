# AGENTS.md — backend

FastAPI-бэкенд песочницы `ozon-fbs-sandbox`. Контракт для AI-агентов по backend; общие правила — в `../AGENTS.md` (приоритет для общих вопросов).

## Стек

- Python 3.14 (`.python-version` = 3.14.3) + Poetry
- FastAPI + uvicorn/gunicorn + SQLAlchemy (postgresql, asyncpg) + alembic (миграции) + loguru
- pydantic-settings: env_prefix `BACKEND_`

## Команды (всегда из `backend/`)

| Команда | Что делает |
|---|---|
| `poetry install` | установка зависимостей |
| `poetry run python -m backend` | старт приложения на `:3000` |
| `poetry run pytest` | тесты |
| `poetry run ruff format --check` | проверка форматирования |
| `poetry run ruff check backend tests` | линт |
| `poetry run mypy backend tests` | проверка типов |
| `poetry run alembic upgrade head` | применить миграции |

## Окружение

- `backend/.env` (шаблон `backend/.env.example`), читается pydantic-settings на старте приложения; префикс `BACKEND_`.
- Переменные: `BACKEND_HOST` (127.0.0.1 локально, 0.0.0.0 в Docker), `BACKEND_PORT=3000`, `BACKEND_DB_HOST` (localhost), `BACKEND_DB_PORT=5432`, `BACKEND_DB_USER`, `BACKEND_DB_PASS`, `BACKEND_DB_BASE` (имя БД; prod — `ozon_fbs_sandbox`), `BACKEND_DB_ECHO=False`, `BACKEND_RELOAD` (закомментирован в `.env.example`).
- pytest через `pytest-env` пинит тестовую БД `BACKEND_DB_BASE=ozon_fbs_sandbox_test` (`[tool.pytest.ini_options]` в `pyproject.toml`); conftest создаёт/дропает её и строит схему через `meta.create_all`.
- Docker-стеки из корня (`docker-compose.yml` / `docker-compose.dev.yml`) читают тот же `backend/.env` через `env_file`; `environment:` в compose имеет приоритет. Postgres-сервис `db` + one-shot `migrator` (`alembic upgrade head`) — в prod-compose; backend ждёт `db` healthy и `migrator` completed.

## API

- Префикс `/api`: `GET /api/health` (smoke-URL в CI), `/api/docs` (swagger), `/api/redoc`, `/api/openapi.json`; статика swagger — `/static`.
- БД — PostgreSQL через SQLAlchemy (async, asyncpg); engine создаётся в lifespan и хранится на `app.state`.

### Seller-контур (`/v1/*`)

- Монтируется на корень приложения через `root_router` (`api/router.py`), вне префикса `/api` — пути повторяют Ozon Seller API.
- Роуты: `POST /v1/seller/info`, `POST /v1/roles` (`api/seller/routes.py`); оба требуют аутентификацию.
- Аутентификация — `seller_auth` (`api/seller/deps.py`), четырёхшаговый Ozon-порядок по заголовкам `Client-Id`/`Api-Key`/`Content-Type`: отсутствующие заголовки → 401/16; не-JSON Content-Type → 400/4; невалидный Client-Id → 400/3; неизвестный клиент/неверный ключ/просроченные роли → 404/5.
- Единый формат ошибок — `{code, message, details}` (`OzonError` в `web/errors.py`, parity с googlerpcStatus) для обоих контуров; глобальные хендлеры маппят HTTPException/validation/unhandled в Ozon-тело. gRPC-коды: 3 (invalid client id / invalid body), 4 (invalid content-type), 5 (invalid api-key / not found), 6 (conflict), 13 (internal), 16 (missing headers).

## Структура

- `backend/__main__.py` — точка входа (uvicorn при `reload`, иначе gunicorn); рядом `settings.py`, `log.py`, `gunicorn_runner.py`
- `backend/web/` — `application.py` (`get_app`, префикс `/api`, `docs_url=None`), `lifespan.py`, `middleware.py` (`RequireJsonMiddleware`: не-JSON Content-Type на write-роутах `/api/cabinets` → 400/3), `errors.py` (единый Ozon-контракт ошибок: схема `{code, message, details}`, константы gRPC-кодов, глобальные exception-хендлеры), `api/` — `router.py` (собирает роутеры; новые роутеры регистрируются здесь)
- `backend/db/` — `base.py`, `meta.py`, `utils.py` (create/drop database для тестов), `dependencies.py`, `models/` (SQLAlchemy-модели), `repositories/` (BaseRepository), `types/` (типы доменной границы: `dates.py` — iso-ms-Z сериализация, `pydantic_type.py` — JSONB-колонка на Pydantic-модели), `migrations/` (alembic; `alembic.ini` в `backend/`; исключён из ruff)
- `backend/schemas/` — web-DTO: `base.py` (ApiModel, from_attributes), `cabinets.py`, `dates.py` (реэкспорт дат из `db/types`)
- `backend/services/` — `base.py` (BaseService)
- `backend/data/fixtures/` — `demo-cabinet.json` (фикстура кабинета: seller_info, roles)
- `backend/static/docs/` — self-hosted assets swagger-ui / redoc
- `tests/` — pytest: `conftest.py` + по файлу на роутер/модуль

## Границы

- Без RabbitMQ/очередей.

## Lint

- ruff-format (`--check`) + ruff + mypy — напрямую (команды в `Makefile` `lint-backend`); husky-хук запускает их через `make lint`.
- mypy: `strict = true` (`backend/pyproject.toml`).
- ruff: line-length 88, complexity ≤ 10; исключён `backend/db/migrations/`; в `tests/` разрешён assert (S101).
