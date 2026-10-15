from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CategoriaFinanciera
from app.schemas.common import CategoriaOut, DesgloseCategoria
from app.schemas.finance import FlujoCajaResponse, TransaccionCreate, TransaccionResponse
from app.services.finance import (
    calcular_flujo_caja,
    desglose_gastos,
    listar_transacciones,
    registrar_transaccion,
)

router = APIRouter(prefix="/api", tags=["finanzas"])


@router.get("/transacciones", response_model=list[TransaccionResponse])
def listar(
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    tipo: str | None = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    rows = listar_transacciones(db, fecha_inicio, fecha_fin, tipo, limit)
    return [TransaccionResponse.model_validate(r) for r in rows]


@router.post("/transacciones", response_model=TransaccionResponse)
def crear_transaccion(
    payload: TransaccionCreate,
    db: Session = Depends(get_db),
) -> TransaccionResponse:
    return registrar_transaccion(db, payload)


@router.get("/flujo-caja", response_model=FlujoCajaResponse)
def flujo_caja(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    moneda_consolidada: str = Query(default="USD"),
    db: Session = Depends(get_db),
) -> FlujoCajaResponse:
    return calcular_flujo_caja(db, fecha_inicio, fecha_fin, moneda_consolidada)


@router.get("/desglose-gastos", response_model=list[DesgloseCategoria])
def gastos_por_categoria(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
):
    return desglose_gastos(db, fecha_inicio, fecha_fin)


@router.get("/categorias", response_model=list[CategoriaOut])
def categorias(db: Session = Depends(get_db)):
    return list(db.scalars(select(CategoriaFinanciera).order_by(CategoriaFinanciera.nombre)).all())
