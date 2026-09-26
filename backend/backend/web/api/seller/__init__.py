"""Seller (Ozon contract) routes."""

from backend.web.api.seller.products import products_router
from backend.web.api.seller.routes import router

__all__ = ["products_router", "router"]
