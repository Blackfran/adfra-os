from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    CategoriaFinanciera,
    CobroHito,
    Cuenta,
    GastoRecurrente,
    Moneda,
    PresupuestoMensual,
    Proyecto,
    Transaccion,
)
from app.schemas.ops import CuentaOut, InsightOut, PresupuestoOut, RecurrenteOut


def _tasa(db: Session, moneda_id: str) -> Decimal:
    m = db.get(Moneda, moneda_id)
    return Decimal(m.tasa_referencia) if m and m.tasa_referencia else Decimal("1")


def to_usd(db: Session, monto: Decimal, moneda_id: str) -> Decimal:
    if moneda_id == "USD":
        return Decimal(monto)
    tasa = _tasa(db, moneda_id)
    # tasa_referencia = units of currency per 1 USD (VES=36.5 means 36.5 VES = 1 USD)
    return Decimal(monto) / tasa if tasa else Decimal(monto)


def cuenta_to_out(db: Session, c: Cuenta) -> CuentaOut:
    return CuentaOut(
        id=c.id,
        nombre=c.nombre,
        tipo=c.tipo,
        moneda_id=c.moneda_id,
        saldo=c.saldo,
        activa=c.activa,
        banco=getattr(c, "banco", None),
        numero_cuenta=getattr(c, "numero_cuenta", None),
        tipo_cuenta=getattr(c, "tipo_cuenta", None),
        titular=getattr(c, "titular", None),
        documento_id=getattr(c, "documento_id", None),
        telefono_pago=getattr(c, "telefono_pago", None),
        email_pago=getattr(c, "email_pago", None),
        notas=c.notas,
        saldo_usd=to_usd(db, Decimal(c.saldo), c.moneda_id),
    )


def next_billing_date(dia: int, from_date: date | None = None) -> date:
    today = from_date or date.today()
    day = min(dia, 28)
    candidate = date(today.year, today.month, day)
    if candidate < today:
        if today.month == 12:
            candidate = date(today.year + 1, 1, day)
        else:
            candidate = date(today.year, today.month + 1, day)
    return candidate


def recurrente_to_out(r: GastoRecurrente) -> RecurrenteOut:
    prox = r.proximo_pago or next_billing_date(r.dia_cobro)
    dias = (prox - date.today()).days
    return RecurrenteOut(
        id=r.id,
        nombre=r.nombre,
        monto=r.monto,
        moneda_id=r.moneda_id,
        categoria_id=r.categoria_id,
        dia_cobro=r.dia_cobro,
        activo=r.activo,
        proximo_pago=prox,
        notas=r.notas,
        dias_restantes=dias,
    )


def listar_presupuestos(db: Session, anio: int, mes: int) -> list[PresupuestoOut]:
    rows = db.scalars(
        select(PresupuestoMensual).where(
            PresupuestoMensual.anio == anio,
            PresupuestoMensual.mes == mes,
        )
    ).all()
    cats = {c.id: c.nombre for c in db.scalars(select(CategoriaFinanciera)).all()}
    start = date(anio, mes, 1)
    end = date(anio, mes, monthrange(anio, mes)[1])

    result: list[PresupuestoOut] = []
    for p in rows:
        q = select(func.coalesce(func.sum(Transaccion.monto), 0)).where(
            Transaccion.tipo == "gasto",
            Transaccion.fecha_transaccion >= start,
            Transaccion.fecha_transaccion <= end,
        )
        if p.categoria_id is None:
            q = q.where(Transaccion.categoria_id.is_(None))
        else:
            q = q.where(Transaccion.categoria_id == p.categoria_id)
        gastado = Decimal(db.scalar(q) or 0)
        limite = Decimal(p.limite)
        pct = float((gastado / limite) * 100) if limite else 0
        result.append(
            PresupuestoOut(
                id=p.id,
                anio=p.anio,
                mes=p.mes,
                categoria_id=p.categoria_id,
                categoria_nombre=cats.get(p.categoria_id, "General") if p.categoria_id else "General",
                limite=limite,
                gastado=gastado,
                restante=limite - gastado,
                porcentaje=round(pct, 1),
                moneda_id=p.moneda_id,
            )
        )
    return sorted(result, key=lambda x: x.porcentaje, reverse=True)


def generar_insights(db: Session, fecha: date | None = None) -> list[InsightOut]:
    hoy = fecha or date.today()
    insights: list[InsightOut] = []

    vencidos = db.execute(
        select(CobroHito, Proyecto.titulo)
        .join(Proyecto, Proyecto.id == CobroHito.proyecto_id)
        .where(CobroHito.estado.in_(("pendiente", "vencido")), CobroHito.fecha_vencimiento < hoy)
    ).all()
    if vencidos:
        total = sum(Decimal(h.monto) for h, _ in vencidos)
        insights.append(
            InsightOut(
                codigo="cxc_vencido",
                severidad="critico",
                titulo=f"{len(vencidos)} cobro(s) atrasado(s)",
                detalle=f"Tienes ~{total} pendiente de clientes. Prioriza seguimiento hoy.",
                accion_url="/proyectos",
            )
        )

    prox_7 = hoy + timedelta(days=7)
    por_vencer = db.execute(
        select(CobroHito, Proyecto.titulo)
        .join(Proyecto, Proyecto.id == CobroHito.proyecto_id)
        .where(
            CobroHito.estado == "pendiente",
            CobroHito.fecha_vencimiento >= hoy,
            CobroHito.fecha_vencimiento <= prox_7,
        )
    ).all()
    if por_vencer:
        insights.append(
            InsightOut(
                codigo="cxc_semana",
                severidad="aviso",
                titulo=f"{len(por_vencer)} cobro(s) esta semana",
                detalle="Prepáralos para no perder flujo de caja.",
                accion_url="/proyectos",
            )
        )

    recs = db.scalars(select(GastoRecurrente).where(GastoRecurrente.activo.is_(True))).all()
    due_soon = []
    for r in recs:
        prox = r.proximo_pago or next_billing_date(r.dia_cobro, hoy)
        if 0 <= (prox - hoy).days <= 3:
            due_soon.append(r)
    if due_soon:
        total = sum(to_usd(db, Decimal(r.monto), r.moneda_id) for r in due_soon)
        insights.append(
            InsightOut(
                codigo="fijos_proximos",
                severidad="aviso",
                titulo=f"{len(due_soon)} gasto(s) fijo(s) en ≤3 días",
                detalle=f"Reserva ~{total:.2f} USD para no quedarte corto.",
                accion_url="/recurrentes",
            )
        )

    start = date(hoy.year, hoy.month, 1)
    gastos_mes = db.scalar(
        select(func.coalesce(func.sum(Transaccion.monto), 0)).where(
            Transaccion.tipo == "gasto",
            Transaccion.fecha_transaccion >= start,
            Transaccion.fecha_transaccion <= hoy,
        )
    ) or 0
    ingresos_mes = db.scalar(
        select(func.coalesce(func.sum(Transaccion.monto), 0)).where(
            Transaccion.tipo == "ingreso",
            Transaccion.fecha_transaccion >= start,
            Transaccion.fecha_transaccion <= hoy,
        )
    ) or 0
    if Decimal(gastos_mes) > Decimal(ingresos_mes) and Decimal(ingresos_mes) > 0:
        insights.append(
            InsightOut(
                codigo="mes_negativo",
                severidad="critico",
                titulo="Este mes vas en rojo",
                detalle=f"Gastos {Decimal(gastos_mes):.2f} vs ingresos {Decimal(ingresos_mes):.2f}. Revisa categorías.",
                accion_url="/finanzas",
            )
        )

    budgets = listar_presupuestos(db, hoy.year, hoy.month)
    over = [b for b in budgets if b.porcentaje >= 90]
    for b in over[:3]:
        insights.append(
            InsightOut(
                codigo="presupuesto",
                severidad="critico" if b.porcentaje >= 100 else "aviso",
                titulo=f"Presupuesto {b.categoria_nombre}: {b.porcentaje}%",
                detalle=f"Gastado {b.gastado} de {b.limite}.",
                accion_url="/finanzas",
            )
        )

    saldos = db.scalars(select(Cuenta).where(Cuenta.activa.is_(True))).all()
    total_usd = sum(to_usd(db, Decimal(c.saldo), c.moneda_id) for c in saldos)
    if saldos and total_usd < 50:
        insights.append(
            InsightOut(
                codigo="liquidez_baja",
                severidad="aviso",
                titulo="Liquidez baja",
                detalle=f"Saldo consolidado ~{total_usd:.2f} USD en tus cuentas.",
                accion_url="/cuentas",
            )
        )

    if not insights:
        insights.append(
            InsightOut(
                codigo="ok",
                severidad="info",
                titulo="Día en orden",
                detalle="Sin alertas críticas. Buen momento para avanzar tareas o aportar a wishlist.",
                accion_url="/",
            )
        )
    return insights


def pagar_recurrente(db: Session, recurrente_id: int, cuenta_id: int | None = None) -> dict:
    from app.schemas.finance import TransaccionCreate
    from app.services.finance import registrar_transaccion

    r = db.get(GastoRecurrente, recurrente_id)
    if not r:
        raise ValueError("Recurrente no encontrado")

    tx = registrar_transaccion(
        db,
        TransaccionCreate(
            tipo="gasto",
            categoria_id=r.categoria_id,
            monto=r.monto,
            moneda_id=r.moneda_id,
            nota=f"Gasto fijo: {r.nombre}",
            fecha_transaccion=date.today(),
            metodo_pago="Recurrente",
        ),
    )

    if cuenta_id:
        cuenta = db.get(Cuenta, cuenta_id)
        if cuenta and cuenta.moneda_id == r.moneda_id:
            cuenta.saldo = Decimal(cuenta.saldo) - Decimal(r.monto)
            db.commit()

    r.proximo_pago = next_billing_date(r.dia_cobro, date.today() + timedelta(days=1))
    db.commit()
    db.refresh(r)
    return {"transaccion_id": tx.id, "recurrente": recurrente_to_out(r)}
