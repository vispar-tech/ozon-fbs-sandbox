import type { CabinetSummary, CreateCabinetInput, UpdateCabinetInput } from '@/shared/model/index.js'

const NO_CONTENT_STATUS = 204

export class ApiError extends Error {
  readonly status: number
  readonly code: number

  constructor (status: number, code: number, message: string) {
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
  const response = await performFetch(`/api${path}`, { ...init, headers })
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

async function performFetch (path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init)
  } catch (cause) {
    throw toApiError(cause)
  }
}

async function toResponseError (response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  const errorBody = isErrorBody(body) ? body : null
  return new ApiError(response.status, errorBody?.code ?? 0, errorBody?.message ?? `Request failed with status ${response.status}`)
}

function toApiError (cause: unknown): ApiError {
  if (cause instanceof ApiError) {
    return cause
  }
  const message = cause instanceof Error ? cause.message : 'Unknown network error'
  return new ApiError(0, 0, message)
}

function isErrorBody (value: unknown): value is { code?: number; message?: string } {
  return typeof value === 'object' && value !== null
}