import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_current_active_user
from core.exceptions import NotFoundError
from db.session import get_db
from db.models.user import User
from repositories.investigation_repository import InvestigationRepository
from schemas.investigation import (
    CreateInvestigationRequest, UpdateInvestigationRequest,
    InvestigationResponse, PaginatedResponse
)

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post("", response_model=InvestigationResponse, status_code=201)
async def create_investigation(
    body: CreateInvestigationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = InvestigationRepository(db)
    inv = await repo.create(
        user_id=user.id,
        title=body.title,
        description=body.description,
        priority=body.priority.value,
        tags=body.tags,
    )
    return inv


@router.get("", response_model=PaginatedResponse)
async def list_investigations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = InvestigationRepository(db)
    items, total = await repo.list_by_user(user.id, page, page_size)
    return PaginatedResponse(
        items=[InvestigationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = InvestigationRepository(db)
    inv = await repo.get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    return inv


@router.patch("/{investigation_id}", response_model=InvestigationResponse)
async def update_investigation(
    investigation_id: str,
    body: UpdateInvestigationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = InvestigationRepository(db)
    inv = await repo.get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    # model_dump() already returns plain string values for str enums in Pydantic v2
    updates = body.model_dump(exclude_none=True)
    return await repo.update(inv, **updates)


@router.delete("/{investigation_id}", status_code=204)
async def delete_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = InvestigationRepository(db)
    inv = await repo.get_by_id(investigation_id, user.id)
    if not inv:
        raise NotFoundError("Investigation", investigation_id)
    await repo.delete(inv)
