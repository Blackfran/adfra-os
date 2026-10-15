from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CategoriaFinanciera, Moneda, Transaccion
from app.schemas.common import DesgloseCategoria
from app.schemas.finance import FlujoCajaResponse, TransaccionCreate, TransaccionResponse


def registrar_transaccion(db: Session, data: TransaccionCreate) -> TransaccionResponse:
    if data.uuid_sync:
        existing = db.scalar(
            select(Transaccion).where(Transaccion.uuid_sync == data.uuid_sync)
        )
        if existing:
            return TransaccionResponse.model_validate(existing)

    tx = Transaccion(**data.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransaccionResponse.model_validate(tx)


def _to_base(monto: Decimal, tasa: Decimal, moneda: str, target: str, tasas: dict[str, Decimal]) -> Decimal:
    """Convert amount to consolidated currency using stored/historical rates (USD pivot)."""
    if moneda == target:
        return monto
    usd = monto / tasa if tasa else monto
    if target == "USD":
        return usd
    target_rate = tasas.get(target, Decimal("1"))
    return usd * target_rate


def calcular_flujo_caja(
    db: Session,
    fecha_inicio: date,
    fecha_fin: date,
    moneda_consolidada: str = "USD",
) -> FlujoCajaResponse:
    monedas = db.scalars(select(Moneda)).all()
    tasas = {m.id: Decimal(m.tasa_referencia) for m in monedas}

    rows = db.scalars(
        select(Transaccion).where(
            Transaccion.fecha_transaccion >= fecha_inicio,
            Transaccion.fecha_transaccion <= fecha_fin,
        )
    ).all()

    ingresos = Decimal("0")
    gastos = Decimal("0")
    desglose: dict[str, dict[str, Decimal]] = {}

    for row in rows:
        bucket = desglose.setdefault(
            row.moneda_id,
            {"ingresos": Decimal("0"), "gastos": Decimal("0")},
        )
        converted = _to_base(
            Decimal(row.monto),
            Decimal(row.tasa_cambio or 1),
            row.moneda_id,
            moneda_consolidada,
            tasas,
        )
        if row.tipo == "ingreso":
            ingresos += converted
            bucket["ingresos"] += Decimal(row.monto)
        else:
            gastos += converted
            bucket["gastos"] += Decimal(row.monto)

    return FlujoCajaResponse(
        ingresos_totales=ingresos,
        gastos_totales=gastos,
        balance_neto=ingresos - gastos,
        desglose_monedas=desglose,
        moneda_consolidada=moneda_consolidada,
    )


def desglose_gastos(
    db: Session,
    fecha_inicio: date,
    fecha_fin: date,
) -> list[DesgloseCategoria]:
    rows = db.scalars(
        select(Transaccion).where(
            Transaccion.tipo == "gasto",
            Transaccion.fecha_transaccion >= fecha_inicio,
            Transaccion.fecha_transaccion <= fecha_fin,
        )
    ).all()
    totals: dict[int | None, Decimal] = {}
    for row in rows:
        key = row.categoria_id
        totals[key] = totals.get(key, Decimal("0")) + Decimal(row.monto)

    grand = sum(totals.values(), Decimal("0")) or Decimal("1")
    cats = {c.id: c.nombre for c in db.scalars(select(CategoriaFinanciera)).all()}
    result: list[DesgloseCategoria] = []
    for cat_id, total in sorted(totals.items(), key=lambda x: x[1], reverse=True):
        result.append(
            DesgloseCategoria(
                categoria_id=cat_id,
                nombre=cats.get(cat_id, "Sin categoría") if cat_id else "Sin categoría",
                total=total,
                porcentaje=float((total / grand) * 100),
            )
        )
    return result


def listar_transacciones(
    db: Session,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    tipo: str | None = None,
    limit: int = 100,
) -> list[Transaccion]:
    q = select(Transaccion).order_by(Transaccion.fecha_transaccion.desc(), Transaccion.id.desc())
    if fecha_inicio:
        q = q.where(Transaccion.fecha_transaccion >= fecha_inicio)
    if fecha_fin:
        q = q.where(Transaccion.fecha_transaccion <= fecha_fin)
    if tipo:
        q = q.where(Transaccion.tipo == tipo)
    return list(db.scalars(q.limit(limit)).all())

