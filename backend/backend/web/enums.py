from enum import StrEnum


class RouterTag(StrEnum):
    """OpenAPI tags of the application's own routers."""

    SELLER = "Seller"
    PRODUCTS = "Products"
    CABINETS = "Cabinets"
    OZON_COVERAGE = "OzonCoverage"
