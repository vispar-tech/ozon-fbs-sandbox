# AGENTS.md — frontend

React/Vite-воркспейс монорепо `ozon-fbs-sandbox`. Корневые правила — в `../AGENTS.md`; этот файл уточняет их для frontend.

## Стек

- React 19 + Vite 8 + TypeScript; роутинг — react-router-dom (BrowserRouter); без стейт-менеджера
- zod — валидация форм (`useAutoForm`)
- Node ≥ 26.9.0, pnpm 12.3.4

## Команды (из `frontend/`)

| Команда | Что делает |
|---|---|
| `pnpm dev` | Vite dev-сервер на `:5173`; прокси `/api`, `/static`, `^/v[0-9]+/` → `http://localhost:3000` |
| `pnpm build` | `tsc6 -b && vite build` → `dist/` |
| `pnpm lint` | eslint (eslint-config-love + simple-import-sort + no-separators) |
| `pnpm typecheck` | `tsc6 -b` (проверка типов) |
| `pnpm install` | установка зависимостей; `prepare` ставит husky-хуки (`cd .. && husky frontend/.husky`) |
| `pnpm preview` | локальный просмотр `dist/` |
| `pnpm generate:types` | `openapi-typescript` из `../ozon-seller-api-schema/schemas/ozon-seller-api-openapi.json` → `src/shared/model/generated/ozon-api.ts` |
| `pnpm generate:api-types` | `openapi-typescript` из `../backend/.openapi.json` → `src/shared/model/generated/backend-api.ts`; промежуточный дамп делает `make generate-api-types` из корня |

## Структура

- `src/app/main.tsx` — entry (StrictMode), импортирует глобальный `index.scss`; `src/app/App.tsx` — BrowserRouter + ErrorBoundary + ToastProvider + Routes: `AppShell` (layout-route через `<Outlet />`) оборачивает `/` и `/seller/:id`; `/design-code` — витрина дизайн-системы вне шелла (ссылки в навигации шелла нет); `*` → 404-страница (`ErrorPage variant='not-found'`); `src/app/AppShell.tsx` — шапка с навигацией; `src/app/ErrorBoundary.tsx` — error boundary рендера (при ошибке — `ErrorPage variant='error'` с кнопкой «Повторить»).
- `src/pages/admin/` — дашборд продавцов (`AdminDashboard.tsx`, `CreateCabinetModal.tsx`); `src/pages/seller/` — детали кабинета (`SellerDetails.tsx` с табами Обзор/Фикстуры/Запросы, `EditCabinetModal.tsx`, `OverviewTab.tsx` / `FixturesTab.tsx` / `RequestsTab.tsx` + `RequestsTabSections.tsx` / `RequestsTabHelpers.ts` / `RequestsSnippets.ts` (сниппеты cURL/fetch для буфера — presentation, поэтому лежат на странице, а не в `shared/api/`); таб «Запросы» — ручной UI поверх OpenAPI-схемы, исключение из правила `useAutoForm` с обоснованием в коде); `src/pages/showcase/` — витрина дизайн-системы (`Showcase.tsx` / `ShowcaseHelpers.tsx` / `ShowcaseSections.tsx`, секции с демо); `src/pages/error/` — 404 и ошибка рендера (`ErrorPage.tsx`, variant `'error'` | `'not-found'`).
- `src/shared/api/` — типизированный API-клиент (`cabinets.ts` — fetch-обёртки над `/api/cabinets*`, класс `ApiError`; `seller.ts` — разбор `/api/openapi.json` + отправка запросов seller-контура, без чтения браузерных глобалов (сниппеты вынесены на страницу); `ozon-error.ts` — контракт ошибки Ozon (`OzonErrorEnvelope` — единственное объявление wire-формы, `toOzonError`; ту же форму валидирует `isErrorBody` в `cabinets.ts`); barrel `index.ts`).
- `src/shared/model/` — типы (FSD shared/model, без runtime). `generated/backend-api.ts` — сгенерированная из схемы бэкенда схема API и источник истины: доменные файлы (`api.ts`, `cabinet.ts`, `errors.ts`, `fixtures.ts`) — только алиасы `components['schemas'][...]` на неё, поля руками не дублировать. `generated/ozon-api.ts` — эталон Ozon (3.1 МБ), в баррель не реэкспортируется. Баррель `index.ts` перечисляет явно только то, что реально использует приложение.
- `src/shared/ui/` — дизайн-система по группам: `inputs/` (Input, Select, Toggle, Textarea, Checkbox, field), `feedback/` (Badge, Chip, EmptyState, ErrorBanner, Spinner, Alert, Skeleton, Modal, ConfirmDialog, Toast), `data/` (Table, Tabs, Pagination), `actions/` (Button, Icon, IconButton, DropdownMenu, CopyButton, SearchInput, Tooltip), `layout/` (Section, Card, Breadcrumbs); `src/shared/ui/Portal.tsx` (portal в body); корневой barrel `src/shared/ui/index.ts` (все группы + Portal); `src/shared/hooks/` (useAutoForm, useFocusTrap, useScrollLock, useOutsideClick, useTheme); `src/shared/lib/` (`format.ts`, `errors.ts` — `errorMessageOr(error, fallback)`, показывает реальную причину транспортного сбоя вместо статического текста, `refs.ts` — mergeRefs, `rating.ts` — предикат `hasPastValue` по опциональному И nullable `past_value`, `guards.ts` — `isRecord`, единственный тайп-гард «объект или null» в приложении, barrel `index.ts`); в каждой группе `index.ts` (barrel).
- Стили — SCSS Modules: `*.module.scss` рядом с компонентом. Исключение — витрина `src/pages/showcase/`: `Showcase.tsx` / `ShowcaseHelpers.tsx` / `ShowcaseSections.tsx` делят один `Showcase.module.scss` (страница-песочница, не переиспользуется). Общие партиалы `inputs/_field-base.scss` (mixin); глобальный `src/app/index.scss` (токены `--ozon-*`, dark mode). Без Tailwind/CSS-модулей-глобалок.
- `public/` — только `favicon.svg`; `vite.config.ts` — dev-прокси `/api`, `/static`, `^/v[0-9]+/` (хардкод `localhost:3000`), resolve.alias `@` → `src/`.
- `nginx.conf` — prod: раздача `dist/`, прокси `/api/`, `/static/` и `~ ^/v[0-9]+/` → `backend:3000`, security-заголовки, gzip, кэш `/assets/` (immutable); общий `proxy-headers.conf` подключается через `include` в каждом прокси-location.
- `Dockerfile` — multi-stage: `pnpm build` → nginx runtime.
- `.husky/pre-commit` — husky-хук (ставится `prepare` при `pnpm install`): обновляет субмодуль схемы → `make generate-api-types` + `git add` сгенерированного `backend-api.ts` → `pnpm generate:types` → `pnpm typecheck` → `git add ozon-api.ts` → `make lint` из корня

## Конвенции

- Порядок объявлений: imports → константы → типы → функции/классы; вспомогательные функции ПОСЛЕ основной.
- Separator-комментарии (`// ---`) запрещены (eslint `no-separators`).
- `no-magic-numbers`: разрешены `[0, 1]` (идиоматика React: `useState(0)`, `count + 1`).
- Импорты — alias `@/*` → `src/*` (tsconfig.app.json paths + vite.config.ts resolve.alias); относительные — всегда с расширением `.js`.
- Стили: классы в SCSS — kebab-case, доступ в TSX — только camelCase (`styles.fooBar` к `.foo-bar`; `localsConvention: 'camelCaseOnly'`); bracket-доступ `styles['kebab-name']` — undefined, запрещён.
- Новые компоненты: `ref` как проп (React 19), не forwardRef.
- Только существующие UI-компоненты (`@/shared/ui/...`), минимум своего: иконки — через `Icon` (`size` xs/sm/md/lg, без ручных размеров и прямых heroicons), заголовки/футеры карточек — `Card` `title`/`footer`, удаление — `Chip removable`, ошибки — `ErrorBanner`, формы — `useAutoForm`. Запрещены кастомные размеры иконок, ручные SVG, дублирование стилей/разметки, кастомные header'ы вместо `Card title`. Если чего-то не хватает — расширять компонент дизайн-системы, а не делать кастом на месте.
- Формы — всегда через `useAutoForm`: скалярные поля — `FieldDefinition` + `FieldRenderer` (сид из данных — `initialValues`; `name` — **плоский** ключ в `values`, dot-пути не резолвятся); массивы и вложенные структуры — целыми значениями в `values` через `handleChange(name, новоеЗначение)`. Ручное построение форм (useState + update-хелперы) — только в исключительных случаях, с комментарием-обоснованием. На `<form>` обязателен `noValidate`; submit-кнопка вне формы — через атрибут `form`, остальные кнопки внутри формы — `type='button'`.
- Тестов в frontend нет (покрытие — backend).
- Типы фикстур и API — из `@/shared/model`, не дублировать. Доменные типы генерируются из схемы бэкенда: правь модель в `backend/backend/db/models/`, а не сгенерированный `.ts`. Каталог `src/shared/model/generated/` перезаписывается на каждом коммите — руками не редактировать.

## Границы

- Меняй только `frontend/`. Все node-конфиги frontend — package.json, eslint.config.js, tsconfig.base.json, .nvmrc, pnpm-lock.yaml, pnpm-workspace.yaml — живут только здесь; корневого package.json/tsconfig нет.
- У frontend нет env; прокси-URL захардкожен в `vite.config.ts` и `nginx.conf` — меняй оба места синхронно (в каждом по три правила: `/api`, `/static`, `^/v[0-9]+/`).
- `dist/` — артефакт сборки, не редактировать.
