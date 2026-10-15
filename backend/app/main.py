from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import entities  # noqa: F401 — register models
from app.routers import hoy, sync, transacciones
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    description="Personal ERP & Operating System — API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hoy.router)
app.include_router(transacciones.router)
app.include_router(sync.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "version": "1.1.0"}
