import type { components } from './generated/backend-api.js'

type BackendSchemas = components['schemas']

export type TaxSystem = CompanyInfo['tax_system']
export type RatingStatus = Rating['status']
export type RatingValueType = Rating['value_type']
export type SubscriptionType = Subscription['type']

export type CompanyInfo = BackendSchemas['CompanyInfo']
export type RatingStatusFlags = BackendSchemas['RatingStatusFlags']
export type RatingValue = BackendSchemas['RatingValue']
export type Rating = BackendSchemas['Rating']
export type Subscription = BackendSchemas['Subscription']
export type SellerInfo = BackendSchemas['SellerInfo']
export type Role = BackendSchemas['Role']
export type Roles = BackendSchemas['Roles']
