# AGENTS.md — frontend

React/Vite-воркспейс монорепо `ozon-fbs-sandbox`. Стек, make-команды и правила написания кода описаны в корневых файлах, здесь только локальный контракт.

## Команды (из `frontend/`)

| Команда | Что делает |
|---|---|
| `pnpm dev` | Vite dev-сервер |
| `pnpm build` | `tsc6 -b && vite build` → `dist/` |
| `pnpm lint` | eslint + `scripts/check-scss-class-naming.mjs` (camelCase в scss) |
| `pnpm typecheck` | `tsc6 -b`, проверка типов |
| `pnpm install` | установка зависимостей; `prepare` ставит husky-хуки (`cd .. && husky frontend/.husky`) |
| `pnpm preview` | локальный просмотр `dist/` |
| `pnpm generate:types` | `openapi-typescript` из `../ozon-seller-api-schema/schemas/ozon-seller-api-openapi.json` → `src/shared/model/generated/ozon-api.ts` |
| `pnpm generate:api-types` | `openapi-typescript` из `../backend/.openapi.json` → `src/shared/model/generated/backend-api.ts`; дамп делает `make generate-api-types` из корня |

## Структура

- `src/app/App.tsx` — BrowserRouter + ErrorBoundary + ToastProvider + Routes: `AppShell` (layout-route через `<Outlet />`) оборачивает `/` и `/seller/:id`; `/design-code` витрина дизайн-системы живёт вне шелла, в навигации шелла ссылки на неё нет; `*` уходит в 404-страницу `ErrorPage variant='not-found'`. `AppShell.tsx` — шапка с навигацией, `ErrorBoundary.tsx` ловит ошибку рендера и показывает `ErrorPage variant='error'` с кнопкой «Повторить».
- `src/pages/showcase/` делит один `Showcase.module.scss` между всеми своими частями в обход правила «свой scss у каждого соседа»: витрина дизайн-системы не переиспользуется.
- `src/pages/seller/RequestsTab.tsx` — ручной UI поверх OpenAPI-схемы, исключение из правила форм с обоснованием в коде. `RequestsSnippets.ts` (сниппеты cURL и fetch для буфера) лежит на странице, а не в `shared/api/`, потому что это presentation.
- `src/shared/api/ozon-error.ts` — единственное объявление wire-формы ошибки Ozon (`OzonErrorEnvelope`, `toOzonError`); ту же форму валидирует `isErrorBody` в `cabinets.ts`. `seller.ts` не читает браузерных глобалов.
- `src/shared/model/generated/backend-api.ts` — источник истины по API. Доменные файлы (`api.ts`, `cabinet.ts`, `errors.ts`, `fixtures.ts`) только алиасы `components['schemas'][...]` на него, поля руками не дублировать. `generated/ozon-api.ts` — эталон Ozon, в баррель не реэкспортируется. Правь модель в `backend/backend/db/models/`, а не сгенерированный `.ts`: каталог `generated/` перезаписывается на каждом коммите.
- `src/shared/lib/` — `errorMessageOr(error, fallback)` показывает реальную причину транспортного сбоя вместо статического текста, `isRecord` единственный тайп-гард «объект или null» в приложении, `hasPastValue` предикат по опциональному и nullable `past_value`.
- `src/shared/ui/` — дизайн-система по группам `inputs` / `feedback` / `data` / `actions` / `layout`, плюс `Portal.tsx` для portal в body. В каждой группе свой `index.ts`, в корне общий barrel. Вложенный раскрывающийся блок — `actions/Disclosure` (`expanded` / `onToggle` / `size`, внутри уже `aria-expanded` и шеврон), доля или прогресс — `data/Meter` (`value` / `max` / `label`, `role='progressbar'`).
- `vite.config.ts` — dev-прокси `/api`, `/static`, `^/v[0-9]+/` на `VITE_PROXY_TARGET` (дефолт `localhost:3000`, в dev-стеке Docker `backend:3000`), resolve.alias `@` → `src/`.
- `nginx.conf` — prod: раздача `dist/`, прокси `/api/`, `/static/` и `~ ^/v[0-9]+/` на `backend:3000`, security-заголовки, gzip, кэш `/assets/` (immutable); общий `proxy-headers.conf` подключается через `include` в каждом прокси-location.

## Конвенции

- **Дизайн-система вместо кастомных элементов.** Иконки через `Icon` (`size` xs/sm/md/lg), заголовок и футер карточки через `Card` `title`/`footer`, удаление через `Chip removable`, ошибки через `ErrorBanner`, раскрытие через `Disclosure`, соотношения через `Meter`, текст только для скринридера через `@include visually-hidden` из `inputs/_visually-hidden.scss`. Свой компонент — последнее средство: переиспользуемый визуальный примитив переезжает в `shared/ui/`, а не остаётся в странице. В страницевом scss остаётся только минимальная раскладка на токенах: без градиентов, keyframe-анимаций и декоративных теней — им место в дизайн-системе.
- **Формы.** Скалярные поля — `FieldDefinition` + `FieldRenderer`, сид из данных задаёт `initialValues`, `name` это **плоский** ключ в `values` (dot-пути не резолвятся), массивы и вложенные структуры кладутся в `values` целиком через `handleChange(name, новоеЗначение)`. На `<form>` обязателен `noValidate`, submit-кнопка вне формы ведётся атрибутом `form`, остальные кнопки внутри формы имеют `type='button'`.
- Тестов во frontend нет, покрытие живёт в backend.

## Границы

- Единственный env — `VITE_PROXY_TARGET`, и он только для dev-прокси в `vite.config.ts`. В `nginx.conf` таргет захардкожен, поэтому при смене таргета правь оба места синхронно.
