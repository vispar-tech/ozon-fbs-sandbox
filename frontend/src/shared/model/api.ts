import type { Roles, SellerInfo } from './fixtures.js'

export interface CreateCabinetInput {
  name: string
  demo?: boolean
}

export interface UpdateCabinetInput {
  name?: string
  seller_info?: SellerInfo
  roles?: Roles
}