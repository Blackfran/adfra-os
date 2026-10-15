from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BitacoraNota
from app.schemas.common import NotaCreate, NotaOut, NotaUpdate

router = APIRouter(prefix="/api/bitacora", tags=["bitacora"])


@router.get("", response_model=list[NotaOut])
def listar(
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(BitacoraNota).order_by(BitacoraNota.fijado.desc(), BitacoraNota.creado_el.desc())
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                BitacoraNota.titulo.ilike(like),
                BitacoraNota.contenido.ilike(like),
                BitacoraNota.etiquetas.ilike(like),
            )
        )
    return list(db.scalars(stmt).all())


@router.post("", response_model=NotaOut, status_code=201)
def crear(payload: NotaCreate, db: Session = Depends(get_db)):
    if payload.uuid_sync:
        existing = db.scalar(
            select(BitacoraNota).where(BitacoraNota.uuid_sync == payload.uuid_sync)
        )
        if existing:
            return existing
    row = BitacoraNota(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{nota_id}", response_model=NotaOut)
def actualizar(nota_id: int, payload: NotaUpdate, db: Session = Depends(get_db)):
    row = db.get(BitacoraNota, nota_id)
    if not row:
        raise HTTPException(404, "Nota no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{nota_id}", status_code=204)
def eliminar(nota_id: int, db: Session = Depends(get_db)):
    row = db.get(BitacoraNota, nota_id)
    if not row:
        raise HTTPException(404, "Nota no encontrada")
    db.delete(row)
    db.commit()
