"""Cabinet DTO schemas."""

import uuid
from typing import Annotated

from pydantic import AfterValidator

from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.schemas.base import ApiModel
from backend.schemas.dates import IsoMsZ


def _name_not_blank(value: str) -> str:
    """Reject a blank name with ValueError.

    Args:
        value: Raw name.

    Returns:
        The name when it contains non-whitespace characters.

    Raises:
        ValueError: When the name is blank.
    """
    if not value.strip():
        raise ValueError("name must be a non-empty string")
    return value


NonBlankName = Annotated[str, AfterValidator(_name_not_blank)]


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

    name: NonBlankName  # trim != ''
    demo: bool = False  # apply demo fixture on create


class UpdateCabinetInput(ApiModel):
    """Unified body of ``PATCH /cabinets/{client_id}``.

    The "at least one field" rule is enforced in the route after the
    existence check, so a missing cabinet answers 404 before the
    empty-body 400/3.
    """

    name: NonBlankName | None = None  # trim != '' if set
    seller_info: SellerInfo | None = None
    roles: Roles | None = None
