"""Tests for health and root endpoints."""
import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data


async def test_health_returns_app_name(client: AsyncClient):
    response = await client.get("/health")
    assert "InsightX" in response.json()["service"]


async def test_openapi_schema_available(client: AsyncClient):
    response = await client.get("/api/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "openapi" in schema
