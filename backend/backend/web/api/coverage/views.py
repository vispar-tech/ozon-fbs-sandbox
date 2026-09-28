"""Ozon Seller API coverage report (mounted under ``/api``)."""

import re

from fastapi import APIRouter, Request

from backend.schemas.ozon_coverage import OzonCoverage
from backend.services.ozon_schema import OzonSchemaService
from backend.web.enums import RouterTag
from backend.web.errors import ADMIN_ERROR_RESPONSES

SELLER_PATH = re.compile(r"^/v\d+/")
CONTOUR_METHODS = frozenset({"GET", "POST"})

router = APIRouter(prefix="/ozon-coverage", tags=[RouterTag.OZON_COVERAGE])


def _implemented_methods(request: Request) -> frozenset[tuple[str, str]]:
    """Collect (path, method) pairs of the Ozon-shaped seller routes.

    Reads the OpenAPI document the app itself serves at
    ``/api/openapi.json``: it is public, it is the same document
    ``tests/test_openapi.py`` reads seller operations from, and
    ``_custom_openapi`` caches it on ``app.openapi_schema``, so the
    read is O(1) after the first call.

    Args:
        request: Current request, source of the mounted application.

    Returns:
        Frozen set of implemented (path, METHOD) pairs.
    """
    pairs: set[tuple[str, str]] = set()
    for path, path_item in request.app.openapi()["paths"].items():
        if not SELLER_PATH.match(path):
            continue
        # A path item may carry non-operation keys (parameters, $ref,
        # summary, servers), so only the explicit operation names count.
        for method in CONTOUR_METHODS:
            if method.lower() in path_item:
                pairs.add((path, method))
    return frozenset(pairs)


@router.get("", response_model=OzonCoverage, responses=ADMIN_ERROR_RESPONSES)
async def get_ozon_coverage(request: Request) -> OzonCoverage:
    """Report which Ozon Seller API methods the sandbox implements.

    Args:
        request: Current request, source of the mounted seller routes.

    Returns:
        Coverage tree over the Ozon schema mirror.
    """
    return await OzonSchemaService.get_coverage(_implemented_methods(request))
