"""Ozon coverage tests: offline schema parsing, cache, and endpoint (no network)."""

import re
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest
from fastapi import FastAPI, status
from httpx import ASGITransport, AsyncClient

from backend.schemas.ozon_coverage import OzonCoverage, OzonCoverageMethod
from backend.services.ozon_schema import (
    CACHE_TTL_SECONDS,
    SCHEMA_URL,
    OzonSchemaService,
)

ISO_MS_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")

FETCHED_AT = datetime(2026, 9, 28, 12, 0, 0, tzinfo=UTC)

# Two tag groups: the first one has no operations and must be dropped;
# /v1/analytics/stocks has no summary and must fall back to its operationId.
SMALL_DOCUMENT: dict[str, Any] = {
    "x-tagGroups": [
        {"name": "Общее описание", "tags": ["Introduction"]},
        {
            "name": "Базовые методы",
            "tags": ["ProductAPI", "SellerInfo", "APIkey", "AnalyticsAPI"],
        },
    ],
    "paths": {
        "/v1/seller/info": {
            "post": {
                "operationId": "SellerAPI_SellerInfo",
                "summary": "Информация о кабинете продавца",
                "tags": ["SellerInfo"],
            }
        },
        "/v1/roles": {
            "post": {
                "operationId": "AccessAPI_RolesByToken",
                "summary": "Роли по API-ключу",
                "tags": ["APIkey"],
            }
        },
        "/v3/product/list": {
            "post": {
                "operationId": "ProductAPI_GetProductList",
                "summary": "Список товаров",
                "tags": ["ProductAPI"],
            }
        },
        "/v4/product/info/attributes": {
            "post": {
                "operationId": "ProductAPI_GetProductAttributesV4",
                "summary": "Характеристики товара",
                "tags": ["ProductAPI"],
            }
        },
        "/v1/analytics/stocks": {
            "get": {
                "operationId": "AnalyticsAPI_GetStocks",
                "tags": ["AnalyticsAPI"],
            }
        },
    },
}

APP_IMPLEMENTED = frozenset(
    {
        ("/v1/seller/info", "POST"),
        ("/v1/roles", "POST"),
        ("/v3/product/list", "POST"),
        ("/v4/product/info/attributes", "POST"),
    }
)


@pytest.fixture(autouse=True)
def _fresh_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    """Start every test from an empty schema cache."""
    monkeypatch.setattr(OzonSchemaService, "_cache", None)


def _stub_fetch(
    monkeypatch: pytest.MonkeyPatch,
    *,
    error: Exception | None = None,
) -> list[tuple[datetime, dict[str, Any]]]:
    """Replace the network fetch with an offline stub that counts calls.

    Args:
        monkeypatch: Pytest monkeypatch fixture.
        error: When set, the stub raises it instead of answering.

    Returns:
        Mutable list recording every (fetched_at, document) answer.
    """
    answers: list[tuple[datetime, dict[str, Any]]] = []

    async def fake_fetch() -> tuple[datetime, dict[str, Any]]:
        if error is not None:
            raise error
        answer = (FETCHED_AT, SMALL_DOCUMENT)
        answers.append(answer)
        return answer

    monkeypatch.setattr(OzonSchemaService, "_fetch", fake_fetch)
    return answers


def _flatten(coverage: OzonCoverage) -> dict[str, OzonCoverageMethod]:
    """Flatten the coverage tree into a path -> method mapping.

    Args:
        coverage: Coverage DTO built by the service.

    Returns:
        Mapping of operation path to its method entry.
    """
    return {
        method.path: method
        for group in coverage.groups
        for tag in group.tags
        for method in tag.methods
    }


async def test_coverage_groups_methods_in_group_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Methods follow x-tagGroups order; groups without methods vanish."""
    _stub_fetch(monkeypatch)

    coverage = await OzonSchemaService.get_coverage(frozenset())

    assert coverage.total == 5
    assert coverage.implemented_total == 0
    assert [group.name for group in coverage.groups] == ["Базовые методы"]
    group = coverage.groups[0]
    assert group.total == 5
    assert [tag.name for tag in group.tags] == [
        "ProductAPI",
        "SellerInfo",
        "APIkey",
        "AnalyticsAPI",
    ]
    product_api = group.tags[0]
    assert [method.path for method in product_api.methods] == [
        "/v3/product/list",
        "/v4/product/info/attributes",
    ]


async def test_coverage_flags_only_matching_path_and_method(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A (path, method) pair marks exactly that operation implemented."""
    _stub_fetch(monkeypatch)

    coverage = await OzonSchemaService.get_coverage(APP_IMPLEMENTED)

    flags = {path: method.implemented for path, method in _flatten(coverage).items()}
    assert flags == {
        "/v1/seller/info": True,
        "/v1/roles": True,
        "/v3/product/list": True,
        "/v4/product/info/attributes": True,
        "/v1/analytics/stocks": False,
    }
    assert coverage.implemented_total == 4
    assert coverage.groups[0].implemented_total == 4

    wrong_method = await OzonSchemaService.get_coverage(
        frozenset({("/v1/seller/info", "GET")})
    )
    assert wrong_method.implemented_total == 0


async def test_coverage_title_falls_back_to_operation_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Title keeps the summary when present, else uses the operationId."""
    _stub_fetch(monkeypatch)

    coverage = await OzonSchemaService.get_coverage(frozenset())
    by_path = _flatten(coverage)

    assert by_path["/v1/seller/info"].title == "Информация о кабинете продавца"
    assert by_path["/v1/analytics/stocks"].title == "AnalyticsAPI_GetStocks"
    assert by_path["/v1/analytics/stocks"].method == "GET"
    assert by_path["/v1/roles"].doc_url == (
        "https://docs.ozon.ru/api/seller/?__rr=1#operation/AccessAPI_RolesByToken"
    )


async def test_schema_cache_reuses_payload_within_window(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Two calls inside the TTL share one fetch and one fetched_at stamp."""
    clock = [0.0]
    monkeypatch.setattr(OzonSchemaService, "_clock", lambda: clock[0])
    answers = _stub_fetch(monkeypatch)

    first = await OzonSchemaService.get_coverage(frozenset())
    clock[0] = CACHE_TTL_SECONDS - 1.0
    second = await OzonSchemaService.get_coverage(frozenset())

    assert len(answers) == 1
    assert first.source.fetched_at == second.source.fetched_at
    assert first.source.fetched_at == FETCHED_AT


async def test_schema_cache_refetches_after_window(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A call after the TTL window performs a second fetch."""
    clock = [0.0]
    monkeypatch.setattr(OzonSchemaService, "_clock", lambda: clock[0])
    answers = _stub_fetch(monkeypatch)

    await OzonSchemaService.get_coverage(frozenset())
    clock[0] = CACHE_TTL_SECONDS + 1.0
    await OzonSchemaService.get_coverage(frozenset())

    assert len(answers) == 2


async def test_ozon_coverage_endpoint_returns_tree(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """GET /api/ozon-coverage answers 200 with the coverage tree."""
    _stub_fetch(monkeypatch)

    response = await client.get("/api/ozon-coverage")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert set(body) == {"total", "implemented_total", "source", "groups"}
    assert body["total"] == 5
    assert body["implemented_total"] == 4
    assert body["source"]["url"] == SCHEMA_URL
    assert ISO_MS_Z.match(body["source"]["fetched_at"])
    assert [group["name"] for group in body["groups"]] == ["Базовые методы"]
    methods = [method for tag in body["groups"][0]["tags"] for method in tag["methods"]]
    assert set(methods[0]) == {
        "path",
        "method",
        "operation_id",
        "title",
        "doc_url",
        "implemented",
    }
    implemented_paths = {method["path"] for method in methods if method["implemented"]}
    assert implemented_paths == {path for path, _ in APP_IMPLEMENTED}


async def test_ozon_coverage_endpoint_maps_fetch_failure_to_500(
    fastapi_app: FastAPI, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A mirror failure surfaces as 500/13 through the global handler."""
    request = httpx.Request("GET", SCHEMA_URL)
    _stub_fetch(monkeypatch, error=httpx.ConnectError("mirror down", request=request))
    # Starlette re-raises the exception after sending the 500, so the
    # transport must swallow it for the answer to be observable at all.
    transport = ASGITransport(fastapi_app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as bad_client:
        response = await bad_client.get("/api/ozon-coverage")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {
        "code": 13,
        "message": "Internal Server Error",
        "details": [],
    }
