"""
Test configuration and shared fixtures for InsightX AI backend.
Uses SQLite in-memory (via aiosqlite) to avoid needing a live PostgreSQL instance.
"""
import os
from typing import AsyncGenerator

# Set test overrides BEFORE importing the app so pydantic-settings picks them up.
# We inject our own SQLite session via get_db override, so DATABASE_URL is not changed.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only-32-bytes!!")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "10000")
os.environ.setdefault("UPLOAD_RATE_LIMIT_PER_MINUTE", "10000")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-placeholder")

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from main import app
from db.session import Base, get_db


# ── SQLite in-memory engine per test function ────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh in-memory SQLite DB for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        yield session

    # Tear down
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Shared test data ─────────────────────────────────────────────────────────

TEST_USER = {
    "email": "testuser@insightx.ai",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "organization": "Test Corp",
}


@pytest_asyncio.fixture()
async def registered_user(client: AsyncClient):
    """Register a test user and return registration response JSON."""
    response = await client.post("/api/v1/auth/register", json=TEST_USER)
    assert response.status_code == 201, response.text
    return response.json()


@pytest_asyncio.fixture()
async def auth_headers(registered_user: dict) -> dict:
    """Return Authorization header dict for the registered test user."""
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest_asyncio.fixture()
async def created_investigation(client: AsyncClient, auth_headers: dict) -> dict:
    """Create an investigation and return its JSON response."""
    response = await client.post(
        "/api/v1/investigations",
        json={
            "title": "Test Investigation Alpha",
            "description": "A sample investigation for testing",
            "priority": "high",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()
