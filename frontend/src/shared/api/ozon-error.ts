// The Ozon error contract: the envelope Ozon returns on a failed call, and the
// conversion of that envelope into the typed domain shape. It lives apart from
// seller.ts because it is neither OpenAPI parsing nor request sending, and
// because cabinets.ts has to recognise the same envelope when a cabinet call
// fails — the shape below is the single declaration both sides validate against.

import { isRecord } from '@/shared/lib/index.js'
import type { OzonError } from '@/shared/model/index.js'

// Every field is optional and spelled `?: T | undefined` because tsconfig sets
// exactOptionalPropertyTypes: the two readers differ in strictness, and a
// validator that must tolerate a body carrying only `message` cannot use a
// bare `?:`. `toOzonError` below is the strict reader, `isErrorBody` in
// cabinets.ts the lenient one.
export interface OzonErrorEnvelope {
  code?: number | undefined
  message?: string | undefined
  details?: unknown[] | undefined
}

export function toOzonError (value: unknown): OzonError | null {
  if (!isRecord(value)) {
    return null
  }
  const { code, message, details } = value
  if (typeof code !== 'number' || typeof message !== 'string') {
    return null
  }
  if (Array.isArray(details)) {
    return { code, message, details }
  }
  return { code, message }
}
