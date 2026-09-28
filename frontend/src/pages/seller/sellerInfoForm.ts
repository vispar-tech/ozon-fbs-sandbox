import { hasPastValue } from './sellerRating.js'

import type { Rating, SellerInfo } from '@/shared/model/index.js'

export interface SellerInfoFormValues extends Record<string, unknown> {
  'company.name': string
  'company.legal_name': string
  'company.inn': string
  'company.ogrn': string
  'company.country': string
  'company.currency': string
  'company.ownership_form': string
  'company.tax_system': string
  'subscription.type': string
  'subscription.is_premium': boolean
  ratings: Rating[]
}

export function flattenSellerInfo(fixture: SellerInfo): SellerInfoFormValues {
  return {
    'company.name': fixture.company.name,
    'company.legal_name': fixture.company.legal_name,
    'company.inn': fixture.company.inn,
    'company.ogrn': fixture.company.ogrn,
    'company.country': fixture.company.country,
    'company.currency': fixture.company.currency,
    'company.ownership_form': fixture.company.ownership_form,
    'company.tax_system': fixture.company.tax_system,
    'subscription.type': fixture.subscription.type,
    'subscription.is_premium': fixture.subscription.is_premium,
    ratings: fixture.ratings.map((r) => ({
      ...r,
      current_value: { ...r.current_value },
      past_value: hasPastValue(r) ? { ...r.past_value } : null,
    })),
  }
}

export function buildSellerInfoFixture(data: SellerInfoFormValues): SellerInfo {
  return {
    company: {
      name: data['company.name'],
      legal_name: data['company.legal_name'],
      inn: data['company.inn'],
      ogrn: data['company.ogrn'],
      country: data['company.country'],
      currency: data['company.currency'],
      ownership_form: data['company.ownership_form'],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- reconstructing from flat form values
      tax_system: data['company.tax_system'] as SellerInfo['company']['tax_system'],
    },
    subscription: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- reconstructing from flat form values
      type: data['subscription.type'] as SellerInfo['subscription']['type'],
      is_premium: data['subscription.is_premium'],
    },
    ratings: data.ratings.map((r) => ({
      ...r,
      current_value: { ...r.current_value, value: toRatingValueNumber(r.current_value.value) },
      past_value: hasPastValue(r)
        ? { ...r.past_value, value: toRatingValueNumber(r.past_value.value) }
        : null,
    })),
  }
}

// Форма отдаёт value строкой, а тип у RatingValue.value — number.
function toRatingValueNumber(value: number): number {
  const parsed = Number(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}
