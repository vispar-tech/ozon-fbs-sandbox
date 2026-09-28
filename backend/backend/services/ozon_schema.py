"""Ozon Seller API schema mirror: cached fetch and coverage report."""

import asyncio
import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx

from backend.schemas.ozon_coverage import (
    OzonCoverage,
    OzonCoverageGroup,
    OzonCoverageMethod,
    OzonCoverageSource,
    OzonCoverageTag,
)

# Committed mirror of the live docs.ozon.ru schema: the live endpoint sits
# behind a bot challenge, so the sibling repo mirrors it for plain clients.
SCHEMA_URL = (
    "https://raw.githubusercontent.com/vispar-tech/ozon-seller-api-schema"
    "/main/schemas/ozon-seller-api-openapi.json"
)
DOCS_OPERATION_BASE = "https://docs.ozon.ru/api/seller/?__rr=1#operation/"
FETCH_TIMEOUT_SECONDS = 30.0
CACHE_TTL_SECONDS = 300.0
# The only HTTP methods present in the schema operations.
SCHEMA_METHODS = ("get", "post")


@dataclass(frozen=True)
class _CachedSchema:
    """Parsed payload of one fetch with its expiry stamp."""

    expires_at: float
    fetched_at: datetime
    document: dict[str, Any]


class OzonSchemaService:
    """Fetch the schema mirror and report coverage over a process-wide cache."""

    # One cache and one lock per process, shared by every call site.
    _cache: _CachedSchema | None = None
    _lock: asyncio.Lock = asyncio.Lock()
    # Seam over time.monotonic so tests can step past the TTL without sleeping.
    _clock: Callable[[], float] = time.monotonic

    @classmethod
    async def get_coverage(
        cls, implemented: frozenset[tuple[str, str]]
    ) -> OzonCoverage:
        """Build the coverage report over the cached Ozon schema.

        Args:
            implemented: (path, HTTP method) pairs served by the application.

        Returns:
            Coverage tree with implementation flags and counters.
        """
        fetched_at, document = await cls._get_schema()
        groups = cls._build_groups(
            document, cls._collect_methods(document, implemented)
        )
        return OzonCoverage(
            total=sum(group.total for group in groups),
            implemented_total=sum(group.implemented_total for group in groups),
            source=OzonCoverageSource(url=SCHEMA_URL, fetched_at=fetched_at),
            groups=groups,
        )

    @classmethod
    async def _get_schema(cls) -> tuple[datetime, dict[str, Any]]:
        """Return the cached payload, refetching once the TTL has expired.

        Returns:
            Fetch timestamp of the cached payload and the parsed document.
        """
        cached = cls._cache
        if cached is None or cls._clock() >= cached.expires_at:
            # The lock turns concurrent first requests into one fetch
            # instead of a stampede on the mirror.
            async with cls._lock:
                cached = cls._cache
                if cached is None or cls._clock() >= cached.expires_at:
                    fetched_at, document = await cls._fetch()
                    cached = _CachedSchema(
                        expires_at=cls._clock() + CACHE_TTL_SECONDS,
                        fetched_at=fetched_at,
                        document=document,
                    )
                    cls._cache = cached
        return cached.fetched_at, cached.document

    @classmethod
    async def _fetch(cls) -> tuple[datetime, dict[str, Any]]:
        """Download and parse the schema mirror.

        Failures are not swallowed: ``httpx.HTTPError`` from an unreachable
        mirror or a status >= 400, and ``json.JSONDecodeError`` from a
        malformed payload, reach the global handler and the client gets
        500/13 with a retryable UI.

        Returns:
            Fetch timestamp and the parsed OpenAPI document.
        """
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT_SECONDS) as client:
            response = await client.get(SCHEMA_URL)
            response.raise_for_status()
            # 4.2 MB of JSON: parse off the event loop so a cache miss does
            # not stall it for ~100ms.
            document = await asyncio.to_thread(json.loads, response.content)
        return datetime.now(UTC), document

    @classmethod
    def _collect_methods(
        cls, document: dict[str, Any], implemented: frozenset[tuple[str, str]]
    ) -> dict[str, list[OzonCoverageMethod]]:
        """Group schema operations by their first tag, in schema order.

        Args:
            document: Parsed OpenAPI document of the mirror.
            implemented: (path, method) pairs served by the application.

        Returns:
            Tag name to ordered method list mapping.
        """
        methods_by_tag: dict[str, list[OzonCoverageMethod]] = {}
        for path, item in document["paths"].items():
            for method in SCHEMA_METHODS:
                operation = item.get(method)
                if operation is None:
                    continue
                operation_id: str = operation["operationId"]
                # ``summary`` exists on 12 of 481 operations, so the
                # operationId doubles as the display title.
                title: str = operation.get("summary") or operation_id
                http_method = method.upper()
                # Matched by (path, method), not path alone: one path can
                # expose more than one HTTP method.
                tag: str = (operation.get("tags") or [""])[0]
                methods_by_tag.setdefault(tag, []).append(
                    OzonCoverageMethod(
                        path=path,
                        method=http_method,
                        operation_id=operation_id,
                        title=title,
                        doc_url=f"{DOCS_OPERATION_BASE}{operation_id}",
                        implemented=(path, http_method) in implemented,
                    )
                )
        return methods_by_tag

    @classmethod
    def _build_groups(
        cls,
        document: dict[str, Any],
        methods_by_tag: dict[str, list[OzonCoverageMethod]],
    ) -> list[OzonCoverageGroup]:
        """Assemble groups in ``x-tagGroups`` order, dropping empty ones.

        Args:
            document: Parsed OpenAPI document of the mirror.
            methods_by_tag: Methods grouped by tag from ``_collect_methods``.

        Returns:
            Coverage groups with per-tag counters filled in.
        """
        groups: list[OzonCoverageGroup] = []
        for group in document["x-tagGroups"]:
            tags: list[OzonCoverageTag] = []
            for tag_name in group["tags"]:
                methods = methods_by_tag.get(tag_name)
                if not methods:
                    continue
                tags.append(
                    OzonCoverageTag(
                        name=tag_name,
                        total=len(methods),
                        implemented_total=sum(m.implemented for m in methods),
                        methods=methods,
                    )
                )
            if not tags:
                continue
            groups.append(
                OzonCoverageGroup(
                    name=group["name"],
                    total=sum(tag.total for tag in tags),
                    implemented_total=sum(tag.implemented_total for tag in tags),
                    tags=tags,
                )
            )
        return groups
