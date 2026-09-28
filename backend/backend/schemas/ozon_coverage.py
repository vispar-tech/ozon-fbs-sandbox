"""Ozon Seller API coverage DTO schemas."""

from backend.schemas.base import ApiModel
from backend.schemas.dates import IsoMsZ


class OzonCoverageMethod(ApiModel):
    """Single Ozon schema operation with its implementation flag."""

    path: str
    method: str
    operation_id: str
    title: str
    doc_url: str
    implemented: bool


class OzonCoverageTag(ApiModel):
    """All schema operations of one tag, with counters."""

    name: str
    total: int
    implemented_total: int
    methods: list[OzonCoverageMethod]


class OzonCoverageGroup(ApiModel):
    """One ``x-tagGroups`` entry with its tags and counters."""

    name: str
    total: int
    implemented_total: int
    tags: list[OzonCoverageTag]


class OzonCoverageSource(ApiModel):
    """Schema mirror location and fetch stamp of the cached payload."""

    url: str
    fetched_at: IsoMsZ


class OzonCoverage(ApiModel):
    """Response of ``GET /api/ozon-coverage``."""

    total: int
    implemented_total: int
    source: OzonCoverageSource
    groups: list[OzonCoverageGroup]
