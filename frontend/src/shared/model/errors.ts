import type { components } from './generated/backend-api.js'

type BackendSchemas = components['schemas']

export type OzonError = BackendSchemas['OzonError']
