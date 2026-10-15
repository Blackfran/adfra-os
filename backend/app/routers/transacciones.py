from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.finance import FlujoCajaResponse, TransaccionCreate, TransaccionResponse
from app.services.finance import calcular_flujo_caja, registrar_transaccion

router = APIRouter(prefix="/api", tags=["finanzas"])


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
