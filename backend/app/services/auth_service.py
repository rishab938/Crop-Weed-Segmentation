"""Authentication service — register, login, refresh, password reset."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    hash_password, verify_password,
)
from app.models.models import PasswordResetToken, RefreshToken, User, UserSettings
from app.schemas.schemas import (
    LoginRequest, RegisterRequest, TokenResponse,
)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


class AuthService:

    async def register(self, db: AsyncSession, req: RegisterRequest) -> tuple[User, TokenResponse]:
        # Check email uniqueness
        existing = await db.scalar(select(User).where(User.email == req.email))
        if existing:
            raise ValueError("email_taken")

        user = User(
            name=req.name.strip(),
            email=req.email.lower(),
            hashed_password=hash_password(req.password),
            role="agronomist",
        )
        db.add(user)
        await db.flush()

        # Create default settings
        db.add(UserSettings(user_id=user.id))
        await db.flush()

        tokens = await self._issue_tokens(db, user)
        logger.info("Registered new user %s", user.email)
        return user, tokens

    async def login(self, db: AsyncSession, req: LoginRequest) -> tuple[User, TokenResponse]:
        user = await db.scalar(select(User).where(User.email == req.email.lower()))
        if not user or not verify_password(req.password, user.hashed_password):
            raise ValueError("invalid_credentials")
        if not user.is_active:
            raise ValueError("account_inactive")

        tokens = await self._issue_tokens(db, user)
        logger.info("Login: %s", user.email)
        return user, tokens

    async def refresh(self, db: AsyncSession, raw_token: str) -> TokenResponse:
        try:
            payload = decode_token(raw_token)
        except Exception:
            raise ValueError("invalid_token")

        if payload.get("type") != "refresh":
            raise ValueError("invalid_token")

        token_hash = _hash(raw_token)
        rt = await db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked.is_(False),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        if not rt:
            raise ValueError("invalid_token")

        # Rotate: revoke old, issue new
        rt.revoked = True
        user = await db.get(User, rt.user_id)
        if not user or not user.is_active:
            raise ValueError("account_inactive")

        return await self._issue_tokens(db, user)

    async def logout(self, db: AsyncSession, raw_token: str) -> None:
        token_hash = _hash(raw_token)
        rt = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        if rt:
            rt.revoked = True

    async def forgot_password(self, db: AsyncSession, email: str) -> Optional[str]:
        """Returns plain reset token (only for development logging — NEVER expose in prod response)."""
        user = await db.scalar(select(User).where(User.email == email.lower()))
        if not user:
            return None  # Silent — don't reveal whether email exists

        plain_token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        prt = PasswordResetToken(
            user_id=user.id,
            token_hash=_hash(plain_token),
            expires_at=expires,
        )
        db.add(prt)
        logger.info(
            "Password reset token created for %s (dev: %s)", email,
            plain_token if settings.app_env == "development" else "[hidden]"
        )
        return plain_token

    async def reset_password(self, db: AsyncSession, token: str, new_password: str) -> None:
        prt = await db.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == _hash(token),
                PasswordResetToken.used.is_(False),
                PasswordResetToken.expires_at > datetime.now(timezone.utc),
            )
        )
        if not prt:
            raise ValueError("invalid_or_expired_token")

        user = await db.get(User, prt.user_id)
        if not user:
            raise ValueError("invalid_or_expired_token")

        user.hashed_password = hash_password(new_password)
        prt.used = True

    # ─── Internal ────────────────────────────────────────────────────────────

    async def _issue_tokens(self, db: AsyncSession, user: User) -> TokenResponse:
        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))

        expires = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        rt = RefreshToken(user_id=user.id, token_hash=_hash(refresh), expires_at=expires)
        db.add(rt)
        return TokenResponse(access_token=access, refresh_token=refresh)


auth_service = AuthService()
