from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ops import ReporteMensual
from app.services.reportes import reporte_mensual

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/mensual", response_model=ReporteMensual)
def mensual(
    anio: int | None = Query(default=None),
    mes: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    hoy = date.today()
    return reporte_mensual(db, anio or hoy.year, mes or hoy.month)
