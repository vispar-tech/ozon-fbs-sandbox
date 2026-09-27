# Code style

`AGENTS.md` владеет стеком, командами и структурой. Здесь то, как выглядит код: имена, типы, комментарии, раскладка по слоям. За каждой строкой стоит либо инструмент, который её проверяет, либо пометка `[наблюдение]` для договорённостей без автопроверки.

## General code style

- **Комментарии пишутся по `/stop-slop`.** Умолчание здесь такое, что комментария нет, и он оправдан только там, где без него код читается неверно. Комментарий пишет причину, а не пересказ строки: «отдаём сырой поток, Content-Type разбирает потребитель», а не «возвращаем raw».
- **Язык: код английский, интерфейс русский.** Идентификаторы, docstrings и сообщения общего слоя написаны по-английски. Строки интерфейса, сообщения zod в `frontend/src/shared/hooks/useAutoForm.tsx` и тестовые данные на русском. Исключение: тела ошибок в `backend/backend/web/errors.py` остаются английскими, потому что seller-контур повторяет контракт Ozon.
- **Каждое подавление линтера несёт причину:** `# noqa: S105 -- <почему>`, `// eslint-disable-next-line <rule> -- <почему>`. Фронтенд тут эталон.
- **Имена.** Константы `UPPER_SNAKE`, компоненты и классы `PascalCase`, хуки `useX`, приватность в Python через `_`, модули и поля snake_case.
- **Числа в коде становятся именованными константами.** Исключение для фронта: `0` и `1` разрешены `[eslint]`.
- **Никаких `any` и `Optional`.** Тип сомнительный, значит сужаем его guard'ом, а не кастом. `Optional[X]` и `Union` не встречаются, форма `X | None` единственная.
- **Не дублировать.** Сначала ищем в общем слое, в соседнем модуле, в дизайн-системе. Новый файл появляется, когда модуль разошёлся на две ответственности. Форматирование руками не правим, это работа `ruff format` и конфига eslint.

## Frontend

- **Слои: `app`, `pages`, `shared`.** `entities`, `widgets` и `features` заводить не нужно `[наблюдение]`.
- **Импорты.** Alias `@/*` → `src/*`, относительные всегда с расширением `.js`, порядок задаёт `simple-import-sort`. Separator-комментарии (`// ---`) запрещены, это `no-separators`.
- **Строгость высокая** `[tsc]`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (то есть никаких `enum`), `verbatimModuleSyntax` (то есть `import type`), `noUnusedLocals`, `noUnusedParameters`. `any` не встречается нигде, включая сгенерированные файлы.
- **Индекс не читаем, а сужаем.** `noUncheckedIndexedAccess` заставляет проверять `undefined`: `.at()` с проверкой, `?? fallback`, optional chaining. У каждого `as` в дереве есть `-- reason` на строке, `as const` не флагуется.
- **`| undefined` пишем там, где опциональное значение уходит дальше** `[tsc]`. Листовые компоненты держат `?: T` без `| undefined`.
- **Компонент это `export function PascalCase(...): JSX.Element`**, `ref` обычная проп: стрелочных компонентов и `forwardRef` в дереве нет `[наблюдение]`.
- **Экран отдаёт четыре состояния:** загрузка, ошибка, пусто, данные. Это `Spinner`, потом `ErrorBanner` с кнопкой повтора, потом `EmptyState`.
- **Загрузка данных ручная:** `useState` + `useCallback` + `useEffect` + `try/catch/finally`. Ни TanStack Query, ни SWR, ни Suspense, ни lazy. Висящие промисы гасим явно через `void` `[наблюдение]`.
- **Формы через `useAutoForm`.** Ручная форма допустима с комментарием-обоснованием.
- **UI только из `@/shared/ui`.** Чего-то не хватает, расширяем компонент, а не пишем своё. Свои SVG, ручные размеры иконок и свои шапки карточек запрещены.
- **Порядок объявлений:** imports, константы, типы, функции и классы. Вспомогательные функции объявляются после основной `[наблюдение]`.
- **Стили: `*.module.scss` рядом с компонентом.** Имя класса kebab-case в scss, доступ в tsx только camelCase, потому что `localsConvention: 'camelCaseOnly'`: `styles.fooBar` это `.foo-bar`, а `styles['kebab-name']` даёт undefined. Цвета берём из токенов `--ozon-*` и семантических в `frontend/src/app/index.scss`, общие стили полей живут в миксине `frontend/src/shared/ui/inputs/_field-base.scss`.
- **Barrel на группу, импорты в основном через него.** Страницы используют только barrel, внутри `shared/ui` прямые импорты соседей ещё есть. Смешивать два стиля в одном файле не стоит `[наблюдение]`.
- **Сплит компонента это решение про ответственность, а не про число строк.** Форма, которая сложилась: `X.tsx` держит состояние и связывание, `XSections.tsx` панели, `XHelpers.ts` чистые функции и типы, у каждого визуального соседа свой module.scss. Порога по строкам в репозитории нет.

## Backend

- **Направление слоёв: `web` → `services` → `repositories` → `db.models`.** Пакет `db` ничего не знает про web, services и schemas. При этом `backend/backend/web/api/deps.py` и `backend/backend/web/api/seller/deps.py` берут `CabinetRepository` напрямую, минуя сервисный слой, так что читать это как разрешение так делать везде не нужно.
- **Имена схем: тело запроса `{Verb}{Noun}Input`** (`CreateCabinetInput`, `ListProductInput`), **ответ это голое существительное или `{Noun}Summary`** (`CabinetSummary`). Имён `FooRequest` и `FooResponse` в проекте нет.
- **Типизация: mypy `strict = true`.** Смягчения перечислены в `backend/pyproject.toml`, меняются там же. Дженерики пишем синтаксисом PEP 695, `class BaseRepository[ModelType: Base]`, а не `TypeVar` `[наблюдение]`. `Any` допустим в границах дженериков, в `dialect` SQLAlchemy и в `**kwargs` `[ruff]`.
- **Docstring обязателен у всего публичного** `[ruff]`, это `D101`/`D102`/`D103` плюс `D105`/`D107` для `__init__`. У `__init__` docstring это одна стрка с целью: `"""Bind the repository to a session and its model type."""`. Конвенция `google`, поэтому Summary стоит сразу после открывающих кавычек, в императиве, а `Args:`, `Returns:`, `Raises:` добавляются когда несут смысл. Docstring модуля необязателен, `D100` выключен.
- **Async на всём request path.** Роуты и сервисы `async def`, репозитории асинхронные, синхронными остаются `health_check` и файловый IO. Жизненный цикл сессии живёт в зависимости `get_db_session`: commit, rollback с повторным выбросом исключения, close в `finally`. httpx встречается только в тестах и скриптах.
- **Арность: `PLR0913` включён, самая широкая функция в дереве берёт 4 аргумента** `[ruff]`. Args-датаклассов в проекте нет. Длинные сигнатуры становятся keyword-only после `*`, а роут принимает одну модель `{Verb}{Noun}Input` и `Annotated[..., Depends]` алиасы.
- **Ошибки: два плоских исключения,** `CabinetNotFoundError` в сервисах и `OzonHttpError` в web. Сервис не знает про HTTP. Тела ошибок вынесены в константы модуля в `backend/backend/web/errors.py`, хендлеры регистрируются одной функцией `register_exception_handlers`. `raise ... from None` подавляет контекст, `raise ... from exc` не встречается `[наблюдение]`.
- **Логирование только loguru,** единственное место вызова в приложении это `logger.opt(exception=exc)` в `backend/backend/web/errors.py`. `print` запрещён вне `scripts/` (правило `T20`) `[ruff]`.
- **ORM: SQLAlchemy 2.0,** `Mapped[]` и `mapped_column()`, общий `meta` в `backend/backend/db/meta.py` с `naming_convention` для всех типов констрейнтов, JSONB через TypeDecorator `PydanticType` с `cache_ok = True`. Alembic запускает `ruff_format` и `ruff_check` как post-write hooks, каталог `db/migrations` выключен из ruff.
- **Тесты: плоские `async def test_<поведение>`** без классов, одна `conftest.py` с фикстурами `anyio_backend`, `_engine`, `dbsession`, `fastapi_app`, `client`, общие хелперы импортируются из `tests.conftest` как обычные функции. Имя файла это контур, а не модуль: `test_admin`, `test_seller`, `test_products`, `test_openapi`, `test_backend`. Синхронный `def test_` допустим, когда нет I/O. `filterwarnings = ["error", ...]`, новое предупреждение роняет набор `[pytest]`.
- **Покрытие: гейт 70%, недопокрытый код не проходит** `[pytest]`. Сбор, порог и `omit` описаны в `backend/AGENTS.md` (см. `## Coverage`), здесь только следствие для кода: тест пишется вместе с изменением, а не «потом». Частичный набор вроде `pytest tests/test_seller.py` меряет не весь пакет, поэтому для быстрой проверки одного файла coverage выключают флагом `--no-cov`.
- **Линт: длина строки 88 для кода, сложность 10, `target-version = "py314"`** `[ruff]`. Длинные строки внутри docstring не проверяются. В `tests/` разрешён assert (S101).
- **Настройки: синглтон модуля,** читает `backend/.env` с префиксом `BACKEND_`, импортируется и никогда не внедряется как зависимость. Зависимости уровня запроса оформлены алиасами `Annotated[X, Depends(f)]`, например `SessionDep` и `CabinetRepoDep` `[наблюдение]`.
