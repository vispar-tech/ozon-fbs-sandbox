// Data layer of the "Запросы" tab. The operation list is derived from the
// backend OpenAPI document (GET /api/openapi.json, root-relative so the Vite
// dev proxy and nginx both route it to the backend): only the /vN/ seller-
// contract paths are surfaced, /api/* internal routes are not. The prefix is
// matched by pattern rather than an allowlist so a new /v2/ route cannot
// silently vanish from the tab.
//
// Clipboard snippet generation is presentation and lives in
// pages/seller/RequestsSnippets.ts; the Ozon error contract lives in
// ozon-error.ts. This module therefore reads no browser globals.

import { isRecord } from '@/shared/lib/index.js'

const OPENAPI_DOCUMENT_PATH = '/api/openapi.json'
const SELLER_PATH_PATTERN = /^\/v\d+\//v
const POST_METHOD = 'post'
const DOCUMENT_REF_PREFIX = '#/'
const POINTER_SEPARATOR = '/'
const POINTER_ESCAPE_ONE = '~1'
const POINTER_ESCAPE_ZERO = '~0'
const HEADER_SCHEME_LOCATION = 'header'
const JSON_MEDIA_TYPE = 'application/json'
const NULL_TYPE_KEYWORD = 'null'
// Wire constants, shared with the snippet builders: they name the request this
// data layer actually sends, so the data layer owns them.
export const CONTENT_TYPE_HEADER = 'Content-Type'
export const JSON_CONTENT_TYPE = 'application/json'
const JSON_INDENT_SPACES = 2
const EMPTY_BODY_TEMPLATE = '{}'

export interface SellerOperation {
  id: string
  method: 'post'
  path: string
  title: string
  description: string
  bodyTemplate: string
  requiredHeaders: Array<{ name: string }>
  responses: Array<{ status: number; summary: string }>
}

export interface SellerRequestInput {
  operation: SellerOperation
  body: string
  headers: Record<string, string>
  includeApiKeyInSnippets: boolean
}

export interface SellerRequestResult {
  status: number
  durationMs: number
  body: string
}

export async function getSellerOperations(): Promise<SellerOperation[]> {
  const document = await fetchOpenApiDocument()
  return collectSellerOperations(document)
}

export async function sendSellerRequest(input: SellerRequestInput): Promise<SellerRequestResult> {
  const headers = new Headers()
  for (const [name, value] of Object.entries(input.headers)) {
    headers.set(name, value)
  }
  headers.set(CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE)
  const startedAt = performance.now()
  const response = await fetch(input.operation.path, {
    method: input.operation.method.toUpperCase(),
    headers,
    body: input.body,
  })
  const body = await response.text()
  return { status: response.status, durationMs: performance.now() - startedAt, body }
}

async function fetchOpenApiDocument(): Promise<unknown> {
  const response = await fetch(OPENAPI_DOCUMENT_PATH)
  if (!response.ok) {
    throw new Error(`Не удалось загрузить OpenAPI-схему: HTTP ${response.status}`)
  }
  const document: unknown = await response.json()
  return document
}

function collectSellerOperations(document: unknown): SellerOperation[] {
  if (!isRecord(document) || !isRecord(document.paths)) {
    throw new Error('Не удалось разобрать OpenAPI-схему: раздел paths отсутствует')
  }
  const { paths } = document
  const operations: SellerOperation[] = []
  for (const [path, rawPathItem] of Object.entries(paths)) {
    if (!isSellerPath(path) || !isRecord(rawPathItem)) {
      continue
    }
    const pathItem = resolveRef(rawPathItem, document)
    if (pathItem === null) {
      continue
    }
    const { [POST_METHOD]: operation } = pathItem
    if (!isRecord(operation)) {
      continue
    }
    operations.push(toSellerOperation(path, operation, document))
  }
  return operations
}

function isSellerPath(path: string): boolean {
  return SELLER_PATH_PATTERN.test(path)
}

function toSellerOperation(
  path: string,
  operation: Record<string, unknown>,
  document: Record<string, unknown>,
): SellerOperation {
  const { summary, description, operationId } = operation
  return {
    id: `${POST_METHOD}:${path}`,
    method: POST_METHOD,
    path,
    title: pickTitle(summary, operationId, path),
    description: typeof description === 'string' ? description : '',
    bodyTemplate: buildBodyTemplate(operation, document),
    requiredHeaders: buildRequiredHeaders(operation, document),
    responses: buildResponses(operation),
  }
}

function pickTitle(summary: unknown, operationId: unknown, path: string): string {
  if (typeof summary === 'string' && summary !== '') {
    return summary
  }
  if (typeof operationId === 'string' && operationId !== '') {
    return operationId
  }
  return path
}

function buildRequiredHeaders(
  operation: Record<string, unknown>,
  document: Record<string, unknown>,
): Array<{ name: string }> {
  const headers: Array<{ name: string }> = []
  const { security } = operation
  if (!Array.isArray(security)) {
    return headers
  }
  const { components } = document
  const securitySchemes = isRecord(components) ? components.securitySchemes : null
  const seen = new Set<string>()
  // OpenAPI `security` is an OR of AND-groups, so this union over-collects
  // against the spec. Deliberate: the seller routes require every scheme at
  // once, and under-collecting here would send a request that fails 401/16.
  for (const requirement of security) {
    if (!isRecord(requirement)) {
      continue
    }
    for (const schemeName of Object.keys(requirement)) {
      const headerName = resolveHeaderName(securitySchemes, schemeName)
      if (headerName === null || seen.has(headerName)) {
        continue
      }
      seen.add(headerName)
      headers.push({ name: headerName })
    }
  }
  return headers
}

function resolveHeaderName(securitySchemes: unknown, schemeName: string): string | null {
  if (!isRecord(securitySchemes)) {
    return null
  }
  const { [schemeName]: scheme } = securitySchemes
  if (!isRecord(scheme)) {
    return null
  }
  const { in: location, name } = scheme
  if (location !== HEADER_SCHEME_LOCATION || typeof name !== 'string') {
    return null
  }
  return name
}

function buildResponses(
  operation: Record<string, unknown>,
): Array<{ status: number; summary: string }> {
  const responses: Array<{ status: number; summary: string }> = []
  const { responses: declared } = operation
  if (!isRecord(declared)) {
    return responses
  }
  for (const [statusKey, response] of Object.entries(declared)) {
    const status = Number(statusKey)
    if (!Number.isInteger(status)) {
      continue
    }
    const summary =
      isRecord(response) && typeof response.description === 'string' ? response.description : ''
    responses.push({ status, summary })
  }
  return responses
}

function buildBodyTemplate(
  operation: Record<string, unknown>,
  document: Record<string, unknown>,
): string {
  const schema = findJsonSchema(operation, document)
  if (schema === null) {
    return EMPTY_BODY_TEMPLATE
  }
  const template = buildTemplateObject(schema, document)
  return JSON.stringify(template, null, JSON_INDENT_SPACES)
}

function findJsonSchema(
  operation: Record<string, unknown>,
  document: Record<string, unknown>,
): Record<string, unknown> | null {
  const { requestBody } = operation
  if (!isRecord(requestBody)) {
    return null
  }
  const { content } = requestBody
  if (!isRecord(content)) {
    return null
  }
  const { [JSON_MEDIA_TYPE]: media } = content
  if (!isRecord(media) || !isRecord(media.schema)) {
    return null
  }
  return resolveRef(media.schema, document)
}

function buildTemplateObject(
  schema: Record<string, unknown>,
  document: Record<string, unknown>,
): Record<string, unknown> {
  const { properties } = schema
  if (!isRecord(properties)) {
    return {}
  }
  const template: Record<string, unknown> = {}
  for (const [key, propertySchema] of Object.entries(properties)) {
    template[key] = toTemplateValue(propertySchema, document)
  }
  return template
}

function toTemplateValue(schema: unknown, document: Record<string, unknown>): unknown {
  if (!isRecord(schema)) {
    return null
  }
  const resolved = resolveSchemaRef(unwrapAnyOf(schema), document)
  const { type, properties } = resolved
  if (isRecord(properties) || type === 'object') {
    return {}
  }
  if (type === 'array') {
    return []
  }
  if (type === 'string') {
    return ''
  }
  if (type === 'boolean') {
    return false
  }
  if (type === 'integer' || type === 'number') {
    return 0
  }
  return null
}

function unwrapAnyOf(schema: Record<string, unknown>): Record<string, unknown> {
  const { anyOf } = schema
  if (!Array.isArray(anyOf)) {
    return schema
  }
  for (const alternative of anyOf) {
    if (isRecord(alternative) && alternative.type !== NULL_TYPE_KEYWORD) {
      return alternative
    }
  }
  return schema
}

function resolveSchemaRef(
  schema: Record<string, unknown>,
  document: Record<string, unknown>,
): Record<string, unknown> {
  return resolveRef(schema, document) ?? schema
}

function resolveRef(
  target: Record<string, unknown>,
  document: Record<string, unknown>,
): Record<string, unknown> | null {
  const { $ref: targetRef } = target
  if (typeof targetRef !== 'string') {
    return target
  }
  const resolved = readDocumentPointer(targetRef, document)
  return isRecord(resolved) ? resolved : null
}

function readDocumentPointer(ref: string, document: Record<string, unknown>): unknown {
  if (!ref.startsWith(DOCUMENT_REF_PREFIX)) {
    return null
  }
  let current: unknown = document
  const segments = ref.slice(DOCUMENT_REF_PREFIX.length).split(POINTER_SEPARATOR)
  for (const rawSegment of segments) {
    if (!isRecord(current)) {
      return null
    }
    const { [decodePointerSegment(rawSegment)]: next } = current
    current = next
  }
  return current
}

function decodePointerSegment(segment: string): string {
  return segment
    .replaceAll(POINTER_ESCAPE_ONE, POINTER_SEPARATOR)
    .replaceAll(POINTER_ESCAPE_ZERO, '~')
}
