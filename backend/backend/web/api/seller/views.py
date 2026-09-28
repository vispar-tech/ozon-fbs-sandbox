"""Seller API routes (Ozon contract, mounted at the app root)."""

from fastapi import APIRouter

from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.web.api.seller.deps import SellerCabinetDep
from backend.web.enums import RouterTag
from backend.web.errors import SELLER_ERROR_RESPONSES

router = APIRouter(prefix="/v1", tags=[RouterTag.SELLER])


@router.post("/seller/info", responses=SELLER_ERROR_RESPONSES)
async def seller_info(cabinet: SellerCabinetDep) -> SellerInfo:
    """Return the seller info of the authenticated cabinet.

    Args:
        cabinet: Authenticated cabinet.

    Returns:
        Seller info fixture.
    """
    return cabinet.seller_info


@router.post("/roles", responses=SELLER_ERROR_RESPONSES)
async def roles(cabinet: SellerCabinetDep) -> Roles:
    """Return the roles of the authenticated cabinet.

    Args:
        cabinet: Authenticated cabinet.

    Returns:
        Roles fixture.
    """
    return cabinet.roles
