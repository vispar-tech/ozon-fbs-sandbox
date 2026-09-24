"""Seller contour tests (``/v1/*``, Ozon auth contract)."""

from fastapi import status
from httpx import AsyncClient

from tests.conftest import CT_JSON, _auth, _create


async def test_missing_headers_returns_401(client: AsyncClient) -> None:
    """Missing Client-Id/Api-Key answers 401/16.

    Args:
        client: client for the app.
    """
    response = await client.post("/v1/seller/info")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {
        "code": 16,
        "message": "Client-Id and Api-Key headers are required",
        "details": [],
    }


async def test_invalid_content_type_returns_400(client: AsyncClient) -> None:
    """Non-JSON Content-Type answers 400/4 (charset included).

    Args:
        client: client for the app.
    """
    headers = {"Client-Id": "1", "Api-Key": "x", "content-type": "text/plain"}
    response = await client.post("/v1/seller/info", content="{}", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 4,
        "message": "Content-Type header should be application/json",
        "details": [],
    }


async def test_charset_content_type_is_strict(client: AsyncClient) -> None:
    """Content-Type with charset suffix is rejected (blueprint strict check).

    Args:
        client: client for the app.
    """
    headers = {
        "Client-Id": "1",
        "Api-Key": "x",
        "content-type": "application/json; charset=utf-8",
    }
    response = await client.post("/v1/seller/info", content="{}", headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["code"] == 4


async def test_invalid_client_id_returns_400(client: AsyncClient) -> None:
    """Non-integer or non-positive Client-Id answers 400/3.

    Args:
        client: client for the app.
    """
    for value in ("abc", "0", "-5"):
        headers = {"Client-Id": value, "Api-Key": "x", **CT_JSON}
        response = await client.post("/v1/roles", json={}, headers=headers)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json() == {
            "code": 3,
            "message": "Client-Id header value should be positive integer",
            "details": [],
        }


async def test_unknown_key_returns_404(client: AsyncClient) -> None:
    """Unknown client or wrong Api-Key answers 404/5.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="auth me")

    headers = {"Client-Id": "999999", "Api-Key": created["api_key"], **CT_JSON}
    response = await client.post("/v1/roles", json={}, headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "code": 5,
        "message": "Invalid Api-Key, please check the key and try again",
        "details": [],
    }

    headers = {**_auth(created), "Api-Key": "wrong-key"}
    response = await client.post("/v1/roles", json={}, headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["code"] == 5


async def test_expired_roles_return_404(client: AsyncClient) -> None:
    """Expired roles answer 404/5 like a wrong key.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="expired")
    client_id = created["client_id"]
    response = await client.patch(
        f"/api/cabinets/{client_id}",
        json={"roles": {"expires_at": "2020-01-01T00:00:00.000Z", "roles": []}},
    )
    assert response.status_code == status.HTTP_200_OK

    response = await client.post("/v1/roles", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["code"] == 5


async def test_seller_info_returns_empty_fixture(client: AsyncClient) -> None:
    """Authenticated POST /v1/seller/info returns the empty fixture set.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="empty seller")
    response = await client.post("/v1/seller/info", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "company": {
            "name": "",
            "legal_name": "",
            "inn": "",
            "ogrn": "",
            "country": "",
            "currency": "RUB",
            "ownership_form": "",
            "tax_system": "UNSPECIFIED",
        },
        "ratings": [],
        "subscription": {"is_premium": False, "type": "UNSPECIFIED"},
    }


async def test_roles_returns_empty_roles(client: AsyncClient) -> None:
    """Authenticated POST /v1/roles returns the TS empty state.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="empty roles")
    response = await client.post("/v1/roles", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"expires_at": "", "roles": []}


async def test_demo_cabinet_serves_romashka(client: AsyncClient) -> None:
    """Demo cabinet serves romashka data through the seller contour.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="demo seller", demo=True)

    response = await client.post("/v1/seller/info", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    info = response.json()
    assert info["company"]["name"] == "ООО 'Ромашка'"
    assert info["ratings"][0]["current_value"]["date_from"] == (
        "2023-01-15T09:00:00.000Z"
    )
    assert info["ratings"][0]["current_value"]["value"] == 85

    response = await client.post("/v1/roles", json={}, headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    roles = response.json()
    assert roles["expires_at"] == "2027-09-23T07:10:19.422Z"
    assert len(roles["roles"][0]["methods"]) == 467


async def test_broken_body_is_ignored(client: AsyncClient) -> None:
    """Broken body with a valid Content-Type still answers 200.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="broken body")
    response = await client.post("/v1/roles", content="{broken", headers=_auth(created))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"expires_at": "", "roles": []}
