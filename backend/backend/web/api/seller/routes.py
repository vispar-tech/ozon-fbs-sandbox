"""Seller API routes (Ozon contract, mounted at the app root)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.db.models.cabinet import Cabinet
from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.web.api.seller.deps import seller_auth
from backend.web.errors import SELLER_ERROR_RESPONSES

SellerCabinetDep = Annotated[Cabinet, Depends(seller_auth)]

router = APIRouter(prefix="/v1", tags=["seller"])


@router.post("/seller/info", responses=SELLER_ERROR_RESPONSES)
async def seller_info(cabinet: SellerCabinetDep) -> SellerInfo:
    """
    Return the seller info of the authenticated cabinet.

    Args:
        cabinet: authenticated cabinet.

    Returns:
        Seller info fixture.
    """
    return cabinet.seller_info


@router.post("/roles", responses=SELLER_ERROR_RESPONSES)
async def roles(cabinet: SellerCabinetDep) -> Roles:
    """
    Return the roles of the authenticated cabinet.

    Args:
        cabinet: authenticated cabinet.

    Returns:
        Roles fixture.
    """
    return cabinet.roles
