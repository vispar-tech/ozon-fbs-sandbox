"""Integration tests for ordinary admin and seller flows."""

import re
import uuid

from fastapi import status
from httpx import AsyncClient

from tests.conftest import CT_JSON, _auth, _create

ISO_MS_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")


async def test_create_returns_every_summary_field(client: AsyncClient) -> None:
    """Create response carries the full summary field set with valid values.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="full fields")
    assert set(created) == {
        "client_id",
        "name",
        "api_key",
        "created_at",
        "updated_at",
        "seller_info",
        "roles",
    }
    assert uuid.UUID(created["api_key"])
    assert ISO_MS_Z.match(created["created_at"])
    assert ISO_MS_Z.match(created["updated_at"])
    assert set(created["seller_info"]) == {
        "company",
        "ratings",
        "subscription",
    }
    assert set(created["roles"]) == {"expires_at", "roles"}
    assert created["roles"]["expires_at"] == ""
    assert created["roles"]["roles"] == []


async def test_create_generates_unique_api_keys(client: AsyncClient) -> None:
    """Each created cabinet gets its own api key.

    Args:
        client: client for the app.
    """
    first = await _create(client, name="first key")
    second = await _create(client, name="second key")
    assert first["api_key"] != second["api_key"]
    assert first["client_id"] != second["client_id"]


async def test_create_empty_name_is_rejected(client: AsyncClient) -> None:
    """Empty name fails validation with 400/3.

    Args:
        client: client for the app.
    """
    response = await client.post("/api/cabinets", json={"name": ""})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_create_missing_name_is_rejected(client: AsyncClient) -> None:
    """Body without a name field fails with 400/3.

    Args:
        client: client for the app.
    """
    response = await client.post("/api/cabinets", json={})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_list_returns_created_cabinets(client: AsyncClient) -> None:
    """List returns created cabinets ordered by id.

    Args:
        client: client for the app.
    """
    first = await _create(client, name="list one")
    second = await _create(client, name="list two")

    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert [item["client_id"] for item in body] == [
        first["client_id"],
        second["client_id"],
    ]


async def test_update_blank_name_is_rejected(client: AsyncClient) -> None:
    """PATCH with a whitespace name fails with 400/3 and keeps the old name.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="keep me")
    client_id = created["client_id"]
    response = await client.patch(f"/api/cabinets/{client_id}", json={"name": "   "})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }

    response = await client.get(f"/api/cabinets/{client_id}")
    assert response.json()["name"] == "keep me"


async def test_patch_missing_cabinet_with_body_returns_404(
    client: AsyncClient,
) -> None:
    """PATCH with a valid body on an unknown id still answers 404/5.

    Args:
        client: client for the app.
    """
    response = await client.patch("/api/cabinets/999", json={"name": "x"})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}


async def test_invalid_path_param_on_writes_returns_400(
    client: AsyncClient,
) -> None:
    """Non-integer client_id on PATCH/DELETE answers 400/3.

    Args:
        client: client for the app.
    """
    expected = {"code": 3, "message": "Invalid request body", "details": []}
    response = await client.patch("/api/cabinets/abc", json={"name": "x"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == expected

    response = await client.delete("/api/cabinets/abc")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == expected


async def test_delete_removes_cabinet_from_list(client: AsyncClient) -> None:
    """After DELETE the cabinet disappears from the list.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="gone soon")
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


async def test_missing_single_header_returns_401(client: AsyncClient) -> None:
    """Absent Client-Id or Api-Key alone answers 401/16.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="partial auth")
    expected = {
        "code": 16,
        "message": "Client-Id and Api-Key headers are required",
        "details": [],
    }

    only_client = {"Client-Id": str(created["client_id"]), **CT_JSON}
    response = await client.post("/v1/seller/info", json={}, headers=only_client)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == expected

    only_key = {"Api-Key": created["api_key"], **CT_JSON}
    response = await client.post("/v1/seller/info", json={}, headers=only_key)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == expected


async def test_seller_info_reflects_admin_update(client: AsyncClient) -> None:
    """Seller contour serves seller_info written through the admin PATCH.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="cross contour")
    client_id = created["client_id"]
    new_info = {
        "company": {
            "name": "ООО Кросс",
            "legal_name": "Общество Кросс",
            "inn": "770000000001",
            "ogrn": "300000000000001",
            "country": "RU",
            "currency": "RUB",
            "ownership_form": "ООО",
            "tax_system": "USN",
        },
        "ratings": [],
        "subscription": {"is_premium": True, "type": "PREMIUM"},
    }
    response = await client.patch(
        f"/api/cabinets/{client_id}", json={"seller_info": new_info}
    )
    assert response.status_code == status.HTTP_200_OK

    response = await client.post("/v1/seller/info", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == new_info


async def test_deleted_cabinet_seller_auth_fails(client: AsyncClient) -> None:
    """Old credentials stop working after the cabinet is deleted.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="revoked")
    headers = _auth(created)
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.post("/v1/seller/info", json={}, headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "code": 5,
        "message": "Invalid Api-Key, please check the key and try again",
        "details": [],
    }
