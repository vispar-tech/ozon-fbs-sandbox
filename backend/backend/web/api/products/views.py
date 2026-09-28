"""Product card routes (Ozon v3/v4 contract, mounted at the app root)."""

from fastapi import APIRouter

from backend.schemas.products import (
    GetProductAttributesInput,
    ListProductInput,
    ProductAttributes,
    ProductList,
)
from backend.web.api.deps import FixtureServiceDep
from backend.web.api.seller.deps import SellerCabinetDep
from backend.web.enums import RouterTag
from backend.web.errors import SELLER_ERROR_RESPONSES

router = APIRouter(tags=[RouterTag.PRODUCTS])


@router.post("/v3/product/list", responses=SELLER_ERROR_RESPONSES)
async def get_product_list(
    body: ListProductInput,
    cabinet: SellerCabinetDep,
    fixtures: FixtureServiceDep,
) -> ProductList:
    """Return the product list fixture, ignoring filters and pagination.

    Args:
        body: Product list request payload.
        cabinet: Authenticated cabinet.
        fixtures: Fixture service.

    Returns:
        Complete product list fixture.
    """
    return fixtures.load_products_list()


@router.post("/v4/product/info/attributes", responses=SELLER_ERROR_RESPONSES)
async def get_product_attributes(
    body: GetProductAttributesInput,
    cabinet: SellerCabinetDep,
    fixtures: FixtureServiceDep,
) -> ProductAttributes:
    """Return the product attributes fixture, ignoring filters and sorting.

    Args:
        body: Product attributes request payload.
        cabinet: Authenticated cabinet.
        fixtures: Fixture service.

    Returns:
        Complete product attributes fixture.
    """
    return fixtures.load_products_attributes()
