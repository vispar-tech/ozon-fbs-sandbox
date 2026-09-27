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
    """Backend for anyio pytest plugin.

    Returns:
        ``"asyncio"``, the only backend wired into this suite.
    """
    return "asyncio"


@pytest.fixture(scope="session")
async def _engine(anyio_backend: Any) -> AsyncGenerator[AsyncEngine]:
    """Create the test database and engine; drop the database afterwards.

    Yields:
        Session-scoped test engine, disposed at teardown.
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
) -> AsyncGenerator[AsyncSession]:
    """Yield a session bound to a transaction that rolls back after the test.

    Args:
        _engine: Engine the connection is taken from.

    Yields:
        Session, rolled back and closed after the test.
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
    """Build the FastAPI app with the DB session dependency overridden.

    Returns:
        App wired to the test session.
    """
    application = get_app()
    application.dependency_overrides[get_db_session] = lambda: dbsession
    return application


@pytest.fixture
async def client(
    fastapi_app: FastAPI, anyio_backend: Any
) -> AsyncGenerator[AsyncClient]:
    """Yield an httpx client for the test server.

    Args:
        fastapi_app: Application under test.
        anyio_backend: Anyio plugin backend parameter, unused here.

    Yields:
        Client bound to the ASGI transport.
    """
    async with AsyncClient(
        transport=ASGITransport(fastapi_app), base_url="http://test", timeout=2.0
    ) as ac:
        yield ac


CT_JSON = {"content-type": "application/json"}


async def create_cabinet(client: AsyncClient, **payload: Any) -> dict[str, Any]:
    """Create a cabinet and return its response body.

    Args:
        client: Client for the app.
        payload: Create payload fields.

    Returns:
        Parsed response body of the 201 answer.
    """
    response = await client.post("/api/cabinets", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def auth_headers(cabinet: dict[str, Any]) -> dict[str, str]:
    """Build Client-Id/Api-Key headers for a cabinet.

    Args:
        cabinet: Cabinet summary body.

    Returns:
        Seller auth headers plus the JSON content type.
    """
    return {
        "Client-Id": str(cabinet["client_id"]),
        "Api-Key": cabinet["api_key"],
        **CT_JSON,
    }
