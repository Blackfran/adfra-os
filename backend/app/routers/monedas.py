from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Moneda
from app.schemas.ops import MonedaOut, MonedaUpdate

router = APIRouter(prefix="/api/monedas", tags=["monedas"])


@router.get("", response_model=list[MonedaOut])
def listar(db: Session = Depends(get_db)):
    return list(db.scalars(select(Moneda).order_by(Moneda.id)).all())


@router.patch("/{moneda_id}", response_model=MonedaOut)
def actualizar_tasa(moneda_id: str, payload: MonedaUpdate, db: Session = Depends(get_db)):
    row = db.get(Moneda, moneda_id.upper())
    if not row:
        raise HTTPException(404, "Moneda no encontrada")
    row.tasa_referencia = payload.tasa_referencia
    row.actualizado_el = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row
