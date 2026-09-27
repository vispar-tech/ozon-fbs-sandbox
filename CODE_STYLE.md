# CODE style

`AGENTS.md` владеет стеком, командами и структурой. Этот файл про то, как выглядит код: имена, типы, комментарии, раскладка по слоям. За каждой строкой стоит либо инструмент, который её проверяет, либо пометка `[наблюдение]`, если это договорённость без автопроверки. Описано текущее состояние репозитория, а не пожелания.

## General code style

- **Комментарии пишутся по `/stop-slop`.** Умолчание здесь такой, что комментария нет. Он оправдан там, где без него код читается неверно. Пишут причину, а не пересказ строки: «отдаём сырой поток, Content-Type разбирает потребитель», а не «возвращаем raw». Очевидное, избыточные акценты и объяснение самих себя убираются.
- **Язык: код английский, интерфейс русский.** Идентификаторы, docstrings и сообщения общего слоя написаны по-английски. Строки интерфейса, сообщения zod в `frontend/src/shared/hooks/useAutoForm.tsx` и тестовые данные на русском. Исключение: тела ошибок в `backend/backend/web/errors.py` остаются английскими, seller-контур повторяет контракт Ozon, а сообщения admin-контура пока не переведены.
- **Каждое подавление линтера несёт причину:** `# noqa: S105 -- <почему>`, `// eslint-disable-next-line <rule> -- <почему>`. На фронте причина есть у всех 15 подавлений. На бэке её нет ни у одного из 14, а в `backend/backend/gunicorn_runner.py:16` опечатка `# typing: ignore`, которая не срабатывает. Фронтенд тут эталон.
- **Имена.** Константы `UPPER_SNAKE`, компоненты и классы `PascalCase`, хуки `useX`, приватность в Python через `_`, модули и поля snake_case.
- **Числа в коде становятся именованными константами.** Исключение для фронта: `0` и `1` разрешены `[eslint]`.
- **Никаких `any` и `Optional`.** Тип сомнительный, значит сужаем его guard'ом, а не кастом. `Optional[X]` и `Union` не встречаются, форма `X | None` единственная.
- **Не дублировать.** Сначала ищем в общем слое, в соседнем модуле, в дизайн-системе. Новый файл появляется, когда модуль разошёлся на две ответственности. Форматирование руками не правим, это работа `ruff format` и конфига eslint.

## Frontend

- **Слои: `app`, `pages`, `shared`.** `entities`, `widgets` и `features` заводить не нужно `[наблюдение]`.
- **Строгость высокая** `[tsc]`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (то есть никаких `enum`), `verbatimModuleSyntax` (то есть `import type`), `noUnusedLocals`, `noUnusedParameters`. `any` не встречается нигде, включая сгенерированные файлы.
- **Индекс не читаем, а сужаем.** `noUncheckedIndexedAccess` заставляет проверять `undefined`: `.at()` с проверкой, `?? fallback`, optional chaining. `as` в дереве 10, у каждого на строке с `-- reason`. `as const` не флагуется.
- **`| undefined` пишем там, где опциональное значение уходит дальше** `[tsc]`. Листовые компоненты держат `?: T` без `| undefined`.
- **Компонент это `export function PascalCase(...): JSX.Element`.** Таких 46, стрелочных нет, `forwardRef` нет: `ref` обычная проп `[наблюдение]`.
- **Экран отдаёт четыре состояния:** загрузка, ошибка, пусто, данные. Это `Spinner`, потом `ErrorBanner` с кнопкой повтора, потом `EmptyState`.
- **Загрузка данных ручная:** `useState` + `useCallback` + `useEffect` + `try/catch/finally`. Ни TanStack Query, ни SWR, ни Suspense, ни lazy. Висящие промисы гасим явно через `void` `[наблюдение]`.
- **Формы через `useAutoForm`.** Ручная форма допустима с комментарием-обоснованием, пример в `frontend/src/pages/seller/RolesEditor.tsx:110`.
- **UI только из `@/shared/ui`.** Чего-то не хватает, расширяем компонент, а не пишем своё. Свои SVG, ручные размеры иконок и свои шапки карточек запрещены.
- **Стили: `*.module.scss` рядом с компонентом.** Имя класса kebab-case в scss, доступ в tsx только camelCase, потому что `localsConvention: 'camelCaseOnly'`: `styles.fooBar` это `.foo-bar`, а `styles['kebab-name']` даёт undefined. Цвета берём из токенов `--ozon-*` и семантических в `frontend/src/app/index.scss`, общие стили полей живут в миксине `frontend/src/shared/ui/inputs/_field-base.scss`.
- **Barrel на группу, импорты в основном через него:** 94 barrel против 16 прямых. Страницы используют только barrel, внутри `shared/ui` прямые импорты соседей ещё есть. Смешивать два стиля в одном файле не стоит `[наблюдение]`.
- **Сплит компонента это решение про ответственность, а не про число строк.** Форма, которая сложилась: `X.tsx` держит состояние и связывание, `XSections.tsx` панели, `XHelpers.ts` чистые функции и типы, у каждого визуального соседа свой module.scss. Порога в репозитории нет, `RequestsTabSections.tsx` длиннее `SellerInfoEditor.tsx`.

## Backend

- **Направление слоёв: `web` → `services` → `repositories` → `db.models`.** Пакет `db` ничего не знает про web, services и schemas. При этом `backend/backend/web/api/deps.py` и `backend/backend/web/api/seller/deps.py` берут `CabinetRepository` напрямую, минуя сервисный слой, так что читать это как разрешение так делать везде не нужно.
- **Имена схем: тело запроса `{Verb}{Noun}Input`** (`CreateCabinetInput`, `ListProductInput`), **ответ это голое существительное или `{Noun}Summary`** (`CabinetSummary`). Имён `FooRequest` и `FooResponse` в проекте нет.
- **Типизация: mypy `strict = true`** плюс 8 смягчений в `backend/pyproject.toml`: `ignore_missing_imports`, `allow_subclassing_any`, `allow_untyped_calls`, `implicit_reexport`, `allow_untyped_decorators`, `warn_unused_ignores = false`, `warn_return_any = false`, `namespace_packages = true`. Дженерики пишем синтаксисом PEP 695, `class BaseRepository[ModelType: Base]`, а не `TypeVar` `[наблюдение]`. `Any` допустим в границах дженериков, в `dialect` SQLAlchemy и в `**kwargs` `[ruff]`.
- **Docstring обязателен у всего публичного:** 162 публичных определения, ни одного без docstring, это `D101`/`D102`/`D103` `[ruff]`. Конвенция `google`, поэтому Summary стоит сразу после открывающих кавычек, в императиве, а `Args:`, `Returns:`, `Raises:` добавляются когда несут смысл. У `__init__` docstring тоже нужен (`D105`/`D107`), в проекте это одна стрка с целью, например `"""Bind the repository to a session and its model type."""`. Docstring модуля необязателен, `D100` выключен.
- **Async на всём request path.** Роуты и сервисы `async def`, репозитории асинхронные, синхронными остаются `health_check` и файловый IO. Жизненный цикл сессии живёт в зависимости `get_db_session`: commit, rollback с повторным выбросом исключения, close в `finally`. Очередей нет, httpx встречается только в тестах и скриптах.
- **Арность: `PLR0913` включён, самая широкая функция в дереве берёт 4 аргумента** `[ruff]`. Args-датаклассов в проекте нет. Длинные сигнатуры становятся keyword-only после `*`, а роут принимает одну модель `{Verb}{Noun}Input` и `Annotated[..., Depends]` алиасы.
- **Ошибки: два плоских исключения,** `CabinetNotFoundError` в сервисах и `OzonHttpError` в web. Сервис не знает про HTTP. Тела ошибок вынесены в константы модуля в `backend/backend/web/errors.py`, хендлеры регистрируются одной функцией `register_exception_handlers`. `raise ... from None` подавляет контекст, `raise ... from exc` не встречается `[наблюдение]`.
- **Логирование только loguru,** единственное место вызова в приложении это `logger.opt(exception=exc)` в `backend/backend/web/errors.py`. `print` запрещён вне `scripts/` (правило `T20`) `[ruff]`.
- **ORM: SQLAlchemy 2.0,** `Mapped[]` и `mapped_column()`, общий `meta` в `backend/backend/db/meta.py` с `naming_convention` для всех пяти типов констрейнтов, JSONB через TypeDecorator `PydanticType` с `cache_ok = True`. Alembic запускает `ruff_format` и `ruff_check` как post-write hooks, каталог `db/migrations` выключен из ruff.
- **Тесты: плоские `async def test_<поведение>`** без классов, одна `conftest.py` с фикстурами `anyio_backend`, `_engine`, `dbsession`, `fastapi_app`, `client`, общие хелперы импортируются из `tests.conftest` как обычные функции. Имя файла это контур, а не модуль: `test_admin`, `test_seller`, `test_products`, `test_openapi`, `test_backend`. Синхронный `def test_` допустим, когда нет I/O. `filterwarnings = ["error", ...]`, новое предупреждение роняет набор `[pytest]`.
- **Линт: длина строки 88 для кода, сложность 10, `target-version = "py314"`** `[ruff]`. Длинные строки внутри docstring не проверяются.
- **Настройки: синглтон модуля,** читает `backend/.env` с префиксом `BACKEND_` и `extra="ignore"`, импортируется и никогда не внедряется как зависимость. Зависимости уровня запроса оформлены алиасами `Annotated[X, Depends(f)]`, например `SessionDep` и `CabinetRepoDep` `[наблюдение]`.
