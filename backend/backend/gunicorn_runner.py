from typing import Any

from gunicorn.app.base import BaseApplication
from gunicorn.util import import_app
from uvicorn.workers import UvicornWorker as BaseUvicornWorker

try:
    import uvloop
except ImportError:
    uvloop = None  # type: ignore


class UvicornWorker(BaseUvicornWorker):
    """Uvicorn worker with class-wide config gunicorn can't pass through."""

    CONFIG_KWARGS: dict[str, Any] = {  # typing: ignore  # noqa: RUF012
        "loop": "uvloop" if uvloop is not None else "asyncio",
        "http": "httptools",
        "lifespan": "on",
        "factory": True,
        "proxy_headers": False,
    }


class GunicornApplication(BaseApplication):
    """Gunicorn application that runs the app with custom uvicorn workers."""

    def __init__(
        self,
        app: str,
        host: str,
        port: int,
        workers: int,
        **kwargs: Any,
    ) -> None:
        """Record the run settings gunicorn's ``load_config`` applies."""
        self.options = {
            "bind": f"{host}:{port}",
            "workers": workers,
            "worker_class": "backend.gunicorn_runner.UvicornWorker",
            **kwargs,
        }
        self.app = app
        super().__init__()

    def load_config(self) -> None:
        """Pass the known options to gunicorn (unknown settings would crash it)."""
        for key, value in self.options.items():
            if key in self.cfg.settings and value is not None:
                self.cfg.set(key.lower(), value)

    def load(self) -> str:
        """Return the python path of the app factory, which gunicorn loads.

        Returns:
            Python path to the app factory.
        """
        return import_app(self.app)
