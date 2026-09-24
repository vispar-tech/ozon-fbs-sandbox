import type { components } from './generated/ozon-api.js'

type OzonSchemas = components['schemas']

export type TaxSystem = OzonSchemas['CompanyTaxSystemEnum']
export type RatingStatus = OzonSchemas['RatingStatusEnum']
export type RatingValueType = OzonSchemas['SellerInfoResponseRatingTypeEnum']
export type SubscriptionType = OzonSchemas['SellerInfoResponseSubscriptionTypeEnum']
export type RatingStatusFlags = OzonSchemas['v1RatingStatus']

export interface CompanyInfo {
  name: string
  legal_name: string
  inn: string
  ogrn: string
  country: string
  currency: string
  ownership_form: string
  tax_system: TaxSystem
}

export interface RatingValue {
  formatted: string
  value: number
  date_from: string
  date_to: string
  status: RatingStatusFlags
}

export interface Rating {
  name: string
  rating: string
  status: RatingStatus
  value_type: RatingValueType
  current_value: RatingValue
  past_value?: RatingValue
}

export interface Subscription {
  is_premium: boolean
  type: SubscriptionType
}

export interface SellerInfo {
  company: CompanyInfo
  ratings: Rating[]
  subscription: Subscription
}

export interface Role {
  name: string
  methods: string[]
}

export interface Roles {
  expires_at: string
  roles: Role[]
}