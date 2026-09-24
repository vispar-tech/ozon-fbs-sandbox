"""Base repository with common CRUD operations."""

from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository[ModelType: Base]:
    """Base repository with common CRUD operations."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        """
        Initialize repository.

        Args:
            session: database session.
            model: SQLAlchemy model class.
        """
        self.session = session
        self.model = model

    async def get(self, obj_id: Any) -> ModelType | None:
        """
        Get object by primary key.

        Args:
            obj_id: primary key value.

        Returns:
            Object or None.
        """
        return await self.session.get(self.model, obj_id)

    async def get_multi(self, *, offset: int = 0, limit: int = 100) -> list[ModelType]:
        """
        Get objects with pagination.

        Args:
            offset: number of objects to skip.
            limit: maximum number of objects to return.

        Returns:
            List of objects.
        """
        result = await self.session.scalars(
            select(self.model).offset(offset).limit(limit),
        )
        return list(result)

    async def create(self, **values: Any) -> ModelType:
        """
        Create object.

        Args:
            values: model field values.

        Returns:
            Created object.
        """
        obj = self.model(**values)  # type: ignore[call-arg]
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def remove(self, obj: ModelType) -> None:
        """
        Remove object.

        Args:
            obj: object to remove.
        """
        await self.session.delete(obj)
