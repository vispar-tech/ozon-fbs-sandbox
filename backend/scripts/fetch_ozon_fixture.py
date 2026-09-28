"""Fetch a real Ozon Seller API response and save it as a JSON fixture."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

DEFAULT_BASE_URL = "https://api-seller.ozon.ru"
FIXTURES_DIR = (Path(__file__).resolve().parent.parent / "data" / "fixtures").resolve()
HTTP_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE")
ENV_CLIENT_ID = "OZON_CLIENT_ID"
ENV_API_KEY = "OZON_API_KEY"
REQUEST_TIMEOUT_SECONDS = 30


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        Parsed command-line arguments.
    """
    parser = argparse.ArgumentParser(
        description="Fetch a real Ozon Seller API response as a JSON fixture.",
    )
    parser.add_argument(
        "--client-id",
        help=f"Ozon Client-Id (default: {ENV_CLIENT_ID} env var)",
    )
    parser.add_argument(
        "--api-key",
        help=f"Ozon Api-Key (default: {ENV_API_KEY} env var)",
    )
    parser.add_argument(
        "--path",
        default="/v1/seller/info",
        help="API path (default: %(default)s)",
    )
    parser.add_argument(
        "--method",
        choices=HTTP_METHODS,
        type=str.upper,
        default="POST",
        help="HTTP method (default: %(default)s)",
    )
    parser.add_argument(
        "--body",
        default="{}",
        help="Request body as a JSON string (default: %(default)s)",
    )
    parser.add_argument(
        "--output",
        help="Fixture file name (default: derived from --path)",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="API base URL (default: %(default)s)",
    )
    return parser.parse_args()


def resolve_credentials(args: argparse.Namespace) -> tuple[int, str]:
    """Resolve Ozon credentials from CLI args or environment variables.

    Returns:
        Client id and Api-Key as a pair.

    Raises:
        SystemExit: When credentials are missing or Client-Id is invalid.
    """
    client_id = args.client_id or os.environ.get(ENV_CLIENT_ID)
    api_key = args.api_key or os.environ.get(ENV_API_KEY)
    if client_id is None or api_key is None:
        raise SystemExit(
            "Missing Ozon credentials: pass --client-id/--api-key or set "
            f"{ENV_CLIENT_ID}/{ENV_API_KEY} env vars",
        )
    try:
        return int(client_id), api_key
    except ValueError:
        raise SystemExit(f"Invalid Client-Id: {client_id!r}") from None


def default_output_name(path: str) -> str:
    """Derive a fixture file name from an API path.

    Returns:
        File name for the fixture.
    """
    return path.strip("/").replace("/", "-") + ".json"


def resolve_output_path(raw_output: str | None, path: str) -> Path:
    """Resolve the fixture destination, keeping it inside the fixtures directory.

    Args:
        raw_output: Explicit output name from the CLI, if any.
        path: API path used to derive the default name.

    Returns:
        Resolved destination inside the fixtures directory.

    Raises:
        SystemExit: When the destination escapes the fixtures directory.
    """
    output = (FIXTURES_DIR / (raw_output or default_output_name(path))).resolve()
    try:
        output.relative_to(FIXTURES_DIR)
    except ValueError:
        raise SystemExit(
            f"--output must stay inside {FIXTURES_DIR}, got: {raw_output}",
        ) from None
    return output


def fetch_fixture(args: argparse.Namespace) -> Path:
    """Fetch the Ozon API response and write it to the fixtures directory.

    Args:
        args: Parsed command-line arguments.

    Returns:
        Path the fixture was written to.

    Raises:
        SystemExit: When credentials are missing, Client-Id or the body is
            invalid, or the request fails.
    """
    client_id, api_key = resolve_credentials(args)
    try:
        json.loads(args.body)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid --body JSON: {exc}") from None
    headers = {
        "Client-Id": str(client_id),
        "Api-Key": api_key,
        "Content-Type": "application/json",
    }
    url = args.base_url.rstrip("/") + args.path
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = client.request(
                args.method,
                url,
                headers=headers,
                content=args.body.encode(),
            )
    except httpx.HTTPError as exc:
        raise SystemExit(f"Request failed: {exc}") from None
    if response.status_code >= 400:
        raise SystemExit(f"API error {response.status_code}: {response.text}")
    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        raise SystemExit(f"API returned non-JSON response: {exc}") from None
    output = resolve_output_path(args.output, args.path)
    output.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
    )
    return output


def main() -> None:
    """Run the fixture fetch."""
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    args = parse_args()
    output = fetch_fixture(args)
    print(f"Saved fixture to {output}")


if __name__ == "__main__":
    main()
