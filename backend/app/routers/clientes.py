from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cliente
from app.schemas.common import ClienteCreate, ClienteOut, ClienteUpdate

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteOut])
def listar(db: Session = Depends(get_db)):
    return list(db.scalars(select(Cliente).order_by(Cliente.nombre)).all())


@router.post("", response_model=ClienteOut, status_code=201)
def crear(payload: ClienteCreate, db: Session = Depends(get_db)):
    row = Cliente(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener(cliente_id: int, db: Session = Depends(get_db)):
    row = db.get(Cliente, cliente_id)
    if not row:
        raise HTTPException(404, "Cliente no encontrado")
    return row


@router.patch("/{cliente_id}", response_model=ClienteOut)
def actualizar(cliente_id: int, payload: ClienteUpdate, db: Session = Depends(get_db)):
    row = db.get(Cliente, cliente_id)
    if not row:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{cliente_id}", status_code=204)
def eliminar(cliente_id: int, db: Session = Depends(get_db)):
    row = db.get(Cliente, cliente_id)
    if not row:
        raise HTTPException(404, "Cliente no encontrado")
    db.delete(row)
    db.commit()
