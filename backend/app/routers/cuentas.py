from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cuenta
from app.schemas.ops import AjusteSaldo, CuentaCreate, CuentaOut, CuentaUpdate
from app.services.ops import cuenta_to_out

router = APIRouter(prefix="/api/cuentas", tags=["cuentas"])


@router.get("", response_model=list[CuentaOut])
def listar(db: Session = Depends(get_db)):
    rows = db.scalars(select(Cuenta).order_by(Cuenta.nombre)).all()
    return [cuenta_to_out(db, c) for c in rows]


@router.post("", response_model=CuentaOut, status_code=201)
def crear(payload: CuentaCreate, db: Session = Depends(get_db)):
    row = Cuenta(**payload.model_dump(), activa=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return cuenta_to_out(db, row)


@router.patch("/{cuenta_id}", response_model=CuentaOut)
def actualizar(cuenta_id: int, payload: CuentaUpdate, db: Session = Depends(get_db)):
    row = db.get(Cuenta, cuenta_id)
    if not row:
        raise HTTPException(404, "Cuenta no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return cuenta_to_out(db, row)


@router.post("/{cuenta_id}/ajustar", response_model=CuentaOut)
def ajustar(cuenta_id: int, payload: AjusteSaldo, db: Session = Depends(get_db)):
    row = db.get(Cuenta, cuenta_id)
    if not row:
        raise HTTPException(404, "Cuenta no encontrada")
    row.saldo = payload.saldo
    if payload.nota:
        row.notas = ((row.notas or "") + f"\nAjuste: {payload.nota}").strip()
    db.commit()
    db.refresh(row)
    return cuenta_to_out(db, row)


@router.delete("/{cuenta_id}", status_code=204)
def eliminar(cuenta_id: int, db: Session = Depends(get_db)):
    row = db.get(Cuenta, cuenta_id)
    if not row:
        raise HTTPException(404, "Cuenta no encontrada")
    db.delete(row)
    db.commit()
