"""Tests for /api/v1/investigations endpoints."""
import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


VALID_INVESTIGATION = {
    "title": "Parking Lot Incident — 2024-01-15",
    "description": "Suspicious activity reported near building entrance",
    "priority": "high",
}


class TestCreateInvestigation:
    async def test_create_success(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/investigations",
            json=VALID_INVESTIGATION,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == VALID_INVESTIGATION["title"]
        assert data["description"] == VALID_INVESTIGATION["description"]
        assert data["priority"] == "high"
        assert data["status"] == "open"
        assert data["case_number"].startswith("IX-")
        assert "id" in data
        assert "created_at" in data

    async def test_create_minimal(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/investigations",
            json={"title": "Minimal Investigation"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["priority"] == "medium"

    async def test_create_unauthenticated(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/investigations",
            json=VALID_INVESTIGATION,
        )
        assert response.status_code in (401, 422)

    async def test_create_empty_title(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/investigations",
            json={"title": ""},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_invalid_priority(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/investigations",
            json={"title": "Test", "priority": "nuclear"},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestListInvestigations:
    async def test_list_empty(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/investigations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["items"], list)

    async def test_list_after_create(self, client: AsyncClient, auth_headers: dict, created_investigation: dict):
        response = await client.get("/api/v1/investigations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        ids = [i["id"] for i in data["items"]]
        assert created_investigation["id"] in ids

    async def test_list_pagination(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/investigations?page=1&page_size=5",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 5

    async def test_list_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/v1/investigations")
        assert response.status_code in (401, 422)


class TestGetInvestigation:
    async def test_get_success(self, client: AsyncClient, auth_headers: dict, created_investigation: dict):
        inv_id = created_investigation["id"]
        response = await client.get(f"/api/v1/investigations/{inv_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == inv_id
        assert data["title"] == created_investigation["title"]

    async def test_get_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/investigations/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_unauthenticated(self, client: AsyncClient, created_investigation: dict):
        inv_id = created_investigation["id"]
        response = await client.get(f"/api/v1/investigations/{inv_id}")
        assert response.status_code in (401, 422)


class TestUpdateInvestigation:
    async def test_update_title(self, client: AsyncClient, auth_headers: dict, created_investigation: dict):
        inv_id = created_investigation["id"]
        response = await client.patch(
            f"/api/v1/investigations/{inv_id}",
            json={"title": "Updated Investigation Title"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Investigation Title"

    async def test_update_status(self, client: AsyncClient, auth_headers: dict, created_investigation: dict):
        inv_id = created_investigation["id"]
        response = await client.patch(
            f"/api/v1/investigations/{inv_id}",
            json={"status": "active"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "active"

    async def test_update_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.patch(
            "/api/v1/investigations/00000000-0000-0000-0000-000000000000",
            json={"title": "Ghost Update"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_update_invalid_status(self, client: AsyncClient, auth_headers: dict, created_investigation: dict):
        inv_id = created_investigation["id"]
        response = await client.patch(
            f"/api/v1/investigations/{inv_id}",
            json={"status": "invalid_status"},
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestDeleteInvestigation:
    async def test_delete_success(self, client: AsyncClient, auth_headers: dict):
        # Create a dedicated one to delete
        create_resp = await client.post(
            "/api/v1/investigations",
            json={"title": "To Be Deleted"},
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        inv_id = create_resp.json()["id"]

        delete_resp = await client.delete(f"/api/v1/investigations/{inv_id}", headers=auth_headers)
        assert delete_resp.status_code == 204

        get_resp = await client.get(f"/api/v1/investigations/{inv_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_delete_not_found(self, client: AsyncClient, auth_headers: dict):
        response = await client.delete(
            "/api/v1/investigations/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404
