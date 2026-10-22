from collections.abc import AsyncIterator
from unittest.mock import AsyncMock

from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.main import app


async def override_session() -> AsyncIterator[AsyncSession]:
    session = AsyncMock(spec=AsyncSession)
    yield session


async def test_health_returns_ok_when_database_check_succeeds() -> None:
    app.dependency_overrides[get_session] = override_session
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def failing_session() -> AsyncIterator[AsyncSession]:
    session = AsyncMock(spec=AsyncSession)
    session.execute.side_effect = OperationalError("SELECT 1", {}, ConnectionRefusedError())
    yield session


async def test_health_returns_503_when_database_check_fails() -> None:
    app.dependency_overrides[get_session] = failing_session
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}
