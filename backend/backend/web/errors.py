"""Unified Ozon error contract: schema, constants, and global handlers."""

import json
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.log import logger
from backend.services.cabinets import CabinetNotFoundError


class PrettyJSONResponse(JSONResponse):
    """JSON response rendered as pretty-printed UTF-8 JSON."""

    def render(self, content: Any) -> bytes:
        """
        Render the response body.

        Args:
            content: serializable response content.

        Returns:
            JSON bytes (ensure_ascii=False, indent=2, no NaN).
        """
        return json.dumps(
            content,
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        ).encode("utf-8")


class OzonError(BaseModel):
    """Ozon error body (parity with googlerpcStatus)."""

    code: int
    message: str
    details: list[Any] = Field(default_factory=list)


class OzonHttpError(Exception):
    """HTTP error carrying an OzonError body (status_code + error)."""

    def __init__(self, status_code: int, error: OzonError) -> None:
        """
        Initialize the error.

        Args:
            status_code: HTTP status code of the response.
            error: Ozon error body.
        """
        super().__init__(error.message)
        self.status_code = status_code
        self.error = error


# error constants (parity with ozon-errors.ts)
MISSING_HEADERS_ERROR = OzonError(
    code=16, message="Client-Id and Api-Key headers are required"
)
INVALID_CLIENT_ID_ERROR = OzonError(
    code=3, message="Client-Id header value should be positive integer"
)
INVALID_CONTENT_TYPE_ERROR = OzonError(
    code=4, message="Content-Type header should be application/json"
)
INVALID_KEY_ERROR = OzonError(
    code=5, message="Invalid Api-Key, please check the key and try again"
)
INVALID_REQUEST_BODY_ERROR = OzonError(code=3, message="Invalid request body")
NOT_FOUND_ERROR = OzonError(code=5, message="Not Found")
CONFLICT_ERROR = OzonError(code=6, message="Conflict")
INTERNAL_ERROR = OzonError(code=13, message="Internal Server Error")
# admin requireJson middleware uses code 3 with the Content-Type message
INVALID_JSON_CONTENT_TYPE_ERROR = OzonError(
    code=3, message="Content-Type header should be application/json"
)

# HTTP statuses (parity with ozon-errors.ts)
OZON_STATUS_OK = 200
OZON_STATUS_CREATED = 201
OZON_STATUS_NO_CONTENT = 204
OZON_STATUS_BAD_REQUEST = 400
OZON_STATUS_UNAUTHORIZED = 401
OZON_STATUS_NOT_FOUND = 404
OZON_STATUS_METHOD_NOT_ALLOWED = 405
OZON_STATUS_CONFLICT = 409
OZON_STATUS_INTERNAL_SERVER_ERROR = 500


def _error_response(status_code: int, error: OzonError) -> dict[str, Any]:
    """Build an OpenAPI response entry for an Ozon error.

    Args:
        status_code: HTTP status code of the response.
        error: representative Ozon error body.

    Returns:
        OpenAPI response entry with the OzonError model.
    """
    return {
        "model": OzonError,
        "description": f"code {error.code}: {error.message}",
    }


# OpenAPI error responses per contour (declared on routes via `responses=`)
ADMIN_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    OZON_STATUS_BAD_REQUEST: _error_response(
        OZON_STATUS_BAD_REQUEST, INVALID_REQUEST_BODY_ERROR
    ),
    OZON_STATUS_NOT_FOUND: _error_response(OZON_STATUS_NOT_FOUND, NOT_FOUND_ERROR),
    OZON_STATUS_INTERNAL_SERVER_ERROR: _error_response(
        OZON_STATUS_INTERNAL_SERVER_ERROR, INTERNAL_ERROR
    ),
}
SELLER_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    OZON_STATUS_BAD_REQUEST: _error_response(
        OZON_STATUS_BAD_REQUEST, INVALID_CLIENT_ID_ERROR
    ),
    OZON_STATUS_UNAUTHORIZED: _error_response(
        OZON_STATUS_UNAUTHORIZED, MISSING_HEADERS_ERROR
    ),
    OZON_STATUS_NOT_FOUND: _error_response(OZON_STATUS_NOT_FOUND, INVALID_KEY_ERROR),
    OZON_STATUS_INTERNAL_SERVER_ERROR: _error_response(
        OZON_STATUS_INTERNAL_SERVER_ERROR, INTERNAL_ERROR
    ),
}


def _map_http_error(status_code: int) -> tuple[OzonError, int]:
    """Map an HTTPException status to an Ozon error body.

    405 is reported as 404/5 (parity with the legacy notFound handler).

    Args:
        status_code: original HTTP status code.

    Returns:
        Pair of Ozon error and response status code.
    """
    if status_code == OZON_STATUS_BAD_REQUEST:
        return INVALID_REQUEST_BODY_ERROR, OZON_STATUS_BAD_REQUEST
    if status_code == OZON_STATUS_UNAUTHORIZED:
        return MISSING_HEADERS_ERROR, OZON_STATUS_UNAUTHORIZED
    if status_code == OZON_STATUS_NOT_FOUND:
        return NOT_FOUND_ERROR, OZON_STATUS_NOT_FOUND
    if status_code == OZON_STATUS_METHOD_NOT_ALLOWED:
        return NOT_FOUND_ERROR, OZON_STATUS_NOT_FOUND
    if status_code == OZON_STATUS_CONFLICT:
        return CONFLICT_ERROR, OZON_STATUS_CONFLICT
    return INTERNAL_ERROR, status_code


async def _ozon_http_error_handler(request: Request, exc: OzonHttpError) -> Response:
    """Render OzonHttpError as its OzonError body.

    Args:
        request: current request.
        exc: raised error.

    Returns:
        JSON response with the original status code.
    """
    return PrettyJSONResponse(
        status_code=exc.status_code, content=exc.error.model_dump()
    )


async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> Response:
    """Render body/path validation failures as 400/3.

    Args:
        request: current request.
        exc: validation error.

    Returns:
        JSON response with the invalid request body error.
    """
    return PrettyJSONResponse(
        status_code=OZON_STATUS_BAD_REQUEST,
        content=INVALID_REQUEST_BODY_ERROR.model_dump(),
    )


async def _cabinet_not_found_handler(
    request: Request, exc: CabinetNotFoundError
) -> Response:
    """Render a missing cabinet as 404/5.

    Args:
        request: current request.
        exc: raised error.

    Returns:
        JSON response with the not found error.
    """
    return PrettyJSONResponse(
        status_code=OZON_STATUS_NOT_FOUND, content=NOT_FOUND_ERROR.model_dump()
    )


async def _http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> Response:
    """Render HTTPException with the Ozon status/error mapping.

    Args:
        request: current request.
        exc: raised HTTP exception.

    Returns:
        JSON response with the mapped Ozon error body.
    """
    error, status_code = _map_http_error(exc.status_code)
    return PrettyJSONResponse(status_code=status_code, content=error.model_dump())


async def _unhandled_exception_handler(request: Request, exc: Exception) -> Response:
    """Render unhandled exceptions as 500/13.

    Args:
        request: current request.
        exc: raised exception.

    Returns:
        JSON response with the internal error body.
    """
    logger.opt(exception=exc).error("Unhandled application exception")
    return PrettyJSONResponse(
        status_code=OZON_STATUS_INTERNAL_SERVER_ERROR,
        content=INTERNAL_ERROR.model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the application.

    Args:
        app: FastAPI application.
    """
    app.add_exception_handler(
        OzonHttpError,
        _ozon_http_error_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(
        RequestValidationError,
        _validation_error_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(
        CabinetNotFoundError,
        _cabinet_not_found_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(
        StarletteHTTPException,
        _http_exception_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(Exception, _unhandled_exception_handler)
