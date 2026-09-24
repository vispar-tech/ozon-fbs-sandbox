"""Admin contour tests (``/api/cabinets``)."""

import re

from fastapi import status
from httpx import AsyncClient

from tests.conftest import _create

ISO_MS_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")


async def test_list_empty(client: AsyncClient) -> None:
    """Empty store returns an empty list.

    Args:
        client: client for the app.
    """
    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


async def test_create_and_get_cabinet(client: AsyncClient) -> None:
    """Create returns 201 with the summary, get returns the same cabinet.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="first")
    assert ISO_MS_Z.match(created["created_at"])
    assert ISO_MS_Z.match(created["updated_at"])
    assert created["seller_info"]["company"]["name"] == ""
    assert created["seller_info"]["subscription"] == {
        "is_premium": False,
        "type": "UNSPECIFIED",
    }
    assert created["roles"] == {"expires_at": "", "roles": []}

    response = await client.get(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == created


async def test_response_is_pretty_json(client: AsyncClient) -> None:
    """Responses use pretty-printed JSON (indent=2).

    Args:
        client: client for the app.
    """
    created = await _create(client, name="pretty")
    response = await client.get(f"/api/cabinets/{created['client_id']}")
    assert response.text.startswith("{\n  ")
    assert response.headers["content-type"].startswith("application/json")


async def test_create_blank_name_is_rejected(client: AsyncClient) -> None:
    """Blank name fails validation with 400/3.

    Args:
        client: client for the app.
    """
    response = await client.post("/api/cabinets", json={"name": "   "})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_create_malformed_body_is_rejected(client: AsyncClient) -> None:
    """Malformed JSON body fails with 400/3, never 422.

    Args:
        client: client for the app.
    """
    response = await client.post(
        "/api/cabinets",
        content="{not json",
        headers={"content-type": "application/json"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_non_json_content_type_is_rejected(client: AsyncClient) -> None:
    """Admin write without JSON Content-Type fails with 400/3.

    Args:
        client: client for the app.
    """
    response = await client.post(
        "/api/cabinets",
        content='{"name": "x"}',
        headers={"content-type": "text/plain"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Content-Type header should be application/json",
        "details": [],
    }


async def test_create_demo_cabinet(client: AsyncClient) -> None:
    """Demo flag fills the cabinet from the romashka fixture set.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="demo", demo=True)
    info = created["seller_info"]
    assert info["company"]["name"] == "ООО 'Ромашка'"
    assert info["subscription"] == {"is_premium": True, "type": "PREMIUM"}
    assert len(info["ratings"]) == 3
    # byte-parity: whole numbers stay ints, dates normalize to iso-ms-Z
    assert info["ratings"][0]["current_value"]["value"] == 85
    assert info["ratings"][0]["current_value"]["date_from"] == (
        "2023-01-15T09:00:00.000Z"
    )
    roles = created["roles"]
    assert roles["expires_at"] == "2027-09-23T07:10:19.422Z"
    assert [role["name"] for role in roles["roles"]] == ["Admin"]
    assert len(roles["roles"][0]["methods"]) == 467


async def test_update_name(client: AsyncClient) -> None:
    """PATCH updates the name.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="before")
    response = await client.patch(
        f"/api/cabinets/{created['client_id']}", json={"name": "after"}
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["name"] == "after"


async def test_update_seller_info_and_roles(client: AsyncClient) -> None:
    """PATCH replaces typed seller_info and roles independently.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="patch me")
    client_id = created["client_id"]

    new_info = {
        "company": {
            "name": "ИП Тест",
            "legal_name": "Индивидуальный предприниматель Тест",
            "inn": "770000000000",
            "ogrn": "300000000000000",
            "country": "RU",
            "currency": "RUB",
            "ownership_form": "ИП",
            "tax_system": "USN",
        },
        "ratings": [],
        "subscription": {"is_premium": False, "type": "PREMIUM_LITE"},
    }
    response = await client.patch(
        f"/api/cabinets/{client_id}", json={"seller_info": new_info}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["seller_info"]["company"]["name"] == "ИП Тест"

    new_roles = {
        "expires_at": "2030-01-01T00:00:00.000Z",
        "roles": [{"name": "Admin", "methods": ["/v1/roles"]}],
    }
    response = await client.patch(
        f"/api/cabinets/{client_id}", json={"roles": new_roles}
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["roles"]["expires_at"] == "2030-01-01T00:00:00.000Z"
    assert body["roles"]["roles"][0]["methods"] == ["/v1/roles"]
    assert body["seller_info"]["company"]["name"] == "ИП Тест"


async def test_update_without_fields_is_rejected(client: AsyncClient) -> None:
    """Empty PATCH body fails with 400/3.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="empty patch")
    response = await client.patch(f"/api/cabinets/{created['client_id']}", json={})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_missing_cabinet_returns_404(client: AsyncClient) -> None:
    """Unknown client id answers 404/5 on get/patch/delete.

    Args:
        client: client for the app.
    """
    expected = {"code": 5, "message": "Not Found", "details": []}
    response = await client.get("/api/cabinets/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == expected

    response = await client.patch("/api/cabinets/999", json={})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == expected

    response = await client.delete("/api/cabinets/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == expected


async def test_invalid_path_param_returns_400(client: AsyncClient) -> None:
    """Non-integer or non-positive client_id answers 400/3.

    Args:
        client: client for the app.
    """
    expected = {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }
    for path in ("/api/cabinets/abc", "/api/cabinets/0"):
        response = await client.get(path)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json() == expected


async def test_delete_cabinet(client: AsyncClient) -> None:
    """DELETE answers 204 and removes the cabinet.

    Args:
        client: client for the app.
    """
    created = await _create(client, name="to delete")
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.get(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


async def test_unknown_route_returns_404(client: AsyncClient) -> None:
    """Unmatched routes answer 404/5.

    Args:
        client: client for the app.
    """
    response = await client.get("/api/nope")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}


async def test_method_not_allowed_returns_404(client: AsyncClient) -> None:
    """405 is reported as 404/5 (legacy notFound parity).

    Args:
        client: client for the app.
    """
    response = await client.put("/api/cabinets", json={})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}
