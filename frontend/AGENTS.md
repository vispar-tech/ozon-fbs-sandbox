# AGENTS.md — frontend

React/Vite-воркспейс монорепо `ozon-fbs-sandbox`. Корневые правила — в `../AGENTS.md`; этот файл уточняет их для frontend.

## Стек

- React 19 + Vite 8 + TypeScript; роутинг — react-router-dom (BrowserRouter); без стейт-менеджера
- zod — валидация форм (`useAutoForm`)
- Node ≥ 26.9.0, pnpm 12.3.4

## Команды (из `frontend/`)

| Команда | Что делает |
|---|---|
| `pnpm dev` | Vite dev-сервер на `:5173`, прокси `/api` → `http://localhost:3000` |
| `pnpm build` | `tsc6 -b && vite build` → `dist/` |
| `pnpm lint` | eslint (eslint-config-love + simple-import-sort + no-separators) |
| `pnpm preview` | локальный просмотр `dist/` |
| `pnpm generate:types` | `openapi-typescript` из `.schemas/ozon-seller-api-openapi.json` → `src/shared/model/generated/ozon-api.ts` |

## Структура

- `src/app/main.tsx` — entry (StrictMode), импортирует глобальный `index.scss`; `src/app/App.tsx` — BrowserRouter + ErrorBoundary + ToastProvider + Routes: `AppShell` (layout-route через `<Outlet />`) оборачивает `/` и `/seller/:id`; `/design-code` — витрина дизайн-системы вне шелла (ссылки в навигации шелла нет); `*` → 404-страница (`ErrorPage variant='not-found'`); `src/app/AppShell.tsx` — шапка с навигацией; `src/app/ErrorBoundary.tsx` — error boundary рендера (при ошибке — `ErrorPage variant='error'` с кнопкой «Повторить»).
- `src/pages/admin/` — дашборд продавцов (`AdminDashboard.tsx`, `CreateCabinetModal.tsx`); `src/pages/seller/` — детали кабинета (`SellerDetails.tsx` с табами Обзор/Фикстуры, `EditCabinetModal.tsx`, `OverviewTab.tsx` / `FixturesTab.tsx`); `src/pages/showcase/` — витрина дизайн-системы (`Showcase.tsx` / `ShowcaseHelpers.tsx` / `ShowcaseSections.tsx`, секции с демо); `src/pages/error/` — 404 и ошибка рендера (`ErrorPage.tsx`, variant `'error'` | `'not-found'`).
- `src/shared/api/` — типизированный API-клиент (`cabinets.ts` — fetch-обёртки над `/api/cabinets*`, класс `ApiError`; barrel `index.ts`).
- `src/shared/model/` — типы (FSD shared/model: доменные + `generated/ozon-api.ts`).
- `src/shared/ui/` — дизайн-система по группам: `inputs/` (Input, Select, Toggle, Textarea, Checkbox, field), `feedback/` (Badge, Chip, EmptyState, ErrorBanner, Spinner, Alert, Skeleton, Modal, ConfirmDialog, Toast), `data/` (Table, Tabs, Pagination), `actions/` (Button, Icon, IconButton, DropdownMenu, CopyButton, SearchInput, Tooltip), `layout/` (Section, Card, Breadcrumbs); `src/shared/ui/Portal.tsx` (portal в body); корневой barrel `src/shared/ui/index.ts` (все группы + Portal); `src/shared/hooks/` (useAutoForm, useFocusTrap, useScrollLock, useOutsideClick, useTheme); `src/shared/lib/` (`format.ts`, `refs.ts` — mergeRefs, barrel `index.ts`); в каждой группе `index.ts` (barrel).
- Стили — SCSS Modules: per-component `*.module.scss` рядом с компонентом, общий `inputs/_field-base.scss` (mixin) для Input/Select; глобальный `src/app/index.scss` (токены `--ozon-*`, dark mode). Без Tailwind/CSS-модулей-глобалок.
- `public/` — только `favicon.svg`; `vite.config.ts` — dev-прокси `/api` (хардкод `localhost:3000`), resolve.alias `@` → `src/`.
- `nginx.conf` — prod: раздача `dist/`, прокси `/api` → `backend:3000`, security-заголовки, gzip, кэш `/assets/` (immutable).
- `Dockerfile` — multi-stage: `pnpm build` → nginx runtime.

## Конвенции

- Порядок объявлений: imports → константы → типы → функции/классы; вспомогательные функции ПОСЛЕ основной.
- Separator-комментарии (`// ---`) запрещены (eslint `no-separators`).
- `no-magic-numbers`: разрешены `[0, 1]` (идиоматика React: `useState(0)`, `count + 1`).
- Импорты — alias `@/*` → `src/*` (tsconfig.app.json paths + vite.config.ts resolve.alias); относительные — всегда с расширением `.js`.
- Стили: классы в SCSS — kebab-case, доступ в TSX — только camelCase (`styles.fooBar` к `.foo-bar`; `localsConvention: 'camelCaseOnly'`); bracket-доступ `styles['kebab-name']` — undefined, запрещён.
- Новые компоненты: `ref` как проп (React 19), не forwardRef.
- Только существующие UI-компоненты (`@/shared/ui/...`), минимум своего: иконки — через `Icon` (`size` xs/sm/md/lg, без ручных размеров и прямых heroicons), заголовки/футеры карточек — `Card` `title`/`footer`, удаление — `Chip removable`, ошибки — `ErrorBanner`, формы — `useAutoForm`. Запрещены кастомные размеры иконок, ручные SVG, дублирование стилей/разметки, кастомные header'ы вместо `Card title`. Если чего-то не хватает — расширять компонент дизайн-системы, а не делать кастом на месте.
- Формы — всегда через `useAutoForm`: скалярные поля — `FieldDefinition` + `FieldRenderer` (вложенность — dot-пути в `name`, сид из данных — `initialValues`); массивы и вложенные структуры — целыми значениями в `values` через `handleChange(name, новыйМассив)`. Ручное построение форм (useState + update-хелперы) — только в исключительных случаях, с комментарием-обоснованием. На `<form>` обязателен `noValidate`; submit-кнопка вне формы — через атрибут `form`, остальные кнопки внутри формы — `type='button'`.
- Тестов в frontend нет (покрытие — backend).
- Типы фикстур и API — из `@/shared/model`, не дублировать.

## Границы

- Меняй только `frontend/`. Все node-конфиги frontend — package.json, eslint.config.js, tsconfig.base.json, .nvmrc, pnpm-lock.yaml, pnpm-workspace.yaml — живут только здесь; корневого package.json/tsconfig нет.
- У frontend нет env; прокси-URL захардкожен в `vite.config.ts` и `nginx.conf` — меняй оба места синхронно.
- `dist/` — артефакт сборки, не редактировать.
