"""Admin contour tests (``/api/cabinets``) plus cross-contour admin/seller flows."""

import re
import uuid

from fastapi import status
from httpx import AsyncClient

from tests.conftest import CT_JSON, auth_headers, create_cabinet

ISO_MS_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")


async def test_list_empty(client: AsyncClient) -> None:
    """Empty store returns an empty list."""
    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


async def test_create_and_get_cabinet(client: AsyncClient) -> None:
    """Create returns 201 with the summary, get returns the same cabinet."""
    created = await create_cabinet(client, name="first")
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
    """Responses use pretty-printed JSON (indent=2)."""
    created = await create_cabinet(client, name="pretty")
    response = await client.get(f"/api/cabinets/{created['client_id']}")
    assert response.text.startswith("{\n  ")
    assert response.headers["content-type"].startswith("application/json")


async def test_create_blank_name_is_rejected(client: AsyncClient) -> None:
    """Blank name fails validation with 400/3."""
    response = await client.post("/api/cabinets", json={"name": "   "})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_create_malformed_body_is_rejected(client: AsyncClient) -> None:
    """Malformed JSON body fails with 400/3, never 422."""
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
    """Admin write without JSON Content-Type fails with 400/3."""
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
    """Demo flag fills the cabinet from the romashka fixture set."""
    created = await create_cabinet(client, name="demo", demo=True)
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
    """PATCH updates the name."""
    created = await create_cabinet(client, name="before")
    response = await client.patch(
        f"/api/cabinets/{created['client_id']}", json={"name": "after"}
    )
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["name"] == "after"


async def test_update_seller_info_and_roles(client: AsyncClient) -> None:
    """PATCH replaces typed seller_info and roles independently."""
    created = await create_cabinet(client, name="patch me")
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
    """Empty PATCH body fails with 400/3."""
    created = await create_cabinet(client, name="empty patch")
    response = await client.patch(f"/api/cabinets/{created['client_id']}", json={})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_missing_cabinet_returns_404(client: AsyncClient) -> None:
    """Unknown client id answers 404/5 on get/patch/delete."""
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
    """Non-integer or non-positive client_id answers 400/3."""
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
    """DELETE answers 204 and removes the cabinet."""
    created = await create_cabinet(client, name="to delete")
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.get(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


async def test_unknown_route_returns_404(client: AsyncClient) -> None:
    """Unmatched routes answer 404/5."""
    response = await client.get("/api/nope")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}


async def test_method_not_allowed_returns_404(client: AsyncClient) -> None:
    """405 is reported as 404/5 (legacy notFound parity)."""
    response = await client.put("/api/cabinets", json={})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}


async def test_create_returns_every_summary_field(client: AsyncClient) -> None:
    """Create response carries the full summary field set with valid values."""
    created = await create_cabinet(client, name="full fields")
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
    """Each created cabinet gets its own api key."""
    first = await create_cabinet(client, name="first key")
    second = await create_cabinet(client, name="second key")
    assert first["api_key"] != second["api_key"]
    assert first["client_id"] != second["client_id"]


async def test_create_empty_name_is_rejected(client: AsyncClient) -> None:
    """Empty name fails validation with 400/3."""
    response = await client.post("/api/cabinets", json={"name": ""})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_create_missing_name_is_rejected(client: AsyncClient) -> None:
    """Body without a name field fails with 400/3."""
    response = await client.post("/api/cabinets", json={})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "code": 3,
        "message": "Invalid request body",
        "details": [],
    }


async def test_list_returns_created_cabinets(client: AsyncClient) -> None:
    """List returns created cabinets ordered by id."""
    first = await create_cabinet(client, name="list one")
    second = await create_cabinet(client, name="list two")

    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert [item["client_id"] for item in body] == [
        first["client_id"],
        second["client_id"],
    ]


async def test_update_blank_name_is_rejected(client: AsyncClient) -> None:
    """PATCH with a whitespace name fails with 400/3 and keeps the old name."""
    created = await create_cabinet(client, name="keep me")
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
    """PATCH with a valid body on an unknown id still answers 404/5."""
    response = await client.patch("/api/cabinets/999", json={"name": "x"})
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"code": 5, "message": "Not Found", "details": []}


async def test_invalid_path_param_on_writes_returns_400(
    client: AsyncClient,
) -> None:
    """Non-integer client_id on PATCH/DELETE answers 400/3."""
    expected = {"code": 3, "message": "Invalid request body", "details": []}
    response = await client.patch("/api/cabinets/abc", json={"name": "x"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == expected

    response = await client.delete("/api/cabinets/abc")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == expected


async def test_delete_removes_cabinet_from_list(client: AsyncClient) -> None:
    """After DELETE the cabinet disappears from the list."""
    created = await create_cabinet(client, name="gone soon")
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.get("/api/cabinets")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


async def test_missing_single_header_returns_401(client: AsyncClient) -> None:
    """Absent Client-Id or Api-Key alone answers 401/16."""
    created = await create_cabinet(client, name="partial auth")
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
    """Seller contour serves seller_info written through the admin PATCH."""
    created = await create_cabinet(client, name="cross contour")
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

    response = await client.post(
        "/v1/seller/info", json={}, headers=auth_headers(created)
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == new_info


async def test_deleted_cabinet_seller_auth_fails(client: AsyncClient) -> None:
    """Old credentials stop working after the cabinet is deleted."""
    created = await create_cabinet(client, name="revoked")
    headers = auth_headers(created)
    response = await client.delete(f"/api/cabinets/{created['client_id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = await client.post("/v1/seller/info", json={}, headers=headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "code": 5,
        "message": "Invalid Api-Key, please check the key and try again",
        "details": [],
    }
