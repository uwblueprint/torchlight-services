import os
from collections.abc import AsyncIterator, Callable

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.session import get_session
from app.main import app

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

# Real connection targets that fail: nothing listens on port 1, and .invalid never resolves.
UNREACHABLE_DATABASE_URLS = (
    "postgresql+asyncpg://torchlight:torchlight@127.0.0.1:1/torchlight",
    "postgresql+asyncpg://torchlight:torchlight@db.invalid:5432/torchlight",
)

pytestmark = pytest.mark.integration


def session_override(database_url: str) -> Callable[[], AsyncIterator[AsyncSession]]:
    # NullPool keeps connections from leaking across pytest-asyncio event loops.
    engine = create_async_engine(database_url, poolclass=NullPool, connect_args={"timeout": 5})
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            yield session
        await engine.dispose()

    return override


async def get_health(database_url: str) -> tuple[int, dict[str, str]]:
    app.dependency_overrides[get_session] = session_override(database_url)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/health")
    finally:
        app.dependency_overrides.clear()
    return response.status_code, response.json()


@pytest.mark.skipif(TEST_DATABASE_URL is None, reason="TEST_DATABASE_URL is not set")
async def test_health_returns_ok_with_live_database() -> None:
    assert TEST_DATABASE_URL is not None
    status_code, body = await get_health(TEST_DATABASE_URL)

    assert status_code == 200
    assert body == {"status": "ok"}


@pytest.mark.parametrize("database_url", UNREACHABLE_DATABASE_URLS)
async def test_health_returns_503_when_database_is_unreachable(database_url: str) -> None:
    status_code, body = await get_health(database_url)

    assert status_code == 503
    assert body == {"status": "error", "database": "unavailable"}
