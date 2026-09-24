"""Seller info domain model (JSONB column type)."""

from typing import Literal

from backend.db.models.base import DomainModel
from backend.db.types.dates import IsoMsZ

TaxSystem = Literal["UNKNOWN", "UNSPECIFIED", "OSNO", "USN", "NPD", "AUSN", "PSN"]
RatingStatus = Literal["UNKNOWN", "OK", "WARNING", "CRITICAL"]
RatingValueType = Literal[
    "UNKNOWN", "INDEX", "PERCENT", "TIME", "RATIO", "REVIEW_SCORE", "COUNT"
]
SubscriptionType = Literal[
    "UNKNOWN", "UNSPECIFIED", "PREMIUM", "PREMIUM_LITE", "PREMIUM_PLUS", "PREMIUM_PRO"
]


class CompanyInfo(DomainModel):
    """Company details of a seller."""

    name: str
    legal_name: str
    inn: str
    ogrn: str
    country: str
    currency: str
    ownership_form: str
    tax_system: TaxSystem


class RatingStatusFlags(DomainModel):
    """Display flags of a rating value."""

    danger: bool
    premium: bool
    warning: bool


class RatingValue(DomainModel):
    """Single rating value snapshot.

    ``value`` is ``int | float``, not ``float``, so whole numbers keep
    byte-parity (``92`` does not become ``92.0``).
    """

    formatted: str
    value: int | float
    date_from: IsoMsZ
    date_to: IsoMsZ
    status: RatingStatusFlags


class Rating(DomainModel):
    """Seller rating entry."""

    name: str
    rating: str
    status: RatingStatus
    value_type: RatingValueType
    current_value: RatingValue
    past_value: RatingValue


class Subscription(DomainModel):
    """Seller subscription state."""

    is_premium: bool
    type: SubscriptionType


class SellerInfo(DomainModel):
    """Value of the ``seller_info`` JSONB column."""

    company: CompanyInfo
    ratings: list[Rating]
    subscription: Subscription
