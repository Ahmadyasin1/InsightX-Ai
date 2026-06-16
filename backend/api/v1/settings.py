from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.dependencies import get_current_active_user
from db.session import get_db
from db.models.user import User
from repositories.user_repository import UserRepository
from schemas.auth import UserResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/profile", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=user.id, email=user.email, full_name=user.full_name,
        avatar_url=user.avatar_url, organization=user.organization,
        role=user.role, is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    repo = UserRepository(db)
    updates = body.model_dump(exclude_none=True)
    updated = await repo.update(user, **updates)
    return UserResponse(
        id=updated.id, email=updated.email, full_name=updated.full_name,
        avatar_url=updated.avatar_url, organization=updated.organization,
        role=updated.role, is_active=updated.is_active,
        created_at=updated.created_at.isoformat(),
    )


@router.post("/change-password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    from core.security import verify_password, hash_password
    from core.exceptions import UnauthorizedError
    if not verify_password(body.current_password, user.hashed_password):
        raise UnauthorizedError("Current password is incorrect")
    await UserRepository(db).update(user, hashed_password=hash_password(body.new_password))
