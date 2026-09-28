from fastapi.routing import APIRouter

from backend.web.api import cabinets, coverage, docs, monitoring, products, seller

api_router = APIRouter()
api_router.include_router(monitoring.router)
api_router.include_router(docs.router)
api_router.include_router(cabinets.router)
api_router.include_router(coverage.router)

# seller routes follow the Ozon paths (/v1/*, /v3/*, /v4/*) and live outside
# the /api prefix
root_router = APIRouter()
root_router.include_router(seller.router)
root_router.include_router(products.router)
