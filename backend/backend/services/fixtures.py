"""Fixture storage service."""

import json
from pathlib import Path

from pydantic import BaseModel

from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo
from backend.schemas.products import ProductAttributes, ProductList

FIXTURES_DIR = Path(__file__).resolve().parents[2] / "data" / "fixtures"


class Fixtures(BaseModel):
    """Typed result of loading a fixture file."""

    seller_info: SellerInfo
    roles: Roles


class FixtureService:
    """Reads prepared datasets from JSON storage to fill demo data."""

    def __init__(self, storage_dir: Path) -> None:
        """
        Initialize the service.

        Args:
            storage_dir: directory with fixture JSON files.
        """
        self._storage_dir = storage_dir

    def load_demo_cabinet(self) -> Fixtures:
        """
        Load the demo cabinet fixture set.

        Returns:
            Validated fixtures.
        """
        return self._load("demo-cabinet.json", Fixtures)

    def load_products_list(self) -> ProductList:
        """
        Load the v3 product list fixture.

        Returns:
            Validated product list response.
        """
        return self._load("v3-product-list.json", ProductList)

    def load_products_attributes(self) -> ProductAttributes:
        """
        Load the v4 product attributes fixture.

        Returns:
            Validated product attributes response.
        """
        return self._load("v4-product-info-attributes.json", ProductAttributes)

    def _load[FixtureT: BaseModel](
        self, name: str, fixture_type: type[FixtureT]
    ) -> FixtureT:
        """
        Load and validate a single fixture file.

        Args:
            name: file name inside the storage directory.
            fixture_type: expected fixture model.

        Returns:
            Validated fixture.
        """
        raw = json.loads((self._storage_dir / name).read_text(encoding="utf-8"))
        return fixture_type.model_validate(raw)
