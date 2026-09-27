# AGENTS.md — backend

FastAPI-бэкенд песочницы `ozon-fbs-sandbox`. Стек, make-команды и правила написания кода описаны в корневых файлах, здесь только локальный контракт.

## Команды (всегда из `backend/`)

| Команда | Что делает |
|---|---|
| `poetry install` | установка зависимостей |
| `poetry run python -m backend` | старт приложения на `:3000` |
| `poetry run pytest` | тесты |
| `poetry run ruff format --check`, `poetry run ruff check backend tests scripts`, `poetry run mypy backend tests scripts` | линтеры, скоуп `backend tests scripts` |
| `poetry run alembic upgrade head` | применить миграции |
| `poetry run python scripts/fetch_ozon_fixture.py ...` | скачать реальный ответ Ozon Seller API в `data/fixtures/` (ключи флагами `--client-id`/`--api-key` или env `OZON_CLIENT_ID`/`OZON_API_KEY`) |
| `poetry run python scripts/dump_openapi.py <path>` | дамп собственной OpenAPI-схемы в JSON, офлайн и без сервера и БД; вход для `make generate-api-types` из корня |

## Окружение

- Полный список переменных с дефолтами в `backend/.env.example`.
- Script-only `OZON_CLIENT_ID`/`OZON_API_KEY` лежат в том же `.env` и читаются скриптами. `Settings` их не читает, поэтому в `settings.py` стоит `extra="ignore"`, иначе старт падает с `extra_forbidden`.
- pytest через `pytest-env` пинит тестовую БД `BACKEND_DB_BASE=ozon_fbs_sandbox_test` (`[tool.pytest.ini_options]` в `pyproject.toml`); conftest создаёт и дропает её и строит схему через `meta.create_all`.

## API

- Префикс `/api`: `GET /api/health` (smoke-URL в CI), `/api/docs` (swagger на self-hosted ассетах из `backend/static/docs/`), `/api/redoc`, `/api/openapi.json`.
- Engine создаётся в lifespan и хранится на `app.state`.

### Seller-контур (`/v1/*`, `/v3/*`, `/v4/*`)

- Монтируется на корень приложения через `root_router` (`api/router.py`), вне префикса `/api`, пути повторяют Ozon Seller API.
- Роуты: `POST /v1/seller/info`, `POST /v1/roles` (`api/seller/routes.py`), `POST /v3/product/list`, `POST /v4/product/info/attributes` (`api/seller/products.py`); все требуют аутентификацию.
- Карточки товаров отдают типизированные JSON-фикстуры целиком; фильтры, пагинация и сортировка в упрощённой версии игнорируются.
- Аутентификация — `seller_auth` (`api/seller/deps.py`), четырёхшаговый Ozon-порядок по заголовкам `Client-Id`/`Api-Key`/`Content-Type`: отсутствующие заголовки → 401/16; не-JSON Content-Type → 400/4; невалидный Client-Id → 400/3; неизвестный клиент, неверный ключ или просроченные роли → 404/5.
- `POST /v1/seller/info` и `POST /v1/roles` из `/api/docs` **не вызываются**: в собственной схеме бэкенда (`/api/openapi.json`, она же в `ozon-seller-api-schema`) у них нет `requestBody`, а Swagger UI не отправляет `Content-Type: application/json` без объявленного body. Эти роуты вызывают через curl или вкладку «Запросы» на `/seller/:id`; `/v3/*` и `/v4/*` из UI вызываются.
- Единый формат ошибок — `{code, message, details}` (`OzonError` в `web/errors.py`, parity с googlerpcStatus) для обоих контуров, глобальные хендлеры маппят HTTPException, validation и unhandled в Ozon-тело. Коды 3, 4, 5, 16 перечислены выше по аутентификации, остальные это 6 (conflict) и 13 (internal).

## Структура

- `backend/__main__.py` — точка входа: uvicorn при `reload`, иначе gunicorn.
- `backend/web/` — `application.py` (`get_app`, префикс `/api`, `docs_url=None`), `lifespan.py`, `middleware.py` (`RequireJsonMiddleware`: не-JSON Content-Type на write-роутах `/api/cabinets` → 400/3), `errors.py` (схема Ozon-ошибки, константы gRPC-кодов, глобальные exception-хендлеры), `api/router.py` (собирает роутеры, новые регистрируются здесь).
- `backend/db/` — `meta.py` с `naming_convention` для всех типов констрейнтов; `models/` (`DomainModel` с `extra="forbid"`, лишние ключи отвергаются, а не тихо пишутся в БД); `types/dates.py` — два алиаса дат, `IsoMsZ` (non-null) и `IsoMsZNullable` (nullable; на проводе `None`↔`''`, в БД `''`↔`NULL`), оба несут `WithJsonSchema`, иначе pydantic расщепляет их на `-Input`/`-Output` в OpenAPI; `types/pydantic_type.py` — JSONB-колонка на Pydantic-модели; `migrations/` (alembic, `alembic.ini` соседняя с пакетом, каталог выключен из ruff).
- `backend/schemas/` — web-DTO, `dates.py` реэкспортирует даты из `db/types`.
- `scripts/dump_openapi.py` — `PYTHONPATH=.` страхует на случай, когда корневой пакет не встал, например при `poetry install --no-root`. В CI не вызывается, типы лежат в git как `backend-api.ts`.
- `scripts/fetch_ozon_fixture.py` — ключи `OZON_CLIENT_ID`/`OZON_API_KEY` читает сам через `load_dotenv(backend/.env)`, поэтому сервисный `.env` общий с этим скриптом.

## Границы

- Без RabbitMQ и очередей.
