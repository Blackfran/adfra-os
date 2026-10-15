from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PresupuestoMensual
from app.schemas.ops import PresupuestoCreate, PresupuestoOut
from app.services.ops import listar_presupuestos

router = APIRouter(prefix="/api/presupuestos", tags=["presupuestos"])


@router.get("", response_model=list[PresupuestoOut])
def listar(
    anio: int | None = None,
    mes: int | None = None,
    db: Session = Depends(get_db),
):
    hoy = date.today()
    return listar_presupuestos(db, anio or hoy.year, mes or hoy.month)


@router.post("", response_model=PresupuestoOut, status_code=201)
def crear(payload: PresupuestoCreate, db: Session = Depends(get_db)):
    existing = db.scalar(
        select(PresupuestoMensual).where(
            PresupuestoMensual.anio == payload.anio,
            PresupuestoMensual.mes == payload.mes,
            PresupuestoMensual.categoria_id == payload.categoria_id,
        )
    )
    if existing:
        existing.limite = payload.limite
        existing.moneda_id = payload.moneda_id
        db.commit()
    else:
        row = PresupuestoMensual(**payload.model_dump())
        db.add(row)
        db.commit()
    items = listar_presupuestos(db, payload.anio, payload.mes)
    match = next((i for i in items if i.categoria_id == payload.categoria_id), None)
    if not match:
        raise HTTPException(500, "No se pudo crear presupuesto")
    return match


@router.delete("/{item_id}", status_code=204)
def eliminar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(PresupuestoMensual, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    db.delete(row)
    db.commit()
