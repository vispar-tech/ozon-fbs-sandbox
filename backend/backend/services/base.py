"""Base service composing a repository."""

from typing import Any, TypeVar

from backend.db.base import Base
from backend.db.repositories.base import BaseRepository

ModelType = TypeVar("ModelType", bound=Base)
RepoType = TypeVar("RepoType", bound=BaseRepository[Any])


class BaseService[ModelType: Base, RepoType: BaseRepository[Any]]:
    """Base service with common operations over a repository."""

    def __init__(self, repository: RepoType) -> None:
        """
        Initialize service.

        Args:
            repository: repository for the model.
        """
        self.repository = repository
