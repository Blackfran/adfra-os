from calendar import monthrange
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    CobroHito,
    Cuenta,
    GastoRecurrente,
    IngresoRecurrente,
    Proyecto,
    Transaccion,
)
from app.schemas.ops import ReporteMensual
from app.services.finance import desglose_gastos
from app.services.ops import to_usd


def reporte_mensual(db: Session, anio: int, mes: int) -> ReporteMensual:
    start = date(anio, mes, 1)
    end = date(anio, mes, monthrange(anio, mes)[1])

    txs = db.scalars(
        select(Transaccion).where(
            Transaccion.fecha_transaccion >= start,
            Transaccion.fecha_transaccion <= end,
        )
    ).all()

    ingresos = Decimal("0")
    gastos = Decimal("0")
    cobros_proyectos = Decimal("0")
    ingresos_fijos_reg = Decimal("0")
    gastos_fijos_reg = Decimal("0")
    cobros_detalle: list[dict] = []

    for tx in txs:
        usd = Decimal(tx.monto) / Decimal(tx.tasa_cambio or 1)
        if tx.moneda_id != "USD" and (not tx.tasa_cambio or Decimal(tx.tasa_cambio) == 1):
            usd = to_usd(db, Decimal(tx.monto), tx.moneda_id)

        if tx.tipo == "ingreso":
            ingresos += usd
            if tx.hito_id:
                cobros_proyectos += usd
                hito = db.get(CobroHito, tx.hito_id)
                proy = db.get(Proyecto, tx.proyecto_id) if tx.proyecto_id else None
                cobros_detalle.append(
                    {
                        "transaccion_id": tx.id,
                        "concepto": hito.concepto if hito else (tx.nota or "Cobro"),
                        "proyecto": proy.titulo if proy else None,
                        "monto_usd": float(usd),
                        "fecha": tx.fecha_transaccion.isoformat(),
                    }
                )
            elif tx.metodo_pago == "Ingreso fijo" or (tx.nota and tx.nota.startswith("Ingreso fijo:")):
                ingresos_fijos_reg += usd
        else:
            gastos += usd
            if tx.metodo_pago == "Recurrente" or (tx.nota and tx.nota.startswith("Gasto fijo:")):
                gastos_fijos_reg += usd

    ingresos_variables = ingresos - cobros_proyectos - ingresos_fijos_reg
    gastos_variables = gastos - gastos_fijos_reg

    prog_ing = sum(
        (to_usd(db, Decimal(r.monto), r.moneda_id) for r in db.scalars(
            select(IngresoRecurrente).where(IngresoRecurrente.activo.is_(True))
        ).all()),
        Decimal("0"),
    )
    prog_gas = sum(
        (to_usd(db, Decimal(r.monto), r.moneda_id) for r in db.scalars(
            select(GastoRecurrente).where(GastoRecurrente.activo.is_(True))
        ).all()),
        Decimal("0"),
    )

    from sqlalchemy import func

    por_cobrar_total = db.scalar(
        select(func.coalesce(func.sum(CobroHito.monto), 0)).where(
            CobroHito.estado.in_(("pendiente", "vencido"))
        )
    ) or 0

    liquidez = sum(
        (to_usd(db, Decimal(c.saldo), c.moneda_id) for c in db.scalars(
            select(Cuenta).where(Cuenta.activa.is_(True))
        ).all()),
        Decimal("0"),
    )

    neto = ingresos - gastos
    desglose = [
        {"nombre": d.nombre, "total": float(d.total), "porcentaje": d.porcentaje}
        for d in desglose_gastos(db, start, end)
    ]

    if neto >= 0:
        resumen = (
            f"En {mes:02d}/{anio} cobraste {ingresos:.2f} USD y gastaste {gastos:.2f} USD. "
            f"Te quedaron {neto:.2f} USD. De eso, {cobros_proyectos:.2f} USD vinieron de proyectos."
        )
    else:
        resumen = (
            f"En {mes:02d}/{anio} gastaste {gastos:.2f} USD e ingresaron {ingresos:.2f} USD. "
            f"Quedaste en rojo por {abs(neto):.2f} USD. Revisa gastos variables y cobros pendientes."
        )

    return ReporteMensual(
        anio=anio,
        mes=mes,
        ingresos_totales=ingresos,
        gastos_totales=gastos,
        balance_neto=neto,
        cobros_proyectos=cobros_proyectos,
        ingresos_fijos_registrados=ingresos_fijos_reg,
        ingresos_variables=max(ingresos_variables, Decimal("0")),
        gastos_fijos_registrados=gastos_fijos_reg,
        gastos_variables=max(gastos_variables, Decimal("0")),
        ingresos_fijos_programados=prog_ing,
        gastos_fijos_programados=prog_gas,
        por_cobrar_pendiente=Decimal(por_cobrar_total),
        liquidez_actual=liquidez,
        desglose_gastos=desglose,
        cobros_detalle=cobros_detalle,
        resumen=resumen,
    )
