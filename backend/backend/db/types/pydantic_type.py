"""JSONB column type backed by a Pydantic model."""

from typing import Any, TypeVar

from pydantic import TypeAdapter
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator

T = TypeVar("T")


class PydanticType(TypeDecorator[T]):
    """JSONB column typed by a Pydantic model.

    The value is validated by the model on read and dumped on write,
    so stored JSON stays compatible with the declared schema.
    """

    impl = JSON
    cache_ok = True

    def __init__(self, model: type[T]) -> None:
        """
        Initialize the column type.

        Args:
            model: Pydantic model class used to validate the JSON value.
        """
        super().__init__()
        self.adapter = TypeAdapter(model)

    def load_dialect_impl(self, dialect: Any) -> Any:
        """
        Map the type to a dialect-specific implementation.

        Args:
            dialect: current dialect.

        Returns:
            JSONB type descriptor for PostgreSQL.
        """
        return dialect.type_descriptor(JSONB())

    def process_bind_param(self, value: T | None, dialect: Any) -> Any:
        """
        Serialize the model value before sending it to the database.

        Args:
            value: model instance or None.
            dialect: current dialect.

        Returns:
            JSON-serializable representation or None.
        """
        return None if value is None else self.adapter.dump_python(value, mode="json")

    def process_result_value(self, value: Any, dialect: Any) -> T | None:
        """
        Validate the raw JSON value read from the database.

        Args:
            value: raw JSON value or None.
            dialect: current dialect.

        Returns:
            Model instance or None.
        """
        return None if value is None else self.adapter.validate_python(value)
