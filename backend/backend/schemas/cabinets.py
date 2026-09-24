"""Cabinet DTO schemas."""

import uuid

from pydantic import field_validator

from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.schemas.base import ApiModel
from backend.schemas.dates import IsoMsZ


class CabinetSummary(ApiModel):
    """Single response DTO for a cabinet."""

    client_id: int
    name: str
    api_key: uuid.UUID  # serialized as str(uuid) in JSON
    created_at: IsoMsZ
    updated_at: IsoMsZ
    seller_info: SellerInfo
    roles: Roles


class CreateCabinetInput(ApiModel):
    """Body of ``POST /cabinets``."""

    name: str  # trim != ''
    demo: bool = False  # apply demo fixture on create

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        """
        Reject blank names.

        Args:
            value: raw name.

        Returns:
            The name when it contains non-whitespace characters.

        Raises:
            ValueError: when the name is blank.
        """
        if not value.strip():
            raise ValueError("name must be a non-empty string")
        return value


class UpdateCabinetInput(ApiModel):
    """Unified body of ``PATCH /cabinets/{client_id}``.

    The "at least one field" rule is enforced in the route after the
    existence check, so a missing cabinet answers 404 before the
    empty-body 400/3.
    """

    name: str | None = None  # trim != '' if set
    seller_info: SellerInfo | None = None
    roles: Roles | None = None

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str | None) -> str | None:
        """
        Reject blank names.

        Args:
            value: raw name.

        Returns:
            The name when it contains non-whitespace characters.

        Raises:
            ValueError: when the name is blank.
        """
        if value is not None and not value.strip():
            raise ValueError("name must be a non-empty string")
        return value
