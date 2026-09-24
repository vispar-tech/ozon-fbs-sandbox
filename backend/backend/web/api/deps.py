"""Shared API dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.dependencies import get_db_session
from backend.db.repositories.cabinets import CabinetRepository
from backend.services.cabinets import CabinetService
from backend.services.fixtures import FIXTURES_DIR, FixtureService

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]


def get_cabinet_repo(session: SessionDep) -> CabinetRepository:
    """
    Build the cabinet repository for the current session.

    Args:
        session: current database session.

    Returns:
        Cabinet repository.
    """
    return CabinetRepository(session)


def get_fixture_service() -> FixtureService:
    """
    Build the fixture service over the JSON storage.

    Returns:
        Fixture service.
    """
    return FixtureService(FIXTURES_DIR)


CabinetRepoDep = Annotated[CabinetRepository, Depends(get_cabinet_repo)]
FixtureServiceDep = Annotated[FixtureService, Depends(get_fixture_service)]


def get_cabinet_service(
    repo: CabinetRepoDep, fixtures: FixtureServiceDep
) -> CabinetService:
    """
    Build the cabinet service.

    Args:
        repo: cabinet repository.
        fixtures: fixture service.

    Returns:
        Cabinet service.
    """
    return CabinetService(repo, fixtures)
