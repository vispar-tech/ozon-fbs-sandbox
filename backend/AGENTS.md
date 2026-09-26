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
| `poetry run ruff check backend tests scripts` | линт |
| `poetry run mypy backend tests scripts` | проверка типов |
| `poetry run alembic upgrade head` | применить миграции |
| `poetry run python scripts/fetch_ozon_fixture.py ...` | скачать реальный ответ Ozon Seller API в `data/fixtures/` (ключи — флаги `--client-id`/`--api-key` или env `OZON_CLIENT_ID`/`OZON_API_KEY`) |
| `poetry run python scripts/dump_openapi.py <path>` | дамп собственной OpenAPI-схемы в JSON (офлайн: без сервера и БД); вход для `make generate-api-types` из корня |

## Окружение

- `backend/.env` (шаблон `backend/.env.example`), читается pydantic-settings на старте приложения; префикс `BACKEND_`.
- В том же `.env` лежат script-only `OZON_CLIENT_ID`/`OZON_API_KEY` (для `scripts/fetch_ozon_fixture.py`); `Settings` их не читает, поэтому в `settings.py` стоит `extra="ignore"` — иначе старт падает с `extra_forbidden`.
- Переменные: `BACKEND_HOST` (127.0.0.1 локально, 0.0.0.0 в Docker), `BACKEND_PORT=3000`, `BACKEND_DB_HOST` (localhost), `BACKEND_DB_PORT=5432`, `BACKEND_DB_USER`, `BACKEND_DB_PASS`, `BACKEND_DB_BASE` (имя БД; prod — `ozon_fbs_sandbox`), `BACKEND_DB_ECHO=False`, `BACKEND_RELOAD` (закомментирован в `.env.example`).
- pytest через `pytest-env` пинит тестовую БД `BACKEND_DB_BASE=ozon_fbs_sandbox_test` (`[tool.pytest.ini_options]` в `pyproject.toml`); conftest создаёт/дропает её и строит схему через `meta.create_all`.
- Docker-стеки из корня (`docker-compose.yml` / `docker-compose.dev.yml`) читают тот же `backend/.env` через `env_file`; `environment:` в compose имеет приоритет. Postgres-сервис `db` + one-shot `migrator` (`alembic upgrade head`) — в prod-compose; backend ждёт `db` healthy и `migrator` completed.

## API

- Префикс `/api`: `GET /api/health` (smoke-URL в CI), `/api/docs` (swagger), `/api/redoc`, `/api/openapi.json`; статика swagger — `/static`.
- БД — PostgreSQL через SQLAlchemy (async, asyncpg); engine создаётся в lifespan и хранится на `app.state`.

### Seller-контур (`/v1/*`, `/v3/*`, `/v4/*`)

- Монтируется на корень приложения через `root_router` (`api/router.py`), вне префикса `/api` — пути повторяют Ozon Seller API.
- Роуты: `POST /v1/seller/info`, `POST /v1/roles` (`api/seller/routes.py`), `POST /v3/product/list`, `POST /v4/product/info/attributes` (`api/seller/products.py`); все требуют аутентификацию.
- Карточки товаров отдают типизированные JSON-фикстуры целиком; фильтры, пагинация и сортировка в упрощённой версии игнорируются.
- Аутентификация — `seller_auth` (`api/seller/deps.py`), четырёхшаговый Ozon-порядок по заголовкам `Client-Id`/`Api-Key`/`Content-Type`: отсутствующие заголовки → 401/16; не-JSON Content-Type → 400/4; невалидный Client-Id → 400/3; неизвестный клиент/неверный ключ/просроченные роли → 404/5.
- Единый формат ошибок — `{code, message, details}` (`OzonError` в `web/errors.py`, parity с googlerpcStatus) для обоих контуров; глобальные хендлеры маппят HTTPException/validation/unhandled в Ozon-тело. gRPC-коды: 3 (invalid client id / invalid body), 4 (invalid content-type), 5 (invalid api-key / not found), 6 (conflict), 13 (internal), 16 (missing headers).

## Структура

- `backend/__main__.py` — точка входа (uvicorn при `reload`, иначе gunicorn); рядом `settings.py`, `log.py`, `gunicorn_runner.py`
- `backend/web/` — `application.py` (`get_app`, префикс `/api`, `docs_url=None`), `lifespan.py`, `middleware.py` (`RequireJsonMiddleware`: не-JSON Content-Type на write-роутах `/api/cabinets` → 400/3), `errors.py` (единый Ozon-контракт ошибок: схема `{code, message, details}`, константы gRPC-кодов, глобальные exception-хендлеры), `api/` — `router.py` (собирает роутеры; новые роутеры регистрируются здесь)
- `backend/db/` — `base.py`, `meta.py`, `utils.py` (create/drop database для тестов), `dependencies.py`, `models/` (SQLAlchemy-модели; `DomainModel` с `extra="forbid"` — лишние ключи отвергаются, а не тихо пишутся в БД), `repositories/` (BaseRepository), `types/` (типы доменной границы: `dates.py` — два алиаса дат, `IsoMsZ` (non-null) и `IsoMsZNullable` (nullable; на проводе `None`↔`''`, в БД `''`↔`NULL`); оба несут `WithJsonSchema` — иначе pydantic расщепляет их на `-Input`/`-Output` в OpenAPI, `pydantic_type.py` — JSONB-колонка на Pydantic-модели), `migrations/` (alembic; `alembic.ini` в `backend/`; исключён из ruff)
- `backend/schemas/` — web-DTO: `base.py` (ApiModel, from_attributes), `cabinets.py`, `dates.py` (реэкспорт дат из `db/types`), `products.py` (DTO карточек товаров v3/v4)
- `backend/services/` — `base.py` (BaseService), `fixtures.py` (типизированная загрузка JSON-фикстур)
- `backend/scripts/` — `fetch_ozon_fixture.py` (CLI: реальный ответ Ozon Seller API → `data/fixtures/`), `dump_openapi.py` (CLI: собственная OpenAPI-схема → JSON, офлайн; в CI зовётся с `PYTHONPATH=.`, т.к. там `poetry install --no-root` и корневой пакет не встаёт). Ключи `OZON_CLIENT_ID`/`OZON_API_KEY` скрипт читает сам через `load_dotenv(backend/.env)`; в `Settings` они не попадают (там `extra="ignore"`), поэтому сервисный `.env` общий с этим скриптом и значения из шаблона — `backend/.env.example`
- `backend/data/fixtures/` — `demo-cabinet.json` (кабинет: seller_info, roles), `v3-product-list.json` (список карточек v3), `v4-product-info-attributes.json` (атрибуты карточек v4)
- `backend/static/docs/` — self-hosted assets swagger-ui / redoc
- `tests/` — pytest: `conftest.py` + по файлу на роутер/модуль

## Границы

- Без RabbitMQ/очередей.

## Lint

- ruff-format (`--check`) + ruff + mypy — напрямую (команды в `Makefile` `lint-backend`; скоуп — `backend`, `tests`, `scripts`); husky-хук запускает их через `make lint`.
- mypy: `strict = true` (`backend/pyproject.toml`).
- ruff: line-length 88, complexity ≤ 10; исключён `backend/db/migrations/`; в `tests/` разрешён assert (S101).
