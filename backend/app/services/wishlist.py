from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Transaccion, WishlistItem
from app.schemas.common import WishlistOut


def _ahorro_mensual_promedio(db: Session) -> Decimal:
    """Rough monthly surplus: incomes - expenses over last 90 days / 3."""
    from datetime import date, timedelta

    fin = date.today()
    inicio = fin - timedelta(days=90)
    rows = db.scalars(
        select(Transaccion).where(
            Transaccion.fecha_transaccion >= inicio,
            Transaccion.fecha_transaccion <= fin,
        )
    ).all()
    ingresos = Decimal("0")
    gastos = Decimal("0")
    for r in rows:
        usd = Decimal(r.monto) / Decimal(r.tasa_cambio or 1)
        if r.tipo == "ingreso":
            ingresos += usd
        else:
            gastos += usd
    neto = ingresos - gastos
    return max(neto / Decimal("3"), Decimal("0"))


def wishlist_to_out(db: Session, item: WishlistItem) -> WishlistOut:
    precio = Decimal(item.precio_estimado) or Decimal("1")
    ahorrado = Decimal(item.monto_ahorrado)
    pct = float(min(ahorrado / precio, Decimal("1")) * 100)
    restante = max(precio - ahorrado, Decimal("0"))
    mensual = _ahorro_mensual_promedio(db)
    meses = float(restante / mensual) if mensual > 0 and restante > 0 else None
    return WishlistOut(
        id=item.id,
        titulo=item.titulo,
        precio_estimado=precio,
        moneda_id=item.moneda_id,
        monto_ahorrado=ahorrado,
        prioridad=item.prioridad,
        enlace_compra=item.enlace_compra,
        estado=item.estado,
        fecha_objetivo=item.fecha_objetivo,
        progreso_pct=round(pct, 1),
        meses_estimados=round(meses, 1) if meses is not None else None,
    )


def comprar_wishlist(db: Session, item_id: int) -> tuple[WishlistItem, int]:
    from datetime import date

    from app.schemas.finance import TransaccionCreate
    from app.services.finance import registrar_transaccion

    item = db.get(WishlistItem, item_id)
    if not item:
        raise ValueError("Ítem no encontrado")

    tx = registrar_transaccion(
        db,
        TransaccionCreate(
            tipo="gasto",
            monto=item.precio_estimado,
            moneda_id=item.moneda_id,
            nota=f"Compra wishlist: {item.titulo}",
            fecha_transaccion=date.today(),
            metodo_pago="Wishlist",
        ),
    )
    item.estado = "comprado"
    item.monto_ahorrado = item.precio_estimado
    db.commit()
    db.refresh(item)
    return item, tx.id
