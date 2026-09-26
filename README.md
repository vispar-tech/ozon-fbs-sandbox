<div align="center">
  <img src="frontend/public/favicon.svg" width="96" height="96" alt="Ozon FBS Sandbox">
  <h1>Ozon FBS Sandbox</h1>
  <p><sub>Монорепо-песочница: FastAPI-бэкенд + React/Vite-фронтенд.</sub></p>
  <p><sub><i>Крутишь данные из UI, смотришь результат вживую.</i></sub></p>
  <p>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.14"></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"></a>
    <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8"></a>
    <a href="https://github.com/vispar-tech/ozon-fbs-sandbox/actions"><img src="https://img.shields.io/github/actions/workflow/status/vispar-tech/ozon-fbs-sandbox/ci.yml?style=flat-square&label=CI&logo=githubactions&logoColor=white" alt="CI"></a>
  </p>
</div>

---

## Зачем это нужно

> [!IMPORTANT]
> Песочница-монорепо: FastAPI-бэкенд и React/Vite-фронтенд в одном репозитории. Видно, что внутри.

> [!NOTE]
> **Почему FastAPI?** Да, это оверхед для песочницы, но нужен хоть какой-то репозиторий с FastAPI на GitHub, чтобы было видно, что я с ним работаю.
>
> **Почему React/Vite?** Давно не работал со стандартным Vite + React, захотелось освежить.

> [!TIP]
> **Почему это полезно?** Ozon до сих пор не сделал аналог песочницы WB. Unit-тесты с mock-данными сожрали у меня кучу времени. Здесь всё управляется из UI, и удобно отслеживать, что и как работает, в живом просмотре и тестировании.

---

## Что умеет

- Дашборд продавцов: создавай, редактируй и удаляй кабинеты прямо из UI.
- Фикстуры: загружай демо-данные и смотри, как меняется витрина.
- Витрина дизайн-системы: все компоненты в одном месте.
- Типы из OpenAPI: `make generate-types` обновляет `ozon-api.ts`.
- Docker-стеки: prod и dev поднимаются одной командой.

---

## Требования

- Python ≥ 3.14 + Poetry (backend)
- Node.js ≥ 26.9.0 + pnpm 12.3.4 (frontend)

---

## Запуск

Всё управление через `make` из корня (см. `make help`).

```bash
make install && make dev
```

Backend поднимется на `:3000`, Vite на `:5173`. Ctrl+C останавливает оба.

Docker: `make docker-up` поднимает prod-стек: frontend на `http://localhost:8080`, nginx-прокси `/api` на backend, postgres + migrator. `make docker-dev-up` поднимает dev-стек: reload, migrator, изолированная БД.

---

## Команды

| Команда | Что делает |
|---|---|
| `make install` | установка зависимостей backend (Poetry) и frontend (pnpm) |
| `make dev` | backend `:3000` + Vite `:5173` (Ctrl+C останавливает оба) |
| `make dev-backend` / `make dev-frontend` | по отдельности |
| `make test` | pytest (backend) |
| `make lint` | ruff + mypy (backend) + eslint (frontend) |
| `make build` | сборка frontend → `dist/` |
| `make migrate` | alembic upgrade head |
| `make generate-types` | `frontend/src/shared/model/generated/ozon-api.ts` из OpenAPI-схемы |
| `make docker-up` | prod-стек: frontend `:8080` (nginx) → backend `:3000` + postgres `:5432` + migrator |
| `make docker-dev-up` | dev-стек: reload + migrator + изолированная БД |
| `make docker-down` / `make docker-dev-down` | остановка стеков |

---

## Структура

<table>
  <thead>
    <tr><th>Путь</th><th>Что внутри</th></tr>
  </thead>
  <tbody>
    <tr><td><code>backend/</code></td><td>FastAPI-бэкенд (Python 3.14, Poetry), порт <code>3000</code></td></tr>
    <tr><td><code>backend/</code> (приложение)</td><td>routes, services, db, settings</td></tr>
    <tr><td><code>backend/tests/</code></td><td>pytest-тесты</td></tr>
    <tr><td><code>backend/pyproject.toml</code> + <code>backend/poetry.lock</code></td><td>зависимости (Poetry)</td></tr>
    <tr><td><code>backend/Dockerfile</code></td><td>multi-stage (poetry)</td></tr>
    <tr><td><code>frontend/</code></td><td>React 19 + Vite 8, FSD</td></tr>
    <tr><td><code>frontend/src/app/</code></td><td>entry, router, shell</td></tr>
    <tr><td><code>frontend/src/pages/</code></td><td>страницы (admin, seller, showcase)</td></tr>
    <tr><td><code>frontend/src/shared/model/</code></td><td>типы (FSD shared/model, только типы)</td></tr>
    <tr><td><code>frontend/src/shared/ui/</code></td><td>дизайн-система (SCSS Modules)</td></tr>
    <tr><td><code>frontend/pnpm-lock.yaml</code></td><td>lockfile pnpm</td></tr>
    <tr><td><code>frontend/eslint.config.js</code>, <code>frontend/tsconfig.base.json</code>, <code>frontend/.nvmrc</code></td><td>конфиги frontend</td></tr>
  </tbody>
</table>

---

## Окружение

> [!TIP]
> Скопируй `backend/.env.example` в `backend/.env`, если нужно.

Переменные с префиксом `BACKEND_`: `BACKEND_HOST`, `BACKEND_PORT`, `BACKEND_DB_HOST`, `BACKEND_DB_PORT`, `BACKEND_DB_USER`, `BACKEND_DB_PASS`, `BACKEND_DB_BASE`. На старте приложения pydantic-settings читает `backend/.env`. Docker-стеки читают тот же файл через `env_file`.
