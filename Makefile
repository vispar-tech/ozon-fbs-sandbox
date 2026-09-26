# Единая точка входа для управления монорепо из корня.
# Полное описание команд — в AGENTS.md и README.md.

.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend \
	test lint lint-backend lint-frontend build migrate generate-types generate-api-types \
	docker-up docker-dev-up docker-down docker-dev-down

help: ## Показать доступные цели
	@grep -E '^[a-zA-Z_-]+:.*?## ' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Установить зависимости backend и frontend

install-backend: ## Установить backend-зависимости (Poetry)
	cd backend && poetry install

install-frontend: ## Установить frontend-зависимости (pnpm)
	cd frontend && pnpm install

dev: ## Запустить backend (:3000) и frontend (:5173); падение одного останавливает оба
	@trap 'trap - INT TERM EXIT; kill 0 2>/dev/null' INT TERM EXIT; \
	$(MAKE) -s dev-backend & p1=$$!; \
	$(MAKE) -s dev-frontend & p2=$$!; \
	while kill -0 $$p1 2>/dev/null && kill -0 $$p2 2>/dev/null; do sleep 1; done; \
	kill 0 2>/dev/null

dev-backend: ## Запустить FastAPI dev-сервер на :3000
	cd backend && poetry run python -m backend

dev-frontend: ## Запустить Vite dev-сервер на :5173
	cd frontend && pnpm dev

test: ## Запустить pytest (backend)
	cd backend && poetry run pytest

lint: lint-backend lint-frontend ## Запустить все линтеры: ruff + mypy (backend) + eslint (frontend)

lint-backend: ## ruff-format + ruff + mypy (backend)
	cd backend && poetry run ruff format --check && poetry run ruff check backend tests scripts && poetry run mypy backend tests scripts

lint-frontend: ## eslint (frontend)
	cd frontend && pnpm lint

build: ## Собрать frontend (tsc6 -b && vite build) → dist/
	cd frontend && pnpm build

migrate: ## Применить alembic-миграции (backend)
	cd backend && poetry run alembic upgrade head

generate-types: ## Сгенерировать типы Ozon API из OpenAPI-схемы
	cd frontend && pnpm generate:types

generate-api-types: ## Сгенерировать типы backend API из OpenAPI-схемы бэкенда
	cd backend && PYTHONPATH=. poetry run python scripts/dump_openapi.py .openapi.json
	cd frontend && pnpm generate:api-types

docker-up: ## Собрать и поднять prod-стек (frontend :8080 → backend :3000)
	docker compose up --build

docker-dev-up: ## Собрать и поднять dev-стек (reload + migrator + изолированная БД)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

docker-down: ## Остановить prod-стек
	docker compose down

docker-dev-down: ## Остановить dev-стек
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down