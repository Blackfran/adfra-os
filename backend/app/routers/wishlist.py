from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WishlistItem
from app.schemas.common import AporteWishlist, WishlistCreate, WishlistOut, WishlistUpdate
from app.services.wishlist import comprar_wishlist, wishlist_to_out

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("", response_model=list[WishlistOut])
def listar(db: Session = Depends(get_db)):
    rows = db.scalars(select(WishlistItem).order_by(WishlistItem.id.desc())).all()
    return [wishlist_to_out(db, r) for r in rows]


@router.post("", response_model=WishlistOut, status_code=201)
def crear(payload: WishlistCreate, db: Session = Depends(get_db)):
    row = WishlistItem(**payload.model_dump())
    if row.monto_ahorrado and row.monto_ahorrado > 0:
        row.estado = "en_ahorro"
    db.add(row)
    db.commit()
    db.refresh(row)
    return wishlist_to_out(db, row)


@router.patch("/{item_id}", response_model=WishlistOut)
def actualizar(item_id: int, payload: WishlistUpdate, db: Session = Depends(get_db)):
    row = db.get(WishlistItem, item_id)
    if not row:
        raise HTTPException(404, "Ítem no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    if row.monto_ahorrado and row.monto_ahorrado > 0 and row.estado == "deseado":
        row.estado = "en_ahorro"
    db.commit()
    db.refresh(row)
    return wishlist_to_out(db, row)


@router.post("/{item_id}/aporte", response_model=WishlistOut)
def aportar(item_id: int, payload: AporteWishlist, db: Session = Depends(get_db)):
    row = db.get(WishlistItem, item_id)
    if not row:
        raise HTTPException(404, "Ítem no encontrado")
    row.monto_ahorrado = (row.monto_ahorrado or 0) + payload.monto
    if row.monto_ahorrado >= row.precio_estimado:
        row.monto_ahorrado = row.precio_estimado
    else:
        row.estado = "en_ahorro"
    db.commit()
    db.refresh(row)
    return wishlist_to_out(db, row)


@router.post("/{item_id}/comprar")
def comprar(item_id: int, db: Session = Depends(get_db)):
    try:
        item, tx_id = comprar_wishlist(db, item_id)
        return {"item": wishlist_to_out(db, item), "transaccion_gasto_id": tx_id}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.delete("/{item_id}", status_code=204)
def eliminar(item_id: int, db: Session = Depends(get_db)):
    row = db.get(WishlistItem, item_id)
    if not row:
        raise HTTPException(404, "Ítem no encontrado")
    db.delete(row)
    db.commit()
