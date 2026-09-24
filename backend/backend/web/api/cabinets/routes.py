"""CRUD routes for cabinets (mounted under ``/api``)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, status

from backend.db.models.cabinet import Cabinet
from backend.schemas.cabinets import (
    CabinetSummary,
    CreateCabinetInput,
    UpdateCabinetInput,
)
from backend.services.cabinets import CabinetService
from backend.web.api.deps import get_cabinet_service
from backend.web.errors import (
    ADMIN_ERROR_RESPONSES,
    INVALID_REQUEST_BODY_ERROR,
    OzonHttpError,
)

CabinetServiceDep = Annotated[CabinetService, Depends(get_cabinet_service)]

router = APIRouter(prefix="/cabinets", tags=["cabinets"])


@router.get("", response_model=list[CabinetSummary], responses=ADMIN_ERROR_RESPONSES)
async def list_cabinets(service: CabinetServiceDep) -> list[Cabinet]:
    """
    List all cabinets.

    Args:
        service: cabinet service.

    Returns:
        List of cabinet summaries.
    """
    return await service.list()


@router.post(
    "",
    response_model=CabinetSummary,
    status_code=status.HTTP_201_CREATED,
    responses=ADMIN_ERROR_RESPONSES,
)
async def create_cabinet(
    body: CreateCabinetInput, service: CabinetServiceDep
) -> Cabinet:
    """
    Create a cabinet, optionally filled with the demo fixture set.

    Args:
        body: create payload.
        service: cabinet service.

    Returns:
        Created cabinet.
    """
    return await service.create(body.name, demo=body.demo)


@router.get(
    "/{client_id}", response_model=CabinetSummary, responses=ADMIN_ERROR_RESPONSES
)
async def get_cabinet(
    client_id: Annotated[int, Path(gt=0)], service: CabinetServiceDep
) -> Cabinet:
    """
    Get a cabinet by client id.

    Args:
        client_id: cabinet client id (positive integer).
        service: cabinet service.

    Returns:
        The cabinet.
    """
    return await service.get_by_id(client_id)


@router.patch(
    "/{client_id}", response_model=CabinetSummary, responses=ADMIN_ERROR_RESPONSES
)
async def update_cabinet(
    client_id: Annotated[int, Path(gt=0)],
    body: UpdateCabinetInput,
    service: CabinetServiceDep,
) -> Cabinet:
    """
    Update name, seller info and/or roles of a cabinet.

    Existence is checked before the "at least one field" rule, so a
    missing cabinet answers 404/5 and an empty body on an existing
    cabinet answers 400/3.

    Args:
        client_id: cabinet client id (positive integer).
        body: unified patch payload.
        service: cabinet service.

    Returns:
        Updated cabinet.

    Raises:
        OzonHttpError: when the body has no fields set.
    """
    cabinet = await service.get_by_id(client_id)
    if body.model_dump(exclude_unset=True, exclude_none=True) == {}:
        raise OzonHttpError(400, INVALID_REQUEST_BODY_ERROR)
    return await service.update(
        cabinet,
        name=body.name,
        seller_info=body.seller_info,
        roles=body.roles,
    )


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ADMIN_ERROR_RESPONSES,
)
async def delete_cabinet(
    client_id: Annotated[int, Path(gt=0)], service: CabinetServiceDep
) -> None:
    """
    Delete a cabinet by client id.

    Args:
        client_id: cabinet client id (positive integer).
        service: cabinet service.
    """
    await service.delete(client_id)
