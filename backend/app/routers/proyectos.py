from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Cliente, CobroHito, Proyecto
from app.schemas.common import (
    HitoCreate,
    HitoOut,
    HitoUpdate,
    LiquidarHitoRequest,
    LiquidarHitoResponse,
    ProyectoCreate,
    ProyectoOut,
    ProyectoUpdate,
)
from app.services.proyectos import liquidar_hito_cobro, marcar_hitos_vencidos, proyecto_to_out

router = APIRouter(prefix="/api", tags=["proyectos"])


@router.get("/proyectos", response_model=list[ProyectoOut])
def listar_proyectos(
    estado: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    marcar_hitos_vencidos(db)
    q = select(Proyecto, Cliente.nombre).outerjoin(Cliente, Cliente.id == Proyecto.cliente_id)
    if estado:
        q = q.where(Proyecto.estado == estado)
    q = q.order_by(Proyecto.creado_el.desc())
    return [proyecto_to_out(db, p, nombre) for p, nombre in db.execute(q).all()]


@router.post("/proyectos", response_model=ProyectoOut, status_code=201)
def crear_proyecto(payload: ProyectoCreate, db: Session = Depends(get_db)):
    row = Proyecto(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    nombre = None
    if row.cliente_id:
        c = db.get(Cliente, row.cliente_id)
        nombre = c.nombre if c else None
    return proyecto_to_out(db, row, nombre)


@router.get("/proyectos/{proyecto_id}", response_model=ProyectoOut)
def obtener_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    row = db.get(Proyecto, proyecto_id)
    if not row:
        raise HTTPException(404, "Proyecto no encontrado")
    nombre = None
    if row.cliente_id:
        c = db.get(Cliente, row.cliente_id)
        nombre = c.nombre if c else None
    return proyecto_to_out(db, row, nombre)


@router.patch("/proyectos/{proyecto_id}", response_model=ProyectoOut)
def actualizar_proyecto(
    proyecto_id: int,
    payload: ProyectoUpdate,
    db: Session = Depends(get_db),
):
    row = db.get(Proyecto, proyecto_id)
    if not row:
        raise HTTPException(404, "Proyecto no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    nombre = None
    if row.cliente_id:
        c = db.get(Cliente, row.cliente_id)
        nombre = c.nombre if c else None
    return proyecto_to_out(db, row, nombre)


@router.delete("/proyectos/{proyecto_id}", status_code=204)
def eliminar_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    row = db.get(Proyecto, proyecto_id)
    if not row:
        raise HTTPException(404, "Proyecto no encontrado")
    hitos = db.scalars(select(CobroHito).where(CobroHito.proyecto_id == proyecto_id)).all()
    for h in hitos:
        db.delete(h)
    db.delete(row)
    db.commit()


@router.get("/proyectos/{proyecto_id}/hitos", response_model=list[HitoOut])
def listar_hitos(proyecto_id: int, db: Session = Depends(get_db)):
    if not db.get(Proyecto, proyecto_id):
        raise HTTPException(404, "Proyecto no encontrado")
    marcar_hitos_vencidos(db)
    return list(
        db.scalars(
            select(CobroHito)
            .where(CobroHito.proyecto_id == proyecto_id)
            .order_by(CobroHito.fecha_vencimiento)
        ).all()
    )


@router.post("/proyectos/{proyecto_id}/hitos", response_model=HitoOut, status_code=201)
def crear_hito(proyecto_id: int, payload: HitoCreate, db: Session = Depends(get_db)):
    if not db.get(Proyecto, proyecto_id):
        raise HTTPException(404, "Proyecto no encontrado")
    row = CobroHito(proyecto_id=proyecto_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/hitos/{hito_id}", response_model=HitoOut)
def actualizar_hito(hito_id: int, payload: HitoUpdate, db: Session = Depends(get_db)):
    row = db.get(CobroHito, hito_id)
    if not row:
        raise HTTPException(404, "Hito no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/hitos/{hito_id}", status_code=204)
def eliminar_hito(hito_id: int, db: Session = Depends(get_db)):
    row = db.get(CobroHito, hito_id)
    if not row:
        raise HTTPException(404, "Hito no encontrado")
    if row.estado == "cobrado":
        raise HTTPException(400, "No se puede eliminar un hito ya cobrado")
    db.delete(row)
    db.commit()


@router.post("/hitos/{hito_id}/liquidar", response_model=LiquidarHitoResponse)
def liquidar_hito(
    hito_id: int,
    payload: LiquidarHitoRequest,
    db: Session = Depends(get_db),
):
    try:
        return liquidar_hito_cobro(db, hito_id, payload)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
