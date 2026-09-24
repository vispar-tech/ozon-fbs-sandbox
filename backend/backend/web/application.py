from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles

from backend.log import configure_logging
from backend.web.api.router import api_router, root_router
from backend.web.errors import PrettyJSONResponse, register_exception_handlers
from backend.web.lifespan import lifespan_setup
from backend.web.middleware import RequireJsonMiddleware

APP_ROOT = Path(__file__).parent.parent


def get_app() -> FastAPI:
    """
    Get FastAPI application.

    This is the main constructor of an application.

    Returns:
        Application.
    """
    configure_logging()
    app = FastAPI(
        title="backend",
        lifespan=lifespan_setup,
        docs_url=None,
        redoc_url=None,
        openapi_url="/api/openapi.json",
        default_response_class=PrettyJSONResponse,
    )
    register_exception_handlers(app)
    app.add_middleware(RequireJsonMiddleware)

    # Main router for the API.
    app.include_router(router=api_router, prefix="/api")
    # Ozon seller routes (/v1/*) are served at the app root.
    app.include_router(router=root_router)
    # Adds static directory.
    # This directory is used to access swagger files.
    app.mount("/static", StaticFiles(directory=APP_ROOT / "static"), name="static")

    def _custom_openapi() -> dict[str, Any]:
        """Build the OpenAPI schema without the default 422 response.

        Body validation errors are reported as 400/3 by the global
        RequestValidationError handler, so the auto-generated 422
        response would be misleading.
        """
        if app.openapi_schema is not None:
            return app.openapi_schema
        schema = get_openapi(
            title=app.title,
            version=app.version,
            openapi_version=app.openapi_version,
            description=app.description,
            routes=app.routes,
        )
        for path in schema["paths"].values():
            for operation in path.values():
                operation.get("responses", {}).pop("422", None)
        app.openapi_schema = schema
        return schema

    app.openapi = _custom_openapi  # type: ignore[method-assign]

    return app
