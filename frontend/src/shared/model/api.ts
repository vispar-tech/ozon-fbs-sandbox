import type { components } from './generated/backend-api.js'

type BackendSchemas = components['schemas']

export type CreateCabinetInput = BackendSchemas['CreateCabinetInput']
export type UpdateCabinetInput = BackendSchemas['UpdateCabinetInput']
