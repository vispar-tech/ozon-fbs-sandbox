"""Product card tests (``/v3/product/list``, ``/v4/product/info/attributes``)."""

import json

from fastapi import status
from httpx import AsyncClient

from backend.schemas.products import ProductComplexAttributeValue
from backend.services.fixtures import FIXTURES_DIR, FixtureService
from tests.conftest import _auth, _create

V3_LIST = "v3-product-list.json"
V4_ATTRIBUTES = "v4-product-info-attributes.json"
FIXTURES = FixtureService(FIXTURES_DIR)


def test_fixture_files_round_trip_through_dto() -> None:
    """DTO dumps reproduce the raw fixture files exactly (nothing dropped).

    This is the only test allowed to read the fixture JSON files directly: no
    field is silently dropped or renamed by the schemas.
    """
    dumps = {
        V3_LIST: FIXTURES.load_products_list().model_dump(mode="json", by_alias=True),
        V4_ATTRIBUTES: FIXTURES.load_products_attributes().model_dump(
            mode="json", by_alias=True
        ),
    }
    for name, dump in dumps.items():
        raw = json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))
        assert dump == raw


async def test_list_endpoint_returns_fixture(client: AsyncClient) -> None:
    """POST /v3/product/list returns the fixture; v3 ``sku`` stays int.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="product list")
    response = await client.post("/v3/product/list", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body == FIXTURES.load_products_list().model_dump(mode="json", by_alias=True)
    assert isinstance(body["result"]["items"][0]["sku"], int)


async def test_attributes_endpoint_returns_fixture(client: AsyncClient) -> None:
    """POST /v4/product/info/attributes returns the fixture; sku and total str.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="product attributes")
    response = await client.post(
        "/v4/product/info/attributes", json={}, headers=_auth(created)
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body == FIXTURES.load_products_attributes().model_dump(
        mode="json", by_alias=True
    )
    assert isinstance(body["result"][0]["sku"], str)
    assert body["total"] == "10"


async def test_endpoints_require_seller_auth(client: AsyncClient) -> None:
    """Product endpoints answer 401/16 without the seller headers.

    Args:
        client: client for the app.
    """
    for path in ("/v3/product/list", "/v4/product/info/attributes"):
        response = await client.post(path, json={})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["code"] == 16


async def test_filters_and_sorting_are_ignored(client: AsyncClient) -> None:
    """Filter, pagination and sorting payloads are accepted, not applied.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="filtered")
    headers = _auth(created)

    v3_payload = {
        "filter": {"visibility": "ALL", "offer_id": ["demo-dress-yuka"]},
        "last_id": "",
        "limit": 1,
    }
    response = await client.post("/v3/product/list", json=v3_payload, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == FIXTURES.load_products_list().model_dump(
        mode="json", by_alias=True
    )

    v4_payload = {
        "filter": {"visibility": "VISIBLE", "sku": ["12345678901"]},
        "last_id": "",
        "limit": 1,
        "sort_by": "sku",
        "sort_dir": "asc",
    }
    response = await client.post(
        "/v4/product/info/attributes", json=v4_payload, headers=headers
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == FIXTURES.load_products_attributes().model_dump(
        mode="json", by_alias=True
    )


async def test_records_stay_synchronized_between_contours(
    client: AsyncClient,
) -> None:
    """Both contours expose the same ten products, ids and last_id aligned.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="synced products")
    headers = _auth(created)

    v3 = await client.post("/v3/product/list", json={}, headers=headers)
    assert v3.status_code == status.HTTP_200_OK
    page = v3.json()["result"]

    v4 = await client.post("/v4/product/info/attributes", json={}, headers=headers)
    assert v4.status_code == status.HTTP_200_OK
    attributes = v4.json()

    items, cards = page["items"], attributes["result"]
    assert len(items) == 10 == len(cards)
    for v3_item, v4_item in zip(items, cards, strict=True):
        assert v3_item["product_id"] == v4_item["id"]
        assert str(v3_item["sku"]) == v4_item["sku"]
        assert v3_item["offer_id"] == v4_item["offer_id"]

    assert len({item["product_id"] for item in items}) == 10
    assert len({item["offer_id"] for item in items}) == 10
    assert page["last_id"] == str(items[-1]["sku"])
    assert attributes["last_id"] == cards[-1]["sku"]
    assert page["total"] == page["total_items"] == 10
    assert attributes["total"] == "10"


def test_complex_value_serializes_camel_case() -> None:
    """A complex value round-trips through the schema key ``dictionaryValueId``."""
    parsed = ProductComplexAttributeValue.model_validate(
        {"dictionaryValueId": 7, "value": "x"}
    )
    assert parsed.dictionary_value_id == 7
    assert parsed.value == "x"
    assert parsed.model_dump(by_alias=True) == {"dictionaryValueId": 7, "value": "x"}
