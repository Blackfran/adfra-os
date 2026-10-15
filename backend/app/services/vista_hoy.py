from datetime import date, datetime, time

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AgendaEvento, CobroHito, Proyecto, Transaccion
from app.schemas.hoy import (
    AgendaEventoOut,
    BalanceDia,
    HitoPorCobrar,
    VistaHoyResponse,
)


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

    hitos_q = (
        select(CobroHito, Proyecto.titulo, Proyecto.moneda_id)
        .join(Proyecto, Proyecto.id == CobroHito.proyecto_id)
        .where(
            CobroHito.fecha_vencimiento == fecha,
            CobroHito.estado.in_(("pendiente", "vencido")),
        )
    )
    hitos_rows = db.execute(hitos_q).all()

    txs = db.scalars(
        select(Transaccion).where(Transaccion.fecha_transaccion == fecha)
    ).all()

    ingresos = Decimal("0")
    gastos = Decimal("0")
    for tx in txs:
        amount_usd = Decimal(tx.monto) / Decimal(tx.tasa_cambio or 1)
        if tx.tipo == "ingreso":
            ingresos += amount_usd
        else:
            gastos += amount_usd

    return VistaHoyResponse(
        fecha=fecha,
        eventos_del_dia=[
            AgendaEventoOut(
                id=e.id,
                titulo=e.titulo,
                tipo=e.tipo,
                prioridad=e.prioridad,
                fecha_inicio=e.fecha_inicio,
                completado=e.completado,
            )
            for e in eventos
        ],
        tareas_pendientes=[
            AgendaEventoOut(
                id=e.id,
                titulo=e.titulo,
                tipo=e.tipo,
                prioridad=e.prioridad,
                fecha_inicio=e.fecha_inicio,
                completado=e.completado,
            )
            for e in tareas
        ],
        hitos_por_cobrar_hoy=[
            HitoPorCobrar(
                id=h.id,
                concepto=h.concepto,
                monto=h.monto,
                moneda_id=moneda_id,
                fecha_vencimiento=h.fecha_vencimiento,
                proyecto_titulo=titulo,
                estado=h.estado,
            )
            for h, titulo, moneda_id in hitos_rows
        ],
        balance_dia=BalanceDia(
            ingresos=ingresos,
            gastos=gastos,
            neto=ingresos - gastos,
            moneda="USD",
        ),
    )
