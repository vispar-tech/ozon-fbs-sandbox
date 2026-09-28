# AGENTS.md — backend

FastAPI-бэкенд песочницы `ozon-fbs-sandbox`. Стек, make-команды и правила написания кода описаны в корневых файлах, здесь только локальный контракт.

## Команды (всегда из `backend/`)

| Команда | Что делает |
|---|---|
| `poetry install` | установка зависимостей |
| `poetry run python -m backend` | старт приложения на `:3000` |
| `poetry run pytest` | тесты + coverage-гейт 70% (см. `## Coverage`) |
| `poetry run ruff format --check`, `poetry run ruff check backend tests scripts`, `poetry run mypy backend tests scripts` | линтеры, скоуп `backend tests scripts` |
| `poetry run alembic upgrade head` | применить миграции |
| `poetry run python scripts/fetch_ozon_fixture.py ...` | скачать реальный ответ Ozon Seller API в `data/fixtures/` (ключи флагами `--client-id`/`--api-key` или env `OZON_CLIENT_ID`/`OZON_API_KEY`) |
| `poetry run python scripts/dump_openapi.py <path>` | дамп собственной OpenAPI-схемы в JSON, офлайн и без сервера и БД; вход для `make generate-api-types` из корня |

## Окружение

- Полный список переменных с дефолтами в `backend/.env.example`.
- Script-only `OZON_CLIENT_ID`/`OZON_API_KEY` лежат в том же `.env` и читаются скриптами. `Settings` их не читает, поэтому в `settings.py` стоит `extra="ignore"`, иначе старт падает с `extra_forbidden`.
- pytest через `pytest-env` пинит тестовую БД `BACKEND_DB_BASE=ozon_fbs_sandbox_test` (`[tool.pytest.ini_options]` в `pyproject.toml`); conftest создаёт и дропает её и строит схему через `meta.create_all`.

## Coverage

- pytest-cov, гейт один и для локального прогона, и для CI: `--cov=backend --cov-report=term-missing` в `addopts`, `fail_under = 70` плюс `show_missing` и `skip_covered` в `[tool.coverage.report]` — всё в `backend/pyproject.toml`.
- `omit` в `[tool.coverage.run]` исключает `backend/db/migrations/`: каталог исполняет `alembic upgrade`, а не тесты, из ruff он тоже выключен.
- `backend/__main__.py` и `backend/gunicorn_runner.py` меряются и стоят на 0% — это bootstrap (uvicorn/gunicorn), юнит-тестами он не закрывается. Сейчас общий процент 91%, и около 30 statements из 53 непокрытых приходятся на эти два файла.

## API

- Префикс `/api`: `GET /api/health` (smoke-URL в CI), `/api/docs` (swagger на self-hosted ассетах из `backend/static/docs/`), `/api/redoc`, `/api/openapi.json`.
- Engine создаётся в lifespan и хранится на `app.state`.

### Seller-контур (`/v1/*`, `/v3/*`, `/v4/*`)

- Монтируется на корень приложения через `root_router` (`api/router.py`), вне префикса `/api`, пути повторяют Ozon Seller API.
- Роуты: `POST /v1/seller/info`, `POST /v1/roles` (`api/seller/views.py`), `POST /v3/product/list`, `POST /v4/product/info/attributes` (`api/products/views.py`); все требуют аутентификацию.
- Карточки товаров отдают типизированные JSON-фикстуры целиком; фильтры, пагинация и сортировка в упрощённой версии игнорируются.
- Аутентификация — `seller_auth` (`api/seller/deps.py`), там же единственный `SellerCabinetDep`, который импортируют `seller/views.py` и `products/views.py`, четырёхшаговый Ozon-порядок по заголовкам `Client-Id`/`Api-Key`/`Content-Type`: отсутствующие заголовки → 401/16; не-JSON Content-Type → 400/4; невалидный Client-Id → 400/3; неизвестный клиент, неверный ключ или просроченные роли → 404/5.
- `POST /v1/seller/info` и `POST /v1/roles` из `/api/docs` **не вызываются**: в собственной схеме бэкенда (`/api/openapi.json`, она же в `ozon-seller-api-schema`) у них нет `requestBody`, а Swagger UI не отправляет `Content-Type: application/json` без объявленного body. Эти роуты вызывают через curl или вкладку «Запросы» на `/seller/:id`; `/v3/*` и `/v4/*` из UI вызываются.
- Единый формат ошибок — `{code, message, details}` (`OzonError` в `web/errors.py`, parity с googlerpcStatus) для обоих контуров, глобальные хендлеры маппят HTTPException, validation и unhandled в Ozon-тело. Коды 3, 4, 5, 16 перечислены выше по аутентификации, остальные это 6 (conflict) и 13 (internal).

## Структура

- `backend/__main__.py` — точка входа: uvicorn при `reload`, иначе gunicorn.
- `backend/web/` — `application.py` (`get_app`, префикс `/api`, `docs_url=None`), `lifespan.py`, `middleware.py` (`RequireJsonMiddleware`: не-JSON Content-Type на write-роутах `/api/cabinets` → 400/3), `errors.py` (схема Ozon-ошибки, константы gRPC-кодов, глобальные exception-хендлеры), `api/router.py` (собирает роутеры, новые регистрируются здесь).
- `backend/web/api/` — модуль с роутами называется `views.py`, без исключений. У каждого самостоятельного контура ответственности своя подпакета с `__init__.py`, экспортирующим `router`: `seller/` (аккаунтный контур, `deps.py` плюс `views.py`, префикс `/v1` в роутере), `products/` (карточки товаров, префикса нет — версии `/v3` и `/v4` лежат в путях роутов), `cabinets/`, `coverage/` — соседи на одном уровне. Раскладка идёт по зоне ответственности, а не по версии API: версия живёт в пути (`prefix` или сегменты `/v3`, `/v4`), папку под версию не заводим.
- `backend/db/` — `meta.py` с `naming_convention` для всех типов констрейнтов; `models/` (`DomainModel` с `extra="forbid"`, лишние ключи отвергаются, а не тихо пишутся в БД); `types/dates.py` — два алиаса дат, `IsoMsZ` (non-null) и `IsoMsZNullable` (nullable; на проводе `None`↔`''`, в БД `''`↔`NULL`), оба несут `WithJsonSchema`, иначе pydantic расщепляет их на `-Input`/`-Output` в OpenAPI; `types/pydantic_type.py` — JSONB-колонка на Pydantic-модели; `migrations/` (alembic, `alembic.ini` соседняя с пакетом, каталог выключен из ruff).
- `backend/schemas/` — web-DTO, `dates.py` реэкспортирует даты из `db/types`.
- `scripts/dump_openapi.py` — `PYTHONPATH=.` страхует на случай, когда корневой пакет не встал, например при `poetry install --no-root`. В CI не вызывается, типы лежат в git как `backend-api.ts`.
- `scripts/fetch_ozon_fixture.py` — ключи `OZON_CLIENT_ID`/`OZON_API_KEY` читает сам через `load_dotenv(backend/.env)`, поэтому сервисный `.env` общий с этим скриптом.

## Границы

- Без RabbitMQ и очередей.

## Покрытие Ozon Seller API

- `GET /api/ozon-coverage` отдаёт дерево `x-tagGroups` → теги → методы и счётчики по ним. Без аутентификации, как остальной админ-контур: своей авторизации у приложения нет, а `seller_auth` эмулирует заголовки Ozon (`Client-Id`/`Api-Key`) и к этому контуру отношения не имеет.
- Источник — закоммиченное зеркало схемы `raw.githubusercontent.com/vispar-tech/ozon-seller-api-schema/main/schemas/ozon-seller-api-openapi.json`, его ежедневно обновляет cron того репозитория. `docs.ozon.ru/api/seller/swagger.json` напрямую не читается: за Qrator отдаёт 307 на страницу челленджа, поэтому и живёт зеркало.
- Флаг `implemented` ставится сверкой `(path, method)` с роутами, реально зарегистрированными в приложении. Список реализованных вести вручную нельзя: добавление seller-роута обязано сразу отражаться в отчёте, иначе он врёт.
- Схему держит `OzonSchemaService` (`services/ozon_schema.py`): синглтон на classmethod-ах, `_cache` и `_lock` объявлены на самом классе, поэтому на процесс приходится ровно один кэш, а не по одному на инстанс. TTL 5 минут, разбор JSON уходит в `asyncio.to_thread`, чтобы не блокировать event loop. Отказ зеркала не гасится: исключение доходит до общего хендлера, клиент получает 500/13, фронт показывает ретрай.
- `httpx` перенесён в `[project].dependencies` ради этого эндпоинта: `Dockerfile` ставит `poetry install --only main`, dev-группа в образ не попадает, и без переноса фича падала бы с `ImportError` только в проде.
