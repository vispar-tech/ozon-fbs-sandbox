/** Narrows `unknown` to a non-null, non-array object — the app's only such guard. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
