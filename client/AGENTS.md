# AGENTS.md — client

React/Vite-воркспейс монорепо `ozon-fbs-sandbox`. Корневые правила — в `../AGENTS.md`; этот файл уточняет их для client.

## Стек

- React 19 + Vite 8, TypeScript
- Без роутера и стейт-менеджера — единственный компонент `App`
- Node ≥ 26.9.0, pnpm 12.3.4 (workspace)

## Команды (из корня репо)

| Команда | Что делает |
|---|---|
| `pnpm dev:client` | Vite dev-сервер на `:5173`, прокси `/api` → `http://localhost:3000` |
| `pnpm --filter client build` | `tsc -b && vite build` → `dist/` |
| `pnpm --filter client preview` | локальный просмотр `dist/` |

## Структура

- `src/main.tsx` — entry (StrictMode).
- `src/App.tsx` — единственный компонент: счётчик + fetch `/api/hello` (проверяет `res.ok`).
- `src/App.css` / `index.css` — plain CSS, CSS-переменные, dark mode. Без CSS-модулей/Tailwind.
- `src/assets/` — статика (hero.png, svg); `public/` — favicon/icons.
- `vite.config.ts` — dev-прокси `/api` (хардкод `localhost:3000`).
- `nginx.conf` — prod: раздача `dist/`, прокси `/api` → `backend:3000`, security-заголовки, gzip, кэш `/assets/` (immutable).
- `Dockerfile` — multi-stage: `pnpm --filter client build` → nginx runtime.

## Конвенции

- Порядок объявлений: imports → константы → типы → функции/классы; вспомогательные функции ПОСЛЕ основной.
- Separator-комментарии (`// ---`) запрещены (eslint `no-separators`).
- `no-magic-numbers`: разрешены `[0, 1]` (идиоматика React: `useState(0)`, `count + 1`).
- Стили — только в `App.css`/`index.css`; новые состояния/экраны — новые классы в этих файлах.
- Тестов в client нет (покрытие — backend).
- Типы фикстур и API — из `@ozon-sandbox/shared` (`workspace:*`), не дублировать.

## Границы

- Меняй только `client/`. Корневые конфиги (`eslint.config.js`, `tsconfig.base.json`, `package.json`, `pnpm-lock.yaml`) — общие: правки согласуй с корневым AGENTS.md.
- У client нет env; прокси-URL захардкожен в `vite.config.ts` и `nginx.conf` — меняй оба места синхронно.
- `dist/` — артефакт сборки, не редактировать.