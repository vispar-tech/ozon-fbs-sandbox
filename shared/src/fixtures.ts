import type { components } from './generated/ozon-api.js'

type OzonSchemas = components['schemas']

export type TaxSystem = OzonSchemas['CompanyTaxSystemEnum']
export type RatingStatus = OzonSchemas['RatingStatusEnum']
export type RatingValueType = OzonSchemas['SellerInfoResponseRatingTypeEnum']
export type SubscriptionType = OzonSchemas['SellerInfoResponseSubscriptionTypeEnum']
export type RatingStatusFlags = OzonSchemas['v1RatingStatus']

export interface CompanyFixture {
  name: string
  legal_name: string
  inn: string
  ogrn: string
  country: string
  currency: string
  ownership_form: string
  tax_system: TaxSystem
}

export interface RatingValueFixture {
  formatted: string
  value: number
  date_from: string
  date_to: string
  status: RatingStatusFlags
}

export interface RatingFixture {
  name: string
  rating: string
  status: RatingStatus
  value_type: RatingValueType
  current_value: RatingValueFixture
  past_value?: RatingValueFixture
}

export interface SubscriptionFixture {
  is_premium: boolean
  type: SubscriptionType
}

export interface SellerInfoFixture {
  company: CompanyFixture
  ratings: RatingFixture[]
  subscription: SubscriptionFixture
}

export interface RoleFixture {
  name: string
  methods: string[]
}

export interface RolesFixture {
  expires_at: string
  roles: RoleFixture[]
}