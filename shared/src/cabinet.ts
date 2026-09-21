import type { RolesFixture, SellerInfoFixture, SubscriptionType } from './fixtures.js'

export interface Cabinet {
  id: string
  name: string
  clientId: string
  apiKey: string
  createdAt: string
  updatedAt: string
  sellerInfo: SellerInfoFixture
  roles: RolesFixture
}

export type PublicCabinet = Omit<Cabinet, 'apiKey'>

export interface CabinetSummary {
  id: string
  name: string
  clientId: string
  companyName: string | null
  subscriptionType: SubscriptionType | null
  rolesCount: number
  expiresAt: string | null
  updatedAt: string
}