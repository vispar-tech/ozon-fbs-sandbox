"""Static OpenAPI structure tests for the seller contour (no DB, no HTTP)."""

from typing import Any

from backend.web.application import get_app

HTTP_METHODS = frozenset(
    {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
)


def _seller_operations() -> list[dict[str, Any]]:
    """Build the OpenAPI document offline and keep the seller operations.

    Path Item objects may carry non-operation keys (``parameters``,
    ``servers``, ``summary``), so only real HTTP methods are collected.
    """
    schema = get_app().openapi()
    operations: list[dict[str, Any]] = []
    for path, item in schema["paths"].items():
        if path.startswith(("/v1/", "/v3/", "/v4/")):
            operations.extend(
                value for method, value in item.items() if method in HTTP_METHODS
            )
    return operations


def test_openapi_declares_distinct_seller_security_schemes() -> None:
    """OpenAPI exposes Client-Id/Api-Key as two distinct apiKey schemes.

    The distinct scheme keys guard against dropping ``scheme_name``:
    unnamed APIKeyHeader instances both fall back to "APIKeyHeader",
    OpenAPI dedupes them into one scheme, and Swagger UI would never
    send Api-Key.
    """
    schema = get_app().openapi()
    schemes = schema["components"]["securitySchemes"]
    assert schemes["ClientIdHeader"] == {
        "type": "apiKey",
        "in": "header",
        "name": "Client-Id",
    }
    assert schemes["ApiKeyHeader"] == {
        "type": "apiKey",
        "in": "header",
        "name": "Api-Key",
    }


def test_seller_operations_use_security_not_header_params() -> None:
    """Seller operations carry the schemes instead of header parameters."""
    operations = _seller_operations()
    assert operations
    for operation in operations:
        names = {name for req in operation["security"] for name in req}
        assert names == {"ClientIdHeader", "ApiKeyHeader"}
        parameters = operation.get("parameters") or []
        header_params = [param for param in parameters if param.get("in") == "header"]
        assert header_params == []
