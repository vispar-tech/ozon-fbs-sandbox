# backend — FastAPI-бэкенд ozon-fbs-sandbox

Контракт для AI-агентов — в `AGENTS.md` (этот файл — обзор для людей).

## Стек

Python 3.14 + Poetry + FastAPI + SQLAlchemy (postgresql, asyncpg) + alembic.

## Запуск

```bash
poetry install
poetry run python -m backend
```

Приложение: http://localhost:3000 — swagger `/api/docs`, health `GET /api/health`.

## Окружение

```bash
cp .env.example .env   # оба файла внутри backend/
```

Все переменные с префиксом `BACKEND_` (читает pydantic-settings на старте):

- `BACKEND_HOST` — 127.0.0.1 локально, 0.0.0.0 в Docker
- `BACKEND_PORT=3000` — согласован с nginx (prod) и vite (dev)
- `BACKEND_DB_HOST` / `BACKEND_DB_PORT=5432` / `BACKEND_DB_USER` / `BACKEND_DB_PASS` / `BACKEND_DB_BASE` — подключение к PostgreSQL

## Тесты и lint

```bash
poetry run pytest
poetry run pre-commit run -a   # ruff-format + ruff + mypy; конфиг — в корне репо
```

Из корня: `make test`, `make lint-backend`.

## Миграции

```bash
poetry run alembic upgrade head   # или make migrate из корня
```

## Docker

Основной стек — из корня репозитория: `make docker-up` → frontend `:8080` (nginx-прокси `/api`) → backend `:3000` + postgres `:5432` (см. `docker-compose.yml` в корне). Dev-режим — `make docker-dev-up` (override `docker-compose.dev.yml`: reload, migrator, изолированная БД). Оба стека читают `backend/.env` через `env_file`.

## Структура

```
backend/
├── backend/            # пакет приложения
│   ├── __main__.py     # точка входа (uvicorn/gunicorn)
│   ├── settings.py     # настройки (env_prefix BACKEND_)
│   ├── log.py          # loguru
│   ├── web/            # application.py, lifespan.py, api/ (router.py + роутеры)
│   ├── db/             # base, repositories, models, dependencies, migrations/ (alembic)
│   ├── services/       # base.py (BaseService)
│   └── static/         # статика swagger
├── tests/              # pytest
├── alembic.ini
├── pyproject.toml
└── poetry.lock
```
