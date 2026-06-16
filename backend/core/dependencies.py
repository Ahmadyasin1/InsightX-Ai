from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import UnauthorizedError
from core.security import decode_token
from db.models.user import User
from repositories.user_repository import UserRepository
from db.session import get_db


def _try_decode_supabase_jwt(token: str) -> Optional[dict]:
    """Decode a Supabase-issued JWT using the project JWT secret.
    Returns None if SUPABASE_JWT_SECRET is not configured or the token is not a Supabase JWT."""
    from config import settings
    if not settings.SUPABASE_JWT_SECRET:
        return None
    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
        return payload
    except Exception:
        return None


async def _get_or_create_supabase_user(payload: dict, db: AsyncSession) -> User:
    """Resolve a Supabase JWT to a local DB user.
    On first login, a shadow record is created — Supabase owns the credential."""
    email: str = payload.get("email", "")
    if not email:
        raise UnauthorizedError("Supabase JWT missing email claim")

    repo = UserRepository(db)
    user = await repo.get_by_email(email)

    if user is None:
        meta = payload.get("user_metadata") or {}
        full_name = (
            meta.get("full_name")
            or meta.get("name")
            or email.split("@")[0].replace(".", " ").title()
        )
        user = await repo.create(
            email=email,
            full_name=full_name,
            hashed_password="supabase-sso:no-local-password",
            organization=meta.get("organization"),
        )
        # Mark as verified — Supabase verified the email during signup
        user.is_verified = True
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")

    return user


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError()
    token = authorization.removeprefix("Bearer ")

    # Attempt Supabase JWT first (when SUPABASE_JWT_SECRET is set)
    supabase_payload = _try_decode_supabase_jwt(token)
    if supabase_payload is not None:
        return await _get_or_create_supabase_user(supabase_payload, db)

    # Fallback: local FastAPI JWT
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")
    user = await UserRepository(db).get_by_id(payload["sub"])
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    return user


async def resolve_user_from_bearer_token(token: str, db: AsyncSession) -> Optional[User]:
    """Resolve a User from a FastAPI or Supabase JWT (for WebSocket auth)."""
    if not token:
        return None

    supabase_payload = _try_decode_supabase_jwt(token)
    if supabase_payload is not None:
        return await _get_or_create_supabase_user(supabase_payload, db)

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None

    user = await UserRepository(db).get_by_id(payload["sub"])
    if not user or not user.is_active:
        return None
    return user
