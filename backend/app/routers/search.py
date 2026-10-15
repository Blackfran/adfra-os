from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AgendaEvento, BitacoraNota, Proyecto, Transaccion
from app.schemas.common import SearchHit, SearchResponse

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
def buscar(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    like = f"%{q}%"
    results: list[SearchHit] = []

    for p in db.scalars(select(Proyecto).where(Proyecto.titulo.ilike(like)).limit(10)).all():
        results.append(SearchHit(entity="proyecto", id=p.id, titulo=p.titulo, detalle=p.estado))

    for t in db.scalars(
        select(Transaccion)
        .where(or_(Transaccion.nota.ilike(like), Transaccion.comprobante_ref.ilike(like)))
        .limit(10)
    ).all():
        results.append(
            SearchHit(
                entity="transaccion",
                id=t.id,
                titulo=f"{t.tipo} {t.monto} {t.moneda_id}",
                detalle=t.nota,
            )
        )

    for n in db.scalars(
        select(BitacoraNota)
        .where(
            or_(
                BitacoraNota.titulo.ilike(like),
                BitacoraNota.contenido.ilike(like),
                BitacoraNota.etiquetas.ilike(like),
            )
        )
        .limit(10)
    ).all():
        results.append(
            SearchHit(
                entity="nota",
                id=n.id,
                titulo=n.titulo or n.contenido[:60],
                detalle=n.etiquetas,
            )
        )

    for e in db.scalars(select(AgendaEvento).where(AgendaEvento.titulo.ilike(like)).limit(10)).all():
        results.append(SearchHit(entity="agenda", id=e.id, titulo=e.titulo, detalle=e.tipo))

    return SearchResponse(results=results)
