from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.settings import settings


def _setup_db(app: FastAPI) -> None:  # pragma: no cover
    """Create the SQLAlchemy engine and session factory, stored on app.state.

    Args:
        app: FastAPI application.
    """
    engine = create_async_engine(str(settings.db_url), echo=settings.db_echo)
    session_factory = async_sessionmaker(
        engine,
        expire_on_commit=False,
    )
    app.state.db_engine = engine
    app.state.db_session_factory = session_factory


@asynccontextmanager
async def lifespan_setup(
    app: FastAPI,
) -> AsyncGenerator[None]:  # pragma: no cover
    """Set up the database on startup; dispose the engine on shutdown.

    Args:
        app: FastAPI application.

    Returns:
        Async generator: nothing on startup, engine disposal on shutdown.
    """
    _setup_db(app)

    yield
    await app.state.db_engine.dispose()
