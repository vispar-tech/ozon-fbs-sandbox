"""Base service composing a repository."""

from typing import Any

from backend.db.repositories.base import BaseRepository


class BaseService[RepoType: BaseRepository[Any]]:
    """Base service with common operations over a repository."""

    def __init__(self, repository: RepoType) -> None:
        """Expose the repository as the service's single data source."""
        self.repository = repository
