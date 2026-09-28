import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { JSX, SubmitEvent } from 'react'
import { useState } from 'react'

import type { OperationsState, ResponseState } from './requestBuffer.js'
import { formatBody, statusVariant, tryParseJson } from './requestBuffer.js'
import styles from './RequestsTabSections.module.scss'

import type { SellerOperation } from '@/shared/api/index.js'
import { toOzonError } from '@/shared/api/index.js'
import type { OzonError } from '@/shared/model/index.js'
import { Button, CopyButton, Icon } from '@/shared/ui/actions/index.js'
import { Eyebrow } from '@/shared/ui/data/index.js'
import {
  Alert,
  Badge,
  CenteredStatus,
  EmptyState,
  ErrorBanner,
  Skeleton,
} from '@/shared/ui/feedback/index.js'
import { Input, Textarea, Toggle } from '@/shared/ui/inputs/index.js'
import { Card } from '@/shared/ui/layout/index.js'

const DESCRIPTION_PREVIEW_LENGTH = 160
const RAIL_SKELETON_COUNT = 4
const BODY_EDITOR_ROWS = 12
const OZON_CODE_INVALID_CLIENT_ID = 3
const OZON_CODE_INVALID_CONTENT_TYPE = 4
const OZON_CODE_INVALID_API_KEY = 5
const OZON_CODE_INTERNAL = 13
const OZON_CODE_MISSING_HEADERS = 16

const NETWORK_FAILURE_HINT =
  'Сервер не ответил — проверьте, что бэкенд запущен, и отправьте запрос повторно.'

// CSS-module classes are typed `string | undefined` while CenteredStatus rejects
// an explicit undefined under exactOptionalPropertyTypes, so the narrowing lives
// at module scope instead of inside renderResponseBody (a `??` per branch would
// push that function past the configured complexity limit).
const RESPONSE_CENTER_CLASS = styles.responseCenter ?? ''

// The `string | undefined` value type is deliberate: a response may carry a code
// outside this list, and the lookup must degrade to "no hint" instead of pretending.
const OZON_ERROR_HINTS: Record<number, string | undefined> = {
  [OZON_CODE_INVALID_CLIENT_ID]:
    'Client-Id должен быть положительным целым числом и совпадать с кабинетом. Тот же код приходит, когда тело запроса не разбирается как JSON.',
  [OZON_CODE_INVALID_CONTENT_TYPE]:
    'Сервер ждёт Content-Type: application/json — он подставляется автоматически при отправке из этой вкладки.',
  [OZON_CODE_INVALID_API_KEY]:
    'Api-Key не подходит к Client-Id, кабинет не найден или ключ просрочен. Проверьте значения в разделе «Заголовки».',
  [OZON_CODE_INTERNAL]:
    'Внутренняя ошибка песочницы. Повторите запрос; если падает повторно — смотрите логи бэкенда.',
  [OZON_CODE_MISSING_HEADERS]:
    'В запросе нет Client-Id или Api-Key. Заполните оба поля в разделе «Заголовки».',
}

interface OperationsRailProps {
  state: OperationsState
  activeId: string | null
  onSelect: (operationId: string) => void
  onRetry: () => void
}

interface OperationPanelProps {
  operation: SellerOperation
}

interface RequestPanelProps {
  operation: SellerOperation
  body: string
  jsonError: string | null
  bodyError: string | null
  headers: Record<string, string>
  includeApiKeyInCurl: boolean
  sending: boolean
  curlCommand: string
  fetchSnippet: string
  onBodyChange: (value: string) => void
  onBodyBlur: () => void
  onHeaderChange: (name: string, value: string) => void
  onIncludeApiKeyInCurlChange: (checked: boolean) => void
  onSend: () => void
}

interface ResponsePanelProps {
  operation: SellerOperation
  response: ResponseState | null
  seq: number
}

interface OzonErrorPanelProps {
  error: OzonError
}

export function OperationsRail({
  state,
  activeId,
  onSelect,
  onRetry,
}: OperationsRailProps): JSX.Element {
  const ready = state.status === 'ready'
  const count = ready ? state.operations.length : 0

  return (
    <aside className={styles.rail} aria-label='Методы API'>
      <Card title='Методы' headerAction={ready ? <Badge size='sm'>{count}</Badge> : undefined}>
        {state.status === 'loading' && (
          <div className={styles.railList}>
            {Array.from({ length: RAIL_SKELETON_COUNT }, (_, index) => (
              <Skeleton key={index} variant='rect' height='64px' />
            ))}
          </div>
        )}
        {state.status === 'error' && (
          <div className={styles.railError}>
            <ErrorBanner title='Не удалось загрузить методы' message={state.message} />
            <Button
              variant='secondary'
              size='sm'
              icon={<Icon icon={ArrowPathIcon} size='sm' />}
              onClick={onRetry}
            >
              Повторить
            </Button>
          </div>
        )}
        {ready && count === 0 && (
          <EmptyState
            title='Методы не найдены'
            description='Схема OpenAPI не содержит операций seller API.'
          />
        )}
        {ready && count > 0 && (
          <div className={styles.railList}>
            {state.operations.map((operation) => (
              <button
                key={operation.id}
                type='button'
                className={clsx(
                  styles.railItem,
                  operation.id === activeId && styles.railItemActive,
                )}
                aria-current={operation.id === activeId ? 'true' : undefined}
                onClick={() => {
                  onSelect(operation.id)
                }}
              >
                <Badge size='sm'>{operation.method.toUpperCase()}</Badge>
                <span className={styles.railItemTitle}>{operation.title}</span>
                <span className={styles.railItemPath}>{operation.path}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </aside>
  )
}

export function OperationPanel({ operation }: OperationPanelProps): JSX.Element {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const descriptionIsLong = operation.description.length > DESCRIPTION_PREVIEW_LENGTH
  const clamped = descriptionIsLong && !showFullDescription

  return (
    <Card
      title={operation.title}
      headerAction={
        <span className={styles.requestLine}>
          <Badge variant='blue' size='sm'>
            {operation.method.toUpperCase()}
          </Badge>
          <span className={styles.requestPath}>{operation.path}</span>
        </span>
      }
    >
      <p className={clsx(styles.description, clamped && styles.descriptionClamped)}>
        {operation.description}
      </p>
      {descriptionIsLong && (
        <Button
          variant='ghost'
          size='sm'
          className={styles.descriptionToggle}
          icon={<Icon icon={showFullDescription ? ChevronUpIcon : ChevronDownIcon} size='xs' />}
          onClick={() => {
            setShowFullDescription((previous) => !previous)
          }}
        >
          {showFullDescription ? 'Свернуть' : 'Показать полностью'}
        </Button>
      )}
      {operation.responses.length > 0 && (
        <div className={styles.responses}>
          <Eyebrow>Ответы по схеме</Eyebrow>
          <ul className={styles.responseList}>
            {operation.responses.map((documented, index) => (
              <li key={`${documented.status}-${index}`} className={styles.responseItem}>
                <Badge variant={statusVariant(documented.status)} size='sm'>
                  {documented.status}
                </Badge>
                <span className={styles.muted}>{documented.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export function RequestPanel({
  operation,
  body,
  jsonError,
  bodyError,
  headers,
  includeApiKeyInCurl,
  sending,
  curlCommand,
  fetchSnippet,
  onBodyChange,
  onBodyBlur,
  onHeaderChange,
  onIncludeApiKeyInCurlChange,
  onSend,
}: RequestPanelProps): JSX.Element {
  // Enter in the single-line header inputs is the natural "send" gesture, so
  // the card body is a real <form>; validation still stays out of the way (the
  // Ozon four-step error contract must be demonstrable — see RequestsTab.tsx).
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    onSend()
  }

  return (
    <Card
      title='Запрос'
      footer={
        <div className={styles.footerRow}>
          <div className={styles.rowWrap}>
            <Toggle
              checked={includeApiKeyInCurl}
              onChange={onIncludeApiKeyInCurlChange}
              label='Включать Api-Key в копируемый код'
            />
            {includeApiKeyInCurl && (
              <span className={styles.secretWarning}>
                <Icon icon={ExclamationTriangleIcon} size='xs' />
                Ключ кабинета попадёт в буфер обмена
              </span>
            )}
          </div>
          <div className={styles.copyActions}>
            <div className={styles.copyActionsRow}>
              <CopyButton value={curlCommand} label='Копировать cURL' />
              <CopyButton
                value={fetchSnippet}
                label='Копировать fetch'
                disabled={fetchSnippet === ''}
              />
            </div>
            {fetchSnippet === '' && (
              <span className={styles.muted}>
                Fetch-код появится, когда тело запроса станет валидным JSON
              </span>
            )}
          </div>
        </div>
      }
    >
      <form noValidate onSubmit={handleSubmit}>
        <Eyebrow>Заголовки</Eyebrow>
        <div className={styles.headerGrid}>
          {operation.requiredHeaders.map((header) => (
            <Input
              key={header.name}
              label={header.name}
              value={headers[header.name] ?? ''}
              autoComplete='off'
              spellCheck={false}
              onChange={(event) => {
                onHeaderChange(header.name, event.target.value)
              }}
            />
          ))}
        </div>
        <p className={styles.contentTypeNote}>
          Content-Type: application/json подставляется автоматически
        </p>
        <Textarea
          label='Тело запроса (JSON)'
          value={body}
          rows={BODY_EDITOR_ROWS}
          spellCheck={false}
          className={styles.editor}
          error={bodyError ?? undefined}
          hint='Отправляется в запросе без изменений'
          onChange={(event) => {
            onBodyChange(event.target.value)
          }}
          onBlur={onBodyBlur}
        />
        <div className={styles.sendRow}>
          <Button
            type='submit'
            variant='primary'
            icon={<Icon icon={PaperAirplaneIcon} size='sm' />}
            loading={sending}
            disabled={jsonError !== null}
          >
            Отправить
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function ResponsePanel({ operation, response, seq }: ResponsePanelProps): JSX.Element {
  return (
    <Card title='Ответ'>
      {/* The live region must outlive its content: renderResponseBody swaps
          whole subtrees and the result block is re-keyed by `seq`, so
          `aria-live` sits on this persistent wrapper, never on a keyed or
          conditional element. */}
      <div aria-live='polite'>{renderResponseBody(operation, response, seq)}</div>
    </Card>
  )
}

function OzonErrorPanel({ error }: OzonErrorPanelProps): JSX.Element {
  const { code, message, details } = error
  const hint: string | undefined = OZON_ERROR_HINTS[code]

  return (
    <div className={styles.errorPanel}>
      <div className={styles.errorPanelHead}>
        <Badge variant='red' size='sm'>{`Код ${code}`}</Badge>
        {hint === undefined ? (
          <Alert tone='danger' title={message} />
        ) : (
          <Alert tone='danger' title={message} description={hint} />
        )}
      </div>
      {details !== undefined && details.length > 0 && (
        <>
          <Eyebrow>Детали</Eyebrow>
          <pre className={styles.raw} tabIndex={0} role='region' aria-label='Детали'>
            {JSON.stringify(details)}
          </pre>
        </>
      )}
    </div>
  )
}

function renderResponseBody(
  operation: SellerOperation,
  response: ResponseState | null,
  seq: number,
): JSX.Element {
  if (response === null) {
    return (
      <EmptyState
        icon={<Icon icon={PaperAirplaneIcon} size='lg' />}
        title='Ответ появится здесь'
        description='Проверьте заголовки и тело запроса, затем нажмите «Отправить»: покажем статус, разбор ошибки Ozon и сырой JSON.'
      />
    )
  }
  if (response.status === 'sending') {
    return (
      <CenteredStatus
        status='loading'
        label='Запрос выполняется'
        className={RESPONSE_CENTER_CLASS}
        minHeight='auto'
      >
        <span
          className={styles.responseHint}
        >{`${operation.method.toUpperCase()} ${operation.path}`}</span>
      </CenteredStatus>
    )
  }
  if (response.status === 'failed') {
    return (
      <CenteredStatus
        status='error'
        title='Запрос не выполнен'
        message={response.message}
        className={RESPONSE_CENTER_CLASS}
        minHeight='auto'
      >
        <p className={styles.responseHint}>{NETWORK_FAILURE_HINT}</p>
      </CenteredStatus>
    )
  }
  const { result } = response
  const parsed = tryParseJson(result.body)
  const ozonError = parsed.ok ? toOzonError(parsed.value) : null

  return (
    <div key={seq}>
      <div className={styles.rowWrap}>
        <Badge variant={statusVariant(result.status)} size='sm'>
          HTTP {result.status}
        </Badge>
        <span className={styles.note}>{`${Math.round(result.durationMs)} мс`}</span>
        <span className={styles.note}>{`${operation.method.toUpperCase()} ${operation.path}`}</span>
      </div>
      {ozonError !== null && <OzonErrorPanel error={ozonError} />}
      <div className={styles.rawBlock}>
        <div className={styles.rawHead}>
          <Eyebrow>{ozonError === null ? 'Тело ответа' : 'Сырой ответ'}</Eyebrow>
          <CopyButton value={result.body} label='Копировать ответ' />
        </div>
        <pre
          className={clsx(styles.raw, ozonError !== null && styles.rawSecondary)}
          tabIndex={0}
          role='region'
          aria-label={ozonError === null ? 'Тело ответа' : 'Сырой ответ'}
        >
          {formatBody(result.body, parsed)}
        </pre>
      </div>
    </div>
  )
}
