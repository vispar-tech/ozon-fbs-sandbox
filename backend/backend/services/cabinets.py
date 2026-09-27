"""Cabinet service."""

from uuid import uuid4

from backend.db.models.cabinet import Cabinet
from backend.db.models.roles import Roles
from backend.db.models.seller_info import CompanyInfo, SellerInfo, Subscription
from backend.db.repositories.cabinets import CabinetRepository
from backend.services.base import BaseService
from backend.services.fixtures import FixtureService


def _empty_defaults() -> tuple[SellerInfo, Roles]:
    """Build fresh empty seller info and roles for a new cabinet.

    A factory, not module-level constants: Pydantic models are mutable, so
    sharing one instance across cabinets would alias mutations across rows.
    """
    seller_info = SellerInfo(
        company=CompanyInfo(
            name="",
            legal_name="",
            inn="",
            ogrn="",
            country="",
            currency="RUB",
            ownership_form="",
            tax_system="UNSPECIFIED",
        ),
        ratings=[],
        subscription=Subscription(is_premium=False, type="UNSPECIFIED"),
    )
    roles = Roles(expires_at=None, roles=[])  # None -> '' in JSON
    return seller_info, roles


class CabinetNotFoundError(Exception):
    """Raised when a cabinet does not exist (-> 404/5)."""


class CabinetService(BaseService[CabinetRepository]):
    """CRUD orchestration over cabinets and fixtures."""

    def __init__(self, repo: CabinetRepository, fixtures: FixtureService) -> None:
        """Bind the service to its repository and its fixture loader."""
        super().__init__(repo)
        self._fixtures = fixtures

    async def list(self) -> list[Cabinet]:
        """List all cabinets.

        Returns:
            All stored cabinets.
        """
        return await self.repository.list()

    async def get_by_id(self, client_id: int) -> Cabinet:
        """Get a cabinet by client id.

        Args:
            client_id: Cabinet client id.

        Returns:
            The cabinet.

        Raises:
            CabinetNotFoundError: When the cabinet does not exist.
        """
        cabinet = await self.repository.get_by_id(client_id)
        if cabinet is None:
            raise CabinetNotFoundError(client_id)
        return cabinet

    async def create(self, name: str, *, demo: bool = False) -> Cabinet:
        """Create a cabinet, applying the demo fixture set when requested.

        Args:
            name: Cabinet display name.
            demo: Fill seller info and roles from the demo fixture.

        Returns:
            The created cabinet.
        """
        if demo:
            fixtures = self._fixtures.load_demo_cabinet()
            seller_info, roles = fixtures.seller_info, fixtures.roles
        else:
            seller_info, roles = _empty_defaults()
        return await self.repository.create(
            name=name, api_key=uuid4(), seller_info=seller_info, roles=roles
        )

    async def update(
        self,
        cabinet: Cabinet,
        *,
        name: str | None = None,
        seller_info: SellerInfo | None = None,
        roles: Roles | None = None,
    ) -> Cabinet:
        """Update the given cabinet fields.

        The caller must pass an existing cabinet (e.g. fetched via
        ``get_by_id``); no existence check is performed here.

        Args:
            cabinet: Cabinet to update in place.
            name: New name when set.
            seller_info: New seller info when set.
            roles: New roles when set.

        Returns:
            The updated cabinet.
        """
        return await self.repository.update(
            cabinet, name=name, seller_info=seller_info, roles=roles
        )

    async def delete(self, client_id: int) -> None:
        """Delete a cabinet by client id.

        Args:
            client_id: Cabinet client id.

        Raises:
            CabinetNotFoundError: When the cabinet does not exist.
        """
        await self.repository.delete(await self.get_by_id(client_id))
