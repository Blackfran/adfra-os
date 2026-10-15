from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.hoy import VistaHoyResponse
from app.services.vista_hoy import obtener_vista_hoy

router = APIRouter(prefix="/api", tags=["asistente"])


@router.get("/hoy", response_model=VistaHoyResponse)
def vista_hoy(
    fecha: date | None = Query(default=None, description="Fecha a consultar (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> VistaHoyResponse:
    return obtener_vista_hoy(db, fecha)
