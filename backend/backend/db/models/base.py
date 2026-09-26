"""Base for JSONB domain models."""

from pydantic import BaseModel, ConfigDict


class DomainModel(BaseModel):
    """Base for JSONB domain models. Unknown keys are rejected, not kept."""

    model_config = ConfigDict(extra="forbid")
