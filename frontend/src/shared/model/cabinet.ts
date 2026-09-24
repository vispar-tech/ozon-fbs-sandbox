import type { Roles, SellerInfo } from './fixtures.js'

export interface CabinetSummary {
  client_id: number
  name: string
  api_key: string
  created_at: string
  updated_at: string
  seller_info: SellerInfo
  roles: Roles
}