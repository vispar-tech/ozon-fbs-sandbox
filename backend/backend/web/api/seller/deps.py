"""Authentication dependency for seller routes."""

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import APIKeyHeader as ApiKeyHeaderScheme

from backend.db.models.cabinet import Cabinet
from backend.db.repositories.cabinets import CabinetRepository
from backend.web.api.deps import get_cabinet_repo
from backend.web.errors import (
    INVALID_CLIENT_ID_ERROR,
    INVALID_CONTENT_TYPE_ERROR,
    INVALID_KEY_ERROR,
    MISSING_HEADERS_ERROR,
    OzonHttpError,
)

HEADER_CLIENT_ID = "Client-Id"
HEADER_API_KEY = "Api-Key"
HEADER_CONTENT_TYPE = "Content-Type"

_client_id_scheme = ApiKeyHeaderScheme(
    name=HEADER_CLIENT_ID,
    scheme_name="ClientIdHeader",
    auto_error=False,
)
_api_key_scheme = ApiKeyHeaderScheme(
    name=HEADER_API_KEY,
    scheme_name="ApiKeyHeader",
    auto_error=False,
)

ClientIdHeader = Annotated[str | None, Depends(_client_id_scheme)]
ApiKeyHeader = Annotated[str | None, Depends(_api_key_scheme)]
CabinetRepoDep = Annotated[CabinetRepository, Depends(get_cabinet_repo)]


async def seller_auth(
    request: Request,
    repo: CabinetRepoDep,
    client_id: ClientIdHeader = None,
    api_key: ApiKeyHeader = None,
) -> Cabinet:
    """Authenticate a seller request in the Ozon four-step order.

    1. missing Client-Id/Api-Key headers -> 401/16;
    2. non-JSON Content-Type -> 400/4;
    3. invalid Client-Id value -> 400/3;
    4. unknown client, wrong key or expired roles -> 404/5.

    Args:
        request: Current request (Content-Type header source).
        repo: Cabinet repository.
        client_id: Client-Id header value.
        api_key: Api-Key header value.

    Returns:
        Authenticated cabinet.

    Raises:
        OzonHttpError: When any authentication step fails.
    """
    if client_id is None or api_key is None:
        raise OzonHttpError(401, MISSING_HEADERS_ERROR)
    if request.headers.get(HEADER_CONTENT_TYPE) != "application/json":
        raise OzonHttpError(400, INVALID_CONTENT_TYPE_ERROR)
    try:
        parsed = int(client_id)
        if parsed <= 0:
            raise ValueError
    except ValueError:
        raise OzonHttpError(400, INVALID_CLIENT_ID_ERROR) from None
    cabinet = await repo.get_by_id(parsed)
    if cabinet is None or str(cabinet.api_key) != api_key or cabinet.is_expired():
        raise OzonHttpError(404, INVALID_KEY_ERROR)
    return cabinet
