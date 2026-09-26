"""Roles domain model (JSONB column type)."""

from backend.db.models.base import DomainModel
from backend.db.types.dates import IsoMsZNullable


class Role(DomainModel):
    """Named set of allowed API methods."""

    name: str
    methods: list[str]


class Roles(DomainModel):
    """Value of the ``roles`` JSONB column."""

    expires_at: IsoMsZNullable
    roles: list[Role]
