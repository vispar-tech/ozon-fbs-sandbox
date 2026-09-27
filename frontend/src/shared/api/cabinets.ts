import type { OzonErrorEnvelope } from './ozon-error.js'

import { isRecord } from '@/shared/lib/index.js'
import type { CabinetSummary, CreateCabinetInput, UpdateCabinetInput } from '@/shared/model/index.js'

const NO_CONTENT_STATUS = 204

export class ApiError extends Error {
  readonly status: number
  readonly code: number | null

  constructor (status: number, code: number | null, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const listCabinets = async (): Promise<CabinetSummary[]> => await request('/cabinets')

export const createCabinet = async (input: CreateCabinetInput): Promise<CabinetSummary> =>
  await request('/cabinets', { method: 'POST', body: JSON.stringify(input) })

export const getCabinet = async (clientId: number): Promise<CabinetSummary> =>
  await request(`/cabinets/${clientId}`)

export const updateCabinet = async (clientId: number, input: UpdateCabinetInput): Promise<CabinetSummary> =>
  await request(`/cabinets/${clientId}`, { method: 'PATCH', body: JSON.stringify(input) })

export const deleteCabinet = async (clientId: number): Promise<void> => {
  await request(`/cabinets/${clientId}`, { method: 'DELETE' })
}

async function request<T> (path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined
  const headers = new Headers(init?.headers)
  if (hasBody) {
    headers.set('Content-Type', 'application/json')
  }
  // A transport failure rejects with the platform's own TypeError and keeps its
  // own message, so it is not wrapped: there is no HTTP status or API code to report.
  const response = await fetch(`/api${path}`, { ...init, headers })
  if (!response.ok) {
    throw await toResponseError(response)
  }
  if (response.status === NO_CONTENT_STATUS) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 has no body by contract
    return undefined as T
  }
  const data: unknown = await response.json().catch(() => null)
  if (data === null) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- empty body by contract
    return undefined as T
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response shape is validated by the backend contract
  return data as T
}

async function toResponseError (response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  if (isErrorBody(body) && body.message !== undefined) {
    return new ApiError(response.status, body.code ?? null, body.message)
  }
  return new ApiError(response.status, null, `Response body is not an OzonError (HTTP ${response.status})`)
}

function isErrorBody (value: unknown): value is OzonErrorEnvelope {
  if (!isRecord(value)) {
    return false
  }
  const { code, message } = value
  return (code === undefined || typeof code === 'number') && (message === undefined || typeof message === 'string')
}