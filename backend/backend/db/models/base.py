"""Base for JSONB domain models."""

from pydantic import BaseModel, ConfigDict


class DomainModel(BaseModel):
    """Base for JSONB domain models.

    ``extra="allow"`` keeps unknown keys verbatim on read/write as a
    byte-parity safety net when fixture data drifts.
    """

    model_config = ConfigDict(extra="allow")
