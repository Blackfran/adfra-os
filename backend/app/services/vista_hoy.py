from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AgendaEvento, CobroHito, Cuenta, GastoRecurrente, Proyecto, Transaccion
from app.schemas.hoy import (
    AgendaEventoOut,
    BalanceDia,
    BalanceMes,
    HitoPorCobrar,
    Liquidez,
    VistaHoyResponse,
)
from app.services.ops import generar_insights, next_billing_date, recurrente_to_out, to_usd


def _hito_out(h: CobroHito, titulo: str, moneda_id: str) -> HitoPorCobrar:
    return HitoPorCobrar(
        id=h.id,
        concepto=h.concepto,
        monto=h.monto,
        moneda_id=moneda_id,
        fecha_vencimiento=h.fecha_vencimiento,
        proyecto_titulo=titulo,
        estado=h.estado,
    )


def _tx_usd(db: Session, tx: Transaccion) -> Decimal:
    if tx.tasa_cambio and Decimal(tx.tasa_cambio) != 1:
        return Decimal(tx.monto) / Decimal(tx.tasa_cambio)
    return to_usd(db, Decimal(tx.monto), tx.moneda_id)


def obtener_vista_hoy(db: Session, fecha_actual: date | None = None) -> VistaHoyResponse:
    fecha = fecha_actual or date.today()
    day_start = datetime.combine(fecha, time.min)
    day_end = datetime.combine(fecha, time.max)

    eventos = db.scalars(
        select(AgendaEvento)
        .where(AgendaEvento.fecha_inicio >= day_start, AgendaEvento.fecha_inicio <= day_end)
        .order_by(AgendaEvento.fecha_inicio)
    ).all()
    tareas = [e for e in eventos if e.tipo == "tarea" and not e.completado]

    hitos_hoy = db.execute(
        select(CobroHito, Proyecto.titulo, Proyecto.moneda_id)
        .join(Proyecto, Proyecto.id == CobroHito.proyecto_id)
        .where(
            CobroHito.fecha_vencimiento == fecha,
            CobroHito.estado.in_(("pendiente", "vencido")),
        )
    ).all()

    hitos_venc = db.execute(
        select(CobroHito, Proyecto.titulo, Proyecto.moneda_id)
        .join(Proyecto, Proyecto.id == CobroHito.proyecto_id)
        .where(
            CobroHito.fecha_vencimiento < fecha,
            CobroHito.estado.in_(("pendiente", "vencido")),
        )
        .order_by(CobroHito.fecha_vencimiento)
        .limit(10)
    ).all()

    txs_dia = db.scalars(select(Transaccion).where(Transaccion.fecha_transaccion == fecha)).all()
    ingresos = Decimal("0")
    gastos = Decimal("0")
    for tx in txs_dia:
        amount_usd = _tx_usd(db, tx)
        if tx.tipo == "ingreso":
            ingresos += amount_usd
        else:
            gastos += amount_usd

    mes_ini = date(fecha.year, fecha.month, 1)
    txs_mes = db.scalars(
        select(Transaccion).where(
            Transaccion.fecha_transaccion >= mes_ini,
            Transaccion.fecha_transaccion <= fecha,
        )
    ).all()
    mi = Decimal("0")
    mg = Decimal("0")
    for tx in txs_mes:
        amount_usd = _tx_usd(db, tx)
        if tx.tipo == "ingreso":
            mi += amount_usd
        else:
            mg += amount_usd

    cuentas = db.scalars(select(Cuenta).where(Cuenta.activa.is_(True))).all()
    liquidez = sum(to_usd(db, Decimal(c.saldo), c.moneda_id) for c in cuentas)

    recs = db.scalars(select(GastoRecurrente).where(GastoRecurrente.activo.is_(True))).all()
    prox_recs = []
    for r in recs:
        if not r.proximo_pago:
            r.proximo_pago = next_billing_date(r.dia_cobro, fecha)
        if r.proximo_pago and 0 <= (r.proximo_pago - fecha).days <= 7:
            prox_recs.append(recurrente_to_out(r))
    if prox_recs:
        db.commit()

    por_cobrar = db.scalar(
        select(func.coalesce(func.sum(CobroHito.monto), 0)).where(
            CobroHito.estado.in_(("pendiente", "vencido"))
        )
    ) or 0

    def agenda_out(e: AgendaEvento) -> AgendaEventoOut:
        return AgendaEventoOut(
            id=e.id,
            titulo=e.titulo,
            tipo=e.tipo,
            prioridad=e.prioridad,
            fecha_inicio=e.fecha_inicio,
            completado=e.completado,
        )

    return VistaHoyResponse(
        fecha=fecha,
        eventos_del_dia=[agenda_out(e) for e in eventos],
        tareas_pendientes=[agenda_out(e) for e in tareas],
        hitos_por_cobrar_hoy=[_hito_out(h, t, m) for h, t, m in hitos_hoy],
        hitos_vencidos=[_hito_out(h, t, m) for h, t, m in hitos_venc],
        balance_dia=BalanceDia(ingresos=ingresos, gastos=gastos, neto=ingresos - gastos, moneda="USD"),
        balance_mes=BalanceMes(ingresos=mi, gastos=mg, neto=mi - mg, moneda="USD"),
        liquidez=Liquidez(total_usd=Decimal(liquidez), cuentas_activas=len(cuentas)),
        recurrentes_proximos=sorted(prox_recs, key=lambda x: x.dias_restantes or 0),
        insights=generar_insights(db, fecha),
        por_cobrar_total=Decimal(por_cobrar),
    )
