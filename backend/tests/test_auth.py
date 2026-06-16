"""Tests for /api/v1/auth endpoints."""
import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "new@insightx.ai",
                "password": "Password123!",
                "full_name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    async def test_register_duplicate_email(self, client: AsyncClient, registered_user: dict):
        from tests.conftest import TEST_USER
        response = await client.post("/api/v1/auth/register", json=TEST_USER)
        assert response.status_code == 409

    async def test_register_short_password(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "short@insightx.ai",
                "password": "abc",
                "full_name": "Short Pass",
            },
        )
        assert response.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "ValidPass123!",
                "full_name": "Bad Email",
            },
        )
        assert response.status_code == 422

    async def test_register_missing_fields(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={"email": "x@x.com"})
        assert response.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient, registered_user: dict):
        from tests.conftest import TEST_USER
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient, registered_user: dict):
        from tests.conftest import TEST_USER
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": TEST_USER["email"], "password": "WrongPass!"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@insightx.ai", "password": "Password123!"},
        )
        assert response.status_code == 401

    async def test_login_invalid_email_format(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "notanemail", "password": "Password123!"},
        )
        assert response.status_code == 422


class TestRefreshToken:
    async def test_refresh_success(self, client: AsyncClient, registered_user: dict):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": registered_user["refresh_token"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_invalid_token(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401

    async def test_refresh_with_access_token(self, client: AsyncClient, registered_user: dict):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": registered_user["access_token"]},
        )
        assert response.status_code == 401


class TestMe:
    async def test_me_success(self, client: AsyncClient, registered_user: dict, auth_headers: dict):
        from tests.conftest import TEST_USER
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER["email"]
        assert data["full_name"] == TEST_USER["full_name"]
        assert data["role"] == "analyst"
        assert data["is_active"] is True

    async def test_me_no_token(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code in (401, 422)

    async def test_me_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert response.status_code == 401
