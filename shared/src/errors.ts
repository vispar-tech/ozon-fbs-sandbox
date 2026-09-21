export type AdminErrorCode = 'validation_error' | 'not_found' | 'conflict' | 'invalid_json'

export interface AdminError {
  error: AdminErrorCode
  message: string
}

export interface OzonError {
  code: number
  message: string
  details: unknown[]
}