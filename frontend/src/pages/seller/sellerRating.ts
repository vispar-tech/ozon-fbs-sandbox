import type { Rating, RatingValue } from '@/shared/model/index.js'

type RatingWithPastValue = Rating & { past_value: RatingValue }

// `past_value` опционален И nullable, поэтому «отсутствует» — это два разных значения.
export function hasPastValue(rating: Rating): rating is RatingWithPastValue {
  return rating.past_value !== undefined && rating.past_value !== null
}

export function emptyRating(): Rating {
  return {
    name: '',
    rating: '',
    status: 'UNKNOWN',
    value_type: 'UNKNOWN',
    current_value: {
      formatted: '',
      value: 0,
      date_from: '',
      date_to: '',
      status: { danger: false, premium: false, warning: false },
    },
    past_value: null,
  }
}
