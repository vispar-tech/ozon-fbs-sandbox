import type { RolesFixture, SellerInfoFixture } from './fixtures.js'
import type { OzonError } from './errors.js'

export interface CreateCabinetInput {
  name: string
  clientId: string
  apiKey: string
  demo?: boolean
}

export interface UpdateCabinetInput {
  name?: string
  clientId?: string
  apiKey?: string
}

export type TestOperation = 'seller-info' | 'roles'

export type TestSimulation = 'missing_headers' | 'invalid_client_id' | 'invalid_key'

export interface TestRequest {
  operation: TestOperation
  simulate?: TestSimulation
}

export type TestResponseBody = SellerInfoFixture | RolesFixture | OzonError

export interface TestResponse {
  status: number
  body: TestResponseBody
}