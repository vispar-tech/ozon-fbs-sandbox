"""Middleware for the admin contour."""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from backend.web.errors import (
    INVALID_JSON_CONTENT_TYPE_ERROR,
    OZON_STATUS_BAD_REQUEST,
    PrettyJSONResponse,
)

BODY_METHODS = frozenset({"POST", "PUT", "PATCH"})
ADMIN_CABINETS_PREFIX = "/api/cabinets"


def _is_json_content_type(header: str | None) -> bool:
    """Check that the Content-Type media type is JSON (charset tolerated).

    Args:
        header: raw Content-Type header value.

    Returns:
        True for ``application/json`` media type.
    """
    if header is None:
        return False
    media_type = header.split(";")[0]
    return media_type.strip().lower() == "application/json"


class RequireJsonMiddleware(BaseHTTPMiddleware):
    """Reject a non-JSON Content-Type on admin routes that carry a body.

    Runs before body parsing, so invalid Content-Type is answered with
    400/3 before FastAPI ever touches the payload.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Validate the Content-Type of admin write requests.

        Args:
            request: current request.
            call_next: next middleware in the chain.

        Returns:
            Error response or the downstream response.
        """
        if (
            request.method in BODY_METHODS
            and request.url.path.startswith(ADMIN_CABINETS_PREFIX)
            and not _is_json_content_type(request.headers.get("content-type"))
        ):
            return PrettyJSONResponse(
                status_code=OZON_STATUS_BAD_REQUEST,
                content=INVALID_JSON_CONTENT_TYPE_ERROR.model_dump(),
            )
        return await call_next(request)
