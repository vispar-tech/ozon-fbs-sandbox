import type { Rating, RatingValue } from '@/shared/model/index.js'

type RatingWithPastValue = Rating & { past_value: RatingValue }

// `past_value` опционален И nullable, поэтому «отсутствует» — это два разных значения.
export function hasPastValue (rating: Rating): rating is RatingWithPastValue {
  return rating.past_value !== undefined && rating.past_value !== null
}
