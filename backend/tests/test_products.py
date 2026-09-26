"""Product card tests (``/v3/product/list``, ``/v4/product/info/attributes``)."""

import json

from fastapi import status
from httpx import AsyncClient

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
    """Each v3 item matches exactly one v4 card by id, sku and offer_id.

    Args:
        client: client for the app.
    """
    headers = _auth(await _create(client, name="synced products"))
    v3 = await client.post("/v3/product/list", json={}, headers=headers)
    v4 = await client.post("/v4/product/info/attributes", json={}, headers=headers)
    items, cards = v3.json()["result"]["items"], v4.json()["result"]
    assert len(items) == len(cards)
    v3_keys = {(i["product_id"], str(i["sku"]), i["offer_id"]) for i in items}
    v4_keys = {(c["id"], c["sku"], c["offer_id"]) for c in cards}
    assert v3_keys == v4_keys


async def test_filter_visibility_must_match_schema_enum(client: AsyncClient) -> None:
    """A non-enum ``visibility`` filter answers 400/3 on both product routes.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="bad visibility")
    payload = {"filter": {"visibility": "BOGUS"}}
    expected = {"code": 3, "message": "Invalid request body", "details": []}
    for path in ("/v3/product/list", "/v4/product/info/attributes"):
        response = await client.post(path, json=payload, headers=_auth(created))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json() == expected
