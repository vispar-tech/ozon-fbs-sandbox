from fastapi.routing import APIRouter

from backend.web.api import cabinets, docs, monitoring, seller

api_router = APIRouter()
api_router.include_router(monitoring.router)
api_router.include_router(docs.router)
api_router.include_router(cabinets.router)

# seller routes follow the Ozon paths (/v1/*) and live outside the /api prefix
root_router = APIRouter()
root_router.include_router(seller.router)
