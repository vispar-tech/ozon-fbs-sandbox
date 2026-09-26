"""Date serialization helpers for the domain boundary."""

from datetime import UTC, datetime
from typing import Annotated

from pydantic import BeforeValidator, PlainSerializer, WithJsonSchema


def to_iso_ms_z(dt: datetime) -> str:
    """
    Format datetime as iso-ms-Z string (UTC, millisecond precision).

    Args:
        dt: datetime to format.

    Returns:
        iso-ms-Z string, e.g. ``2024-01-01T00:00:00.000Z``.
    """
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _empty_str_to_none(value: object) -> object:
    """Map TS empty state ``''`` to ``None`` on validation.

    Args:
        value: raw value from JSON.

    Returns:
        ``None`` for ``''``, the value unchanged otherwise.
    """
    return None if value == "" else value


def _iso_ms_z_or_empty(dt: datetime | None) -> str:
    """Serialize a nullable datetime as iso-ms-Z, ``None`` as ``''``.

    ``''`` is the wire form the frontend renders as an empty state, so a
    missing date stays a plain string on both sides.

    Args:
        dt: datetime or None.

    Returns:
        iso-ms-Z string or ``''``.
    """
    return "" if dt is None else to_iso_ms_z(dt)


# ``WithJsonSchema`` declares one wire type for both directions, so pydantic emits
# a single schema node instead of an ``-Input``/``-Output`` pair per model.
IsoMsZ = Annotated[
    datetime,
    PlainSerializer(to_iso_ms_z, return_type=str),
    WithJsonSchema({"type": "string", "format": "date-time"}),
]

IsoMsZNullable = Annotated[
    datetime | None,
    BeforeValidator(_empty_str_to_none),
    PlainSerializer(_iso_ms_z_or_empty, return_type=str),
    WithJsonSchema({"type": "string", "format": "date-time"}),
]
