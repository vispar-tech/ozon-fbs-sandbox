from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> None:
    """Answer 200 when the service is healthy."""
