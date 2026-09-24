"""Cabinet repository."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models.cabinet import Cabinet
from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.db.repositories.base import BaseRepository


class CabinetRepository(BaseRepository[Cabinet]):
    """CRUD operations over the ``cabinets`` table."""

    def __init__(self, session: AsyncSession) -> None:
        """
        Initialize repository.

        Args:
            session: database session.
        """
        super().__init__(session, Cabinet)

    async def create(  # type: ignore[override]
        self,
        *,
        name: str,
        api_key: uuid.UUID,
        seller_info: SellerInfo,
        roles: Roles,
    ) -> Cabinet:
        """
        Create a cabinet with fresh timestamps.

        Args:
            name: cabinet display name.
            api_key: generated API key.
            seller_info: seller info fixture.
            roles: roles fixture.

        Returns:
            Created cabinet.
        """
        now = datetime.now(UTC)
        return await super().create(
            name=name,
            api_key=api_key,
            seller_info=seller_info,
            roles=roles,
            created_at=now,
            updated_at=now,
        )

    async def get_by_id(self, client_id: int) -> Cabinet | None:
        """
        Get cabinet by client id.

        Args:
            client_id: cabinet client id (primary key).

        Returns:
            Cabinet or None.
        """
        return await self.get(client_id)

    async def list(self) -> list[Cabinet]:
        """
        List all cabinets ordered by client id.

        Returns:
            List of cabinets.
        """
        result = await self.session.scalars(
            select(self.model).order_by(self.model.client_id),
        )
        return list(result)

    async def update(
        self,
        cabinet: Cabinet,
        *,
        name: str | None = None,
        seller_info: SellerInfo | None = None,
        roles: Roles | None = None,
    ) -> Cabinet:
        """
        Update the given cabinet fields and bump ``updated_at``.

        Args:
            cabinet: cabinet to update.
            name: new name when set.
            seller_info: new seller info when set.
            roles: new roles when set.

        Returns:
            Updated cabinet.
        """
        if name is not None:
            cabinet.name = name
        if seller_info is not None:
            cabinet.seller_info = seller_info
        if roles is not None:
            cabinet.roles = roles
        cabinet.updated_at = datetime.now(UTC)
        await self.session.flush()
        await self.session.refresh(cabinet)
        return cabinet

    async def delete(self, cabinet: Cabinet) -> None:
        """
        Delete the cabinet.

        Args:
            cabinet: cabinet to delete.
        """
        await self.remove(cabinet)
        await self.session.flush()
