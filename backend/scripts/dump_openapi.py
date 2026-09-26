"""Dump the backend's own OpenAPI schema to a JSON file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.web.application import get_app


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        Parsed CLI arguments with the output path.
    """
    parser = argparse.ArgumentParser(
        description="Dump the backend OpenAPI schema to a JSON file.",
    )
    parser.add_argument(
        "output",
        type=Path,
        help="Path of the OpenAPI JSON file to write",
    )
    return parser.parse_args()


def dump_openapi(output: Path) -> Path:
    """Build the OpenAPI schema offline and write it to ``output``.

    The schema is built in-process: no running server and no database are
    required.

    Args:
        output: Destination path for the OpenAPI JSON file.

    Returns:
        The path written to.
    """
    schema = get_app().openapi()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2) + "\n",
    )
    return output


def main() -> None:
    """Run the OpenAPI schema dump."""
    args = parse_args()
    output = dump_openapi(args.output)
    print(f"Saved OpenAPI schema to {output}")


if __name__ == "__main__":
    main()
