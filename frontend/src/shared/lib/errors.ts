/**
 * Message for a caught value: real `Error.message` when there is one
 * (transport failures reject with the platform's own `TypeError`),
 * `fallback` only when the thrown value is not an `Error` at all.
 */
export function errorMessageOr(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
