from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.auth import decode_access_token
from app.config import get_settings, validate_security_settings
from app.database import Base, SessionLocal, engine
from app.migrate import ensure_schema_patches
from app.models import entities  # noqa: F401
from app.routers import (
    agenda,
    auth,
    bitacora,
    clientes,
    cuentas,
    hoy,
    ingresos_fijos,
    monedas,
    presupuestos,
    proyectos,
    recurrentes,
    reportes,
    search,
    sync,
    telegram,
    transacciones,
    whatsapp,
    wishlist,
)
from app.seed import seed_extras_if_missing, seed_if_empty
import jwt

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
PUBLIC_API = {"/api/health", "/api/auth/login", "/api/telegram/webhook"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_settings.cache_clear()
    settings = get_settings()
    validate_security_settings(settings)
    Base.metadata.create_all(bind=engine)
    ensure_schema_patches()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_extras_if_missing(db)
    finally:
        db.close()
    yield


settings = get_settings()
docs_enabled = not settings.auth_enabled

app = FastAPI(
    title=settings.app_name,
    version="1.2.1",
    description="AdFra Ges — API de gestión personal",
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def _apply_security_headers(response, *, api_path: bool):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if api_path:
        response.headers["Cache-Control"] = "no-store"
    return response


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    api_path = request.url.path.startswith("/api/")

    if request.method == "OPTIONS":
        return _apply_security_headers(await call_next(request), api_path=api_path)

    path = request.url.path
    if not api_path or path in PUBLIC_API:
        return _apply_security_headers(await call_next(request), api_path=api_path)

    cfg = get_settings()
    if not cfg.auth_enabled:
        return _apply_security_headers(await call_next(request), api_path=api_path)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return _apply_security_headers(
            JSONResponse({"detail": "Sesión requerida"}, status_code=401),
            api_path=True,
        )
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        decode_access_token(token)
    except jwt.PyJWTError:
        return _apply_security_headers(
            JSONResponse({"detail": "Sesión inválida o expirada"}, status_code=401),
            api_path=True,
        )
    return _apply_security_headers(await call_next(request), api_path=api_path)


app.include_router(auth.router)
app.include_router(hoy.router)
app.include_router(transacciones.router)
app.include_router(sync.router)
app.include_router(clientes.router)
app.include_router(proyectos.router)
app.include_router(wishlist.router)
app.include_router(agenda.router)
app.include_router(bitacora.router)
app.include_router(search.router)
app.include_router(cuentas.router)
app.include_router(recurrentes.router)
app.include_router(ingresos_fijos.router)
app.include_router(presupuestos.router)
app.include_router(monedas.router)
app.include_router(reportes.router)
app.include_router(telegram.router)
app.include_router(whatsapp.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": get_settings().app_name,
        "version": "1.2.1",
    }


def _safe_spa_file(full_path: str) -> Path | None:
    root = FRONTEND_DIST.resolve()
    candidate = (FRONTEND_DIST / full_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    if candidate.is_file():
        return candidate
    return None


if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def spa_index():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api") or full_path in {"docs", "redoc", "openapi.json"}:
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        safe = _safe_spa_file(full_path)
        if safe is not None:
            return FileResponse(safe)
        return FileResponse(FRONTEND_DIST / "index.html")
