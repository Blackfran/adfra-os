from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import IngresoRecurrente
from app.schemas.finance import TransaccionCreate
from app.schemas.ops import IngresoFijoCreate, IngresoFijoOut, IngresoFijoUpdate
from app.services.finance import registrar_transaccion
from app.services.ops import next_billing_date

router = APIRouter(prefix="/api/ingresos-fijos", tags=["ingresos-fijos"])


def _out(r: IngresoRecurrente) -> IngresoFijoOut:
    prox = r.proximo_cobro or next_billing_date(r.dia_cobro)
    return IngresoFijoOut(
        id=r.id,
        nombre=r.nombre,
        monto=r.monto,
        moneda_id=r.moneda_id,
        categoria_id=r.categoria_id,
        dia_cobro=r.dia_cobro,
        activo=r.activo,
        proximo_cobro=prox,
        notas=r.notas,
        dias_restantes=(prox - date.today()).days,
    )


@router.get("", response_model=list[IngresoFijoOut])
def listar(db: Session = Depends(get_db)):
    rows = db.scalars(select(IngresoRecurrente).order_by(IngresoRecurrente.dia_cobro)).all()
    dirty = False
    out = []
    for r in rows:
        if r.activo and not r.proximo_cobro:
            r.proximo_cobro = next_billing_date(r.dia_cobro)
            dirty = True
        out.append(_out(r))
    if dirty:
        db.commit()
    return out


@router.post("", response_model=IngresoFijoOut, status_code=201)
def crear(payload: IngresoFijoCreate, db: Session = Depends(get_db)):
    row = IngresoRecurrente(
        **payload.model_dump(),
        activo=True,
        proximo_cobro=next_billing_date(payload.dia_cobro),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.patch("/{item_id}", response_model=IngresoFijoOut)
def actualizar(item_id: int, payload: IngresoFijoUpdate, db: Session = Depends(get_db)):
    row = db.get(IngresoRecurrente, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    if "dia_cobro" in data:
        row.proximo_cobro = next_billing_date(row.dia_cobro)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.post("/{item_id}/cobrar")
def cobrar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(IngresoRecurrente, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    tx = registrar_transaccion(
        db,
        TransaccionCreate(
            tipo="ingreso",
            categoria_id=row.categoria_id,
            monto=row.monto,
            moneda_id=row.moneda_id,
            nota=f"Ingreso fijo: {row.nombre}",
            fecha_transaccion=date.today(),
            metodo_pago="Ingreso fijo",
        ),
    )
    row.proximo_cobro = next_billing_date(row.dia_cobro, date.today() + timedelta(days=1))
    db.commit()
    db.refresh(row)
    return {"transaccion_id": tx.id, "ingreso": _out(row)}


@router.delete("/{item_id}", status_code=204)
def eliminar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(IngresoRecurrente, item_id)
    if not row:
        raise HTTPException(404, "No encontrado")
    db.delete(row)
    db.commit()
