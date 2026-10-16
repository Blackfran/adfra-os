from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BorradorWhatsApp

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


class BorradorIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=150)
    subtitulo: str | None = Field(default=None, max_length=200)
    cuerpo: str = Field(min_length=1, max_length=8000)
    telefono: str | None = Field(default=None, max_length=30)


class BorradorUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=150)
    subtitulo: str | None = Field(default=None, max_length=200)
    cuerpo: str | None = Field(default=None, min_length=1, max_length=8000)
    telefono: str | None = Field(default=None, max_length=30)


class BorradorOut(BaseModel):
    id: int
    titulo: str
    subtitulo: str | None
    cuerpo: str
    telefono: str | None
    mensaje_final: str
    creado_el: datetime | None = None
    actualizado_el: datetime | None = None


def _mensaje_final(titulo: str, subtitulo: str | None, cuerpo: str) -> str:
    parts: list[str] = []
    if titulo.strip():
        parts.append(f"*{titulo.strip()}*")
    if subtitulo and subtitulo.strip():
        parts.append(f"_{subtitulo.strip()}_")
    if cuerpo.strip():
        parts.append(cuerpo.strip())
    return "\n\n".join(parts)


def _to_out(row: BorradorWhatsApp) -> BorradorOut:
    return BorradorOut(
        id=row.id,
        titulo=row.titulo,
        subtitulo=row.subtitulo,
        cuerpo=row.cuerpo,
        telefono=row.telefono,
        mensaje_final=_mensaje_final(row.titulo, row.subtitulo, row.cuerpo),
        creado_el=row.creado_el,
        actualizado_el=row.actualizado_el,
    )


@router.get("", response_model=list[BorradorOut])
def listar(db: Session = Depends(get_db)):
    rows = db.scalars(select(BorradorWhatsApp).order_by(BorradorWhatsApp.actualizado_el.desc())).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=BorradorOut, status_code=201)
def crear(payload: BorradorIn, db: Session = Depends(get_db)):
    row = BorradorWhatsApp(
        titulo=payload.titulo.strip(),
        subtitulo=(payload.subtitulo or "").strip() or None,
        cuerpo=payload.cuerpo.strip(),
        telefono=(payload.telefono or "").strip() or None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.patch("/{item_id}", response_model=BorradorOut)
def actualizar(item_id: int, payload: BorradorUpdate, db: Session = Depends(get_db)):
    row = db.get(BorradorWhatsApp, item_id)
    if not row:
        raise HTTPException(404, "Borrador no encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        if isinstance(v, str):
            v = v.strip() or None
            if k in ("titulo", "cuerpo") and not v:
                raise HTTPException(400, f"{k} no puede estar vacío")
        setattr(row, k, v)
    row.actualizado_el = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.delete("/{item_id}", status_code=204)
def eliminar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(BorradorWhatsApp, item_id)
    if not row:
        raise HTTPException(404, "Borrador no encontrado")
    db.delete(row)
    db.commit()
