from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request


async def get_db_session(request: Request) -> AsyncGenerator[AsyncSession]:
    """Yield a DB session for the request and manage its transaction.

    Args:
        request: Request whose ``app.state`` carries the session factory.

    Yields:
        Session, committed on success, rolled back on error, always closed.
    """
    session: AsyncSession = request.app.state.db_session_factory()

    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
