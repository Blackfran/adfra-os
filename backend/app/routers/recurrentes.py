from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GastoRecurrente
from app.schemas.ops import RecurrenteCreate, RecurrenteOut, RecurrenteUpdate
from app.services.ops import next_billing_date, pagar_recurrente, recurrente_to_out

router = APIRouter(prefix="/api/recurrentes", tags=["recurrentes"])


@router.get("", response_model=list[RecurrenteOut])
def listar(db: Session = Depends(get_db)):
    rows = db.scalars(select(GastoRecurrente).order_by(GastoRecurrente.dia_cobro)).all()
    out = []
    dirty = False
    for r in rows:
        if r.activo and not r.proximo_pago:
            r.proximo_pago = next_billing_date(r.dia_cobro)
            dirty = True
        out.append(recurrente_to_out(r))
    if dirty:
        db.commit()
    return out


@router.post("", response_model=RecurrenteOut, status_code=201)
def crear(payload: RecurrenteCreate, db: Session = Depends(get_db)):
    row = GastoRecurrente(
        **payload.model_dump(),
        activo=True,
        proximo_pago=next_billing_date(payload.dia_cobro),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return recurrente_to_out(row)


@router.patch("/{item_id}", response_model=RecurrenteOut)
def actualizar(item_id: int, payload: RecurrenteUpdate, db: Session = Depends(get_db)):
    row = db.get(GastoRecurrente, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    if "dia_cobro" in data:
        row.proximo_pago = next_billing_date(row.dia_cobro)
    db.commit()
    db.refresh(row)
    return recurrente_to_out(row)


@router.post("/{item_id}/pagar")
def pagar(
    item_id: int,
    cuenta_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    try:
        return pagar_recurrente(db, item_id, cuenta_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.delete("/{item_id}", status_code=204)
def eliminar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(GastoRecurrente, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    db.delete(row)
    db.commit()
