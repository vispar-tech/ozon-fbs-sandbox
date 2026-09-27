// Clipboard snippets for the "Запросы" tab. This is a presentation concern, so
// it lives beside the page instead of in shared/api/: the cURL snippet
// interpolates window.location.origin, and a data module must not read browser
// globals. The wire constants it shares with the request sender are imported
// from the data layer rather than redeclared.

import type { SellerRequestInput } from '@/shared/api/index.js'
import { CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE } from '@/shared/api/index.js'

// Masking the key in a snippet is a presentation decision, not a wire one: the
// OpenAPI parser derives real header names from the document, so these two are
// only ever needed to decide what to hide in the text the user copies.
const API_KEY_HEADER = 'Api-Key'
const REDACTED_API_KEY = '<Api-Key>'

export function buildCurlCommand (input: SellerRequestInput): string {
  const url = escapeForShell(`${window.location.origin}${input.operation.path}`)
  const flags = [
    `-X ${input.operation.method.toUpperCase()}`,
    `-H '${CONTENT_TYPE_HEADER}: ${JSON_CONTENT_TYPE}'`,
    ...buildHeaderFlags(input)
  ]
  const body = input.body.trim()
  if (body !== '') {
    flags.push(`--data-raw '${escapeForShell(body)}'`)
  }
  return `curl '${url}' \\\n  ${flags.join(' \\\n  ')}`
}

export function buildFetchSnippet (input: SellerRequestInput): string {
  const body = input.body.trim()
  if (body !== '' && !isValidJson(body)) {
    return ''
  }
  const lines = [
    `await fetch('${escapeForJsString(input.operation.path)}', {`,
    `  method: '${input.operation.method.toUpperCase()}',`,
    '  headers: {',
    `    '${CONTENT_TYPE_HEADER}': '${JSON_CONTENT_TYPE}',`,
    ...Object.entries(input.headers).map(([name, value]) => {
      const headerValue = maskSecret(name, value, input.includeApiKeyInSnippets)
      return `    '${escapeForJsString(name)}': '${escapeForJsString(headerValue)}',`
    }),
    '  },'
  ]
  if (body !== '') {
    lines.push(`  body: JSON.stringify(${body}),`)
  }
  lines.push('})')
  return lines.join('\n')
}

function buildHeaderFlags (input: SellerRequestInput): string[] {
  return Object.entries(input.headers).map(([name, value]) => {
    const header = `${name}: ${maskSecret(name, value, input.includeApiKeyInSnippets)}`
    return `-H '${escapeForShell(header)}'`
  })
}

function maskSecret (name: string, value: string, includeApiKey: boolean): string {
  if (name.toLowerCase() === API_KEY_HEADER.toLowerCase() && !includeApiKey) {
    return REDACTED_API_KEY
  }
  return value
}

function escapeForShell (value: string): string {
  return value.replaceAll("'", "'\\''")
}

function escapeForJsString (value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

function isValidJson (value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
