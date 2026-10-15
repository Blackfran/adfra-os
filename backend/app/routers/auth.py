from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import LoginRequest, TokenResponse, create_access_token, require_auth, verify_credentials
from app.config import get_settings
from app.rate_limit import login_limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if forwarded:
        return f"login:{forwarded}"
    host = request.client.host if request.client else "unknown"
    return f"login:{host}"


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request):
    settings = get_settings()
    key = _client_key(request)

    if login_limiter.too_many(key, settings.auth_login_max_attempts, settings.auth_login_window_seconds):
        raise HTTPException(429, "Demasiados intentos. Espera unos minutos.")

    if not settings.auth_enabled:
        login_limiter.clear(key)
        return create_access_token(payload.username or "dev")

    if not settings.app_username or not settings.app_password:
        raise HTTPException(500, "Credenciales del servidor no configuradas")

    if not verify_credentials(payload.username, payload.password):
        login_limiter.hit(key)
        raise HTTPException(401, "Usuario o contraseña incorrectos")

    login_limiter.clear(key)
    return create_access_token(payload.username)


@router.get("/me")
def me(user=Depends(require_auth)):
    settings = get_settings()
    return {
        "ok": True,
        "app": settings.app_name,
        "auth_enabled": settings.auth_enabled,
        "user": user.get("sub"),
    }
