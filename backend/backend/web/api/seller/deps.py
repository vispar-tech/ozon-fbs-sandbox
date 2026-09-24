"""Authentication dependency for seller routes."""

from typing import Annotated

from fastapi import Depends, Header, Request

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

# defaults on the parameters (not inside Header) keep the headers optional
# so missing values reach the four-step auth (otherwise FastAPI answers
# 400/3 before the handler runs)
ClientIdHeader = Annotated[str | None, Header(alias=HEADER_CLIENT_ID)]
ApiKeyHeader = Annotated[str | None, Header(alias=HEADER_API_KEY)]
CabinetRepoDep = Annotated[CabinetRepository, Depends(get_cabinet_repo)]


async def seller_auth(
    request: Request,
    repo: CabinetRepoDep,
    client_id: ClientIdHeader = None,
    api_key: ApiKeyHeader = None,
) -> Cabinet:
    """
    Authenticate a seller request in the Ozon four-step order.

    1. missing Client-Id/Api-Key headers -> 401/16;
    2. non-JSON Content-Type -> 400/4;
    3. invalid Client-Id value -> 400/3;
    4. unknown client, wrong key or expired roles -> 404/5.

    Args:
        request: current request.
        repo: cabinet repository.
        client_id: Client-Id header value.
        api_key: Api-Key header value.

    Returns:
        Authenticated cabinet.

    Raises:
        OzonHttpError: when any authentication step fails.
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
