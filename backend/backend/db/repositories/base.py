"""Base repository with common CRUD operations."""

from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository[ModelType: Base]:
    """Base repository with common CRUD operations."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        """Bind the repository to a session and its model type."""
        self.session = session
        self.model = model

    async def get(self, obj_id: Any) -> ModelType | None:
        """Get an object by primary key.

        Args:
            obj_id: Primary key value.

        Returns:
            The object, or ``None`` when absent.
        """
        return await self.session.get(self.model, obj_id)

    async def create(self, **values: Any) -> ModelType:
        """Create an object from the given field values.

        Args:
            values: Model field values.

        Returns:
            The created object, flushed (not committed).
        """
        obj = self.model(**values)  # type: ignore[call-arg]
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def remove(self, obj: ModelType) -> None:
        """Remove an object from the session (flush is left to the caller).

        Args:
            obj: Object to delete.
        """
        await self.session.delete(obj)
