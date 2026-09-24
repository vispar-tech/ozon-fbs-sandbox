from collections.abc import AsyncGenerator
from typing import Any

import pytest
from fastapi import FastAPI, status
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.db.dependencies import get_db_session
from backend.db.utils import create_database, drop_database
from backend.settings import settings
from backend.web.application import get_app


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """
    Backend for anyio pytest plugin.

    Returns:
        Backend name.
    """
    return "asyncio"


@pytest.fixture(scope="session")
async def _engine(anyio_backend: Any) -> AsyncGenerator[AsyncEngine, None]:
    """
    Create engine and databases.

    Yields:
        New engine.
    """
    from backend.db.meta import meta
    from backend.db.models import load_all_models

    load_all_models()

    await create_database()

    engine = create_async_engine(str(settings.db_url))
    async with engine.begin() as conn:
        await conn.run_sync(meta.create_all)

    try:
        yield engine
    finally:
        await engine.dispose()
        await drop_database()


@pytest.fixture
async def dbsession(
    _engine: AsyncEngine,
) -> AsyncGenerator[AsyncSession, None]:
    """
    Get session to database.

    Fixture that returns a SQLAlchemy session bound to a transaction, rolled back
    after the test completes.

    Args:
        _engine: current engine.

    Yields:
        Async session.
    """
    connection = await _engine.connect()
    trans = await connection.begin()

    session_maker = async_sessionmaker(
        connection,
        expire_on_commit=False,
    )
    session = session_maker()

    try:
        yield session
    finally:
        await session.close()
        await trans.rollback()
        await connection.close()


@pytest.fixture
def fastapi_app(
    dbsession: AsyncSession,
) -> FastAPI:
    """
    Fixture for creating FastAPI app.

    Returns:
        Fastapi app with mocked dependencies.
    """
    application = get_app()
    application.dependency_overrides[get_db_session] = lambda: dbsession
    return application


@pytest.fixture
async def client(
    fastapi_app: FastAPI, anyio_backend: Any
) -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture that creates client for requesting server.

    Args:
        fastapi_app: the application.

    Yields:
        Client for the app.
    """
    async with AsyncClient(
        transport=ASGITransport(fastapi_app), base_url="http://test", timeout=2.0
    ) as ac:
        yield ac


CT_JSON = {"content-type": "application/json"}


async def _create(client: AsyncClient, **payload: Any) -> dict[str, Any]:
    """Create a cabinet and return its body.

    Args:
        client: client for the app.
        payload: create payload.

    Returns:
        Response body.
    """
    response = await client.post("/api/cabinets", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def _auth(cabinet: dict[str, Any]) -> dict[str, str]:
    """Build authenticated seller headers for a cabinet.

    Args:
        cabinet: cabinet summary body.

    Returns:
        Client-Id/Api-Key headers.
    """
    return {
        "Client-Id": str(cabinet["client_id"]),
        "Api-Key": cabinet["api_key"],
        **CT_JSON,
    }
