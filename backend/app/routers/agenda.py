from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AgendaEvento
from app.schemas.common import AgendaCreate, AgendaOut, AgendaUpdate

router = APIRouter(prefix="/api/agenda", tags=["agenda"])


@router.get("", response_model=list[AgendaOut])
def listar(
    fecha: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = select(AgendaEvento).order_by(AgendaEvento.fecha_inicio)
    if fecha:
        start = datetime.combine(fecha, time.min)
        end = datetime.combine(fecha, time.max)
        q = q.where(AgendaEvento.fecha_inicio >= start, AgendaEvento.fecha_inicio <= end)
    return list(db.scalars(q).all())


@router.post("", response_model=AgendaOut, status_code=201)
def crear(payload: AgendaCreate, db: Session = Depends(get_db)):
    row = AgendaEvento(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{evento_id}", response_model=AgendaOut)
def actualizar(evento_id: int, payload: AgendaUpdate, db: Session = Depends(get_db)):
    row = db.get(AgendaEvento, evento_id)
    if not row:
        raise HTTPException(404, "Evento no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.post("/{evento_id}/snooze", response_model=AgendaOut)
def snooze(
    evento_id: int,
    minutos: int = Query(default=15, description="15, 30 o 60"),
    db: Session = Depends(get_db),
):
    from datetime import timedelta

    if minutos not in (15, 30, 60):
        raise HTTPException(400, "Intervalo inválido (15, 30, 60)")
    row = db.get(AgendaEvento, evento_id)
    if not row:
        raise HTTPException(404, "Evento no encontrado")
    row.fecha_inicio = row.fecha_inicio + timedelta(minutes=minutos)
    if row.fecha_fin:
        row.fecha_fin = row.fecha_fin + timedelta(minutes=minutos)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{evento_id}", status_code=204)
def eliminar(evento_id: int, db: Session = Depends(get_db)):
    row = db.get(AgendaEvento, evento_id)
    if not row:
        raise HTTPException(404, "Evento no encontrado")
    db.delete(row)
    db.commit()
