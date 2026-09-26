"""Product card routes (Ozon v3/v4 contract, mounted at the app root)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.db.models.cabinet import Cabinet
from backend.schemas.products import (
    GetProductAttributesInput,
    ListProductInput,
    ProductAttributes,
    ProductList,
)
from backend.web.api.deps import FixtureServiceDep
from backend.web.api.seller.deps import seller_auth
from backend.web.errors import SELLER_ERROR_RESPONSES

SellerCabinetDep = Annotated[Cabinet, Depends(seller_auth)]

products_router = APIRouter(tags=["products"])


@products_router.post("/v3/product/list", responses=SELLER_ERROR_RESPONSES)
async def get_product_list(
    body: ListProductInput,
    cabinet: SellerCabinetDep,
    fixtures: FixtureServiceDep,
) -> ProductList:
    """
    Return the product list fixture, ignoring filters and pagination.

    Args:
        body: product list request payload.
        cabinet: authenticated cabinet.
        fixtures: fixture service.

    Returns:
        Complete product list fixture.
    """
    return fixtures.load_products_list()


@products_router.post("/v4/product/info/attributes", responses=SELLER_ERROR_RESPONSES)
async def get_product_attributes(
    body: GetProductAttributesInput,
    cabinet: SellerCabinetDep,
    fixtures: FixtureServiceDep,
) -> ProductAttributes:
    """
    Return the product attributes fixture, ignoring filters and sorting.

    Args:
        body: product attributes request payload.
        cabinet: authenticated cabinet.
        fixtures: fixture service.

    Returns:
        Complete product attributes fixture.
    """
    return fixtures.load_products_attributes()
