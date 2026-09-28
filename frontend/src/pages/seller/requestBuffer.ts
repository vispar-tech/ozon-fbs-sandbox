import type {
  SellerOperation,
  SellerRequestInput,
  SellerRequestResult,
} from '@/shared/api/index.js'
import type { CabinetSummary } from '@/shared/model/index.js'

const API_KEY_HEADER = 'Api-Key'
const CLIENT_ID_HEADER = 'Client-Id'
const HTTP_REDIRECT_MIN = 300
const HTTP_CLIENT_ERROR_MIN = 400
const JSON_INDENT_SPACES = 2

const EMPTY_BODY_MESSAGE = 'Тело запроса пустое: вставьте JSON, например {}.'

export type OperationsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; operations: SellerOperation[] }

export type ResponseState =
  | { status: 'sending' }
  | { status: 'failed'; message: string }
  | { status: 'done'; result: SellerRequestResult }

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: string }

export function pickSelectedOperation(
  operations: SellerOperation[],
  selectedId: string | null,
): SellerOperation | null {
  const first = operations[0] ?? null
  if (selectedId === null) {
    return first
  }
  return operations.find((operation) => operation.id === selectedId) ?? first
}

export function pickBody(
  operation: SellerOperation | null,
  bodies: Record<string, string>,
): string {
  if (operation === null) {
    return ''
  }
  return bodies[operation.id] ?? operation.bodyTemplate
}

export function pickActiveResponse(
  responses: Record<string, ResponseState>,
  operation: SellerOperation | null,
): ResponseState | null {
  if (operation === null) {
    return null
  }
  return responses[operation.id] ?? null
}

export function isActiveResponseSending(response: ResponseState | null): boolean {
  return response !== null && response.status === 'sending'
}

export function resolveHeaders(
  operation: SellerOperation | null,
  edited: Record<string, string>,
  cabinet: CabinetSummary,
): Record<string, string> {
  if (operation === null) {
    return {}
  }
  const headers: Record<string, string> = {}
  for (const { name } of operation.requiredHeaders) {
    headers[name] = edited[name] ?? prefillHeader(name, cabinet)
  }
  return headers
}

function prefillHeader(name: string, cabinet: CabinetSummary): string {
  if (name === CLIENT_ID_HEADER) {
    return String(cabinet.client_id)
  }
  if (name === API_KEY_HEADER) {
    return cabinet.api_key
  }
  return ''
}

export function buildRequestInput(
  operation: SellerOperation | null,
  body: string,
  headers: Record<string, string>,
  includeApiKeyInSnippets: boolean,
): SellerRequestInput | null {
  if (operation === null) {
    return null
  }
  return { operation, body, headers, includeApiKeyInSnippets }
}

export function validateJsonBody(text: string): string | null {
  if (text.trim() === '') {
    return EMPTY_BODY_MESSAGE
  }
  const parsed = tryParseJson(text)
  if (parsed.ok) {
    return null
  }
  return `Некорректный JSON: ${parsed.error}`
}

export function tryParseJson(text: string): JsonParseResult {
  try {
    const value: unknown = JSON.parse(text)
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) }
  }
}

export function formatBody(raw: string, parsed: JsonParseResult): string {
  if (!parsed.ok) {
    return raw
  }
  return JSON.stringify(parsed.value, null, JSON_INDENT_SPACES)
}

export function statusVariant(status: number): 'green' | 'orange' | 'red' {
  if (status >= HTTP_CLIENT_ERROR_MIN) {
    return 'red'
  }
  if (status >= HTTP_REDIRECT_MIN) {
    return 'orange'
  }
  return 'green'
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Неизвестная ошибка'
}
