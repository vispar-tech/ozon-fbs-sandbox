"""Cabinet ORM entity."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.base import Base
from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.db.types.pydantic_type import PydanticType


class Cabinet(Base):
    """Seller cabinet (table ``cabinets``)."""

    __tablename__ = "cabinets"

    client_id: Mapped[int] = mapped_column(
        "id", Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(String(255))
    api_key: Mapped[uuid.UUID] = mapped_column(Uuid)
    seller_info: Mapped[SellerInfo] = mapped_column(PydanticType(SellerInfo))
    roles: Mapped[Roles] = mapped_column(PydanticType(Roles))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    def is_expired(self) -> bool:
        """Check whether ``roles.expires_at`` is in the past.

        ``None`` (TS empty state ``''``) means the roles never expire.

        Returns:
            True when roles are expired.
        """
        expires = self.roles.expires_at
        return expires is not None and datetime.now(UTC) > expires
