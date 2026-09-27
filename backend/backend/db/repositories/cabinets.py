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
        """Bind the repository to a session and the ``Cabinet`` model."""
        super().__init__(session, Cabinet)

    async def create(  # type: ignore[override]
        self,
        *,
        name: str,
        api_key: uuid.UUID,
        seller_info: SellerInfo,
        roles: Roles,
    ) -> Cabinet:
        """Create a cabinet with fresh timestamps.

        Args:
            name: Cabinet display name.
            api_key: Generated API key.
            seller_info: Seller info fixture.
            roles: Roles fixture.

        Returns:
            The created cabinet.
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
        """Get a cabinet by client id.

        Args:
            client_id: Cabinet client id (primary key).

        Returns:
            The cabinet, or ``None`` when absent.
        """
        return await self.get(client_id)

    async def list(self) -> list[Cabinet]:
        """List all cabinets ordered by client id.

        Returns:
            Cabinets ordered by client id.
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
        """Update the given cabinet fields and bump ``updated_at``.

        Args:
            cabinet: Cabinet to update in place.
            name: New name when set.
            seller_info: New seller info when set.
            roles: New roles when set.

        Returns:
            The updated cabinet.
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
        """Delete the cabinet and flush.

        Args:
            cabinet: Cabinet to delete.
        """
        await self.remove(cabinet)
        await self.session.flush()
