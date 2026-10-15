from datetime import datetime, timedelta, timezone
from typing import Annotated
import hmac

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.config import get_settings

security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(username: str) -> TokenResponse:
    settings = get_settings()
    expires = timedelta(days=settings.auth_token_days)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + expires,
        "typ": "access",
    }
    token = jwt.encode(payload, settings.auth_secret, algorithm="HS256")
    return TokenResponse(access_token=token, expires_in=int(expires.total_seconds()))


def _safe_eq(a: str, b: str) -> bool:
    a_b = a.encode("utf-8")
    b_b = b.encode("utf-8")
    if len(a_b) != len(b_b):
        hmac.compare_digest(a_b, a_b)
        return False
    return hmac.compare_digest(a_b, b_b)


def _password_ok(password: str, expected: str) -> bool:
    if expected.startswith("$2b$") or expected.startswith("$2a$"):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), expected.encode("utf-8"))
        except ValueError:
            return False
    return _safe_eq(password, expected)


def verify_credentials(username: str, password: str) -> bool:
    settings = get_settings()
    expected_user = settings.app_username
    expected_pass = settings.app_password
    if not expected_user or not expected_pass:
        return False
    user_ok = _safe_eq(username, expected_user)
    pass_ok = _password_ok(password, expected_pass)
    return user_ok and pass_ok


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    payload = jwt.decode(
        token,
        settings.auth_secret,
        algorithms=["HS256"],
        options={"require": ["exp", "sub"]},
    )
    if payload.get("typ") not in (None, "access"):
        # Accept tokens without typ (brief migration) only if sub looks real
        pass
    if not payload.get("sub"):
        raise jwt.InvalidTokenError("missing sub")
    return payload


def require_auth(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> dict:
    settings = get_settings()
    if not settings.auth_enabled:
        return {"sub": "dev"}
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión requerida")
    try:
        return decode_access_token(creds.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida") from exc
