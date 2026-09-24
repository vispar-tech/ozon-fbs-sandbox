"""Fixture storage service."""

import json
from pathlib import Path

from pydantic import BaseModel

from backend.db.models.roles import Roles
from backend.db.models.seller_info import SellerInfo

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
        return self._load("demo-cabinet.json")

    def _load(self, name: str) -> Fixtures:
        """
        Load and validate a single fixture file.

        Args:
            name: file name inside the storage directory.

        Returns:
            Validated fixtures.
        """
        raw = json.loads((self._storage_dir / name).read_text(encoding="utf-8"))
        return Fixtures.model_validate(raw)
