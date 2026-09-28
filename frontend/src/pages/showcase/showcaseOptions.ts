import type { SubscriptionType, TaxSystem } from '@/shared/model/index.js'

export const SUBSCRIPTION_OPTIONS: Array<{ value: SubscriptionType; label: string }> = [
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PREMIUM_LITE', label: 'Premium Lite' },
  { value: 'PREMIUM_PLUS', label: 'Premium Plus' },
]

export const TAX_OPTIONS: Array<{ value: TaxSystem; label: string }> = [
  { value: 'OSNO', label: 'OSNO' },
  { value: 'USN', label: 'USN' },
  { value: 'NPD', label: 'NPD' },
]

export const REGION_OPTIONS = [
  { value: 'moscow', label: 'Moscow' },
  { value: 'spb', label: 'Saint Petersburg' },
  { value: 'novosibirsk', label: 'Novosibirsk' },
  { value: 'ekaterinburg', label: 'Yekaterinburg' },
  { value: 'kazan', label: 'Kazan' },
  { value: 'nn', label: 'Nizhny Novgorod' },
  { value: 'chelyabinsk', label: 'Chelyabinsk' },
  { value: 'krasnoyarsk', label: 'Krasnoyarsk' },
  { value: 'samara', label: 'Samara' },
  { value: 'ufa', label: 'Ufa' },
  { value: 'rostov', label: 'Rostov-on-Don' },
  { value: 'omsk', label: 'Omsk' },
]

export const COUNTRY_OPTIONS = [
  { value: 'ru', label: 'Russia' },
  { value: 'by', label: 'Belarus' },
  { value: 'kz', label: 'Kazakhstan' },
  { value: 'am', label: 'Armenia' },
  { value: 'kg', label: 'Kyrgyzstan' },
  { value: 'uz', label: 'Uzbekistan' },
  { value: 'tj', label: 'Tajikistan' },
  { value: 'tm', label: 'Turkmenistan' },
  { value: 'az', label: 'Azerbaijan' },
  { value: 'ge', label: 'Georgia' },
  { value: 'md', label: 'Moldova' },
  { value: 'ua', label: 'Ukraine' },
  { value: 'pl', label: 'Poland' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'pt', label: 'Portugal' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'be', label: 'Belgium' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'cz', label: 'Czech Republic' },
  { value: 'tr', label: 'Turkey' },
]
