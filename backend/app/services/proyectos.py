from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import CobroHito, Proyecto, Transaccion
from app.schemas.common import (
    HitoOut,
    LiquidarHitoRequest,
    LiquidarHitoResponse,
    ProyectoOut,
)
from app.schemas.finance import TransaccionCreate
from app.services.finance import registrar_transaccion


def proyecto_to_out(db: Session, p: Proyecto, cliente_nombre: str | None = None) -> ProyectoOut:
    cobrado = db.scalar(
        select(func.coalesce(func.sum(CobroHito.monto), 0)).where(
            CobroHito.proyecto_id == p.id,
            CobroHito.estado == "cobrado",
        )
    ) or Decimal("0")
    presupuesto = Decimal(p.presupuesto_total)
    return ProyectoOut(
        id=p.id,
        cliente_id=p.cliente_id,
        titulo=p.titulo,
        descripcion=p.descripcion,
        estado=p.estado,
        moneda_id=p.moneda_id,
        presupuesto_total=presupuesto,
        fecha_inicio=p.fecha_inicio,
        fecha_limite=p.fecha_limite,
        creado_el=p.creado_el,
        cobrado=Decimal(cobrado),
        pendiente=presupuesto - Decimal(cobrado),
        cliente_nombre=cliente_nombre,
    )


def liquidar_hito_cobro(
    db: Session,
    hito_id: int,
    data: LiquidarHitoRequest,
) -> LiquidarHitoResponse:
    hito = db.get(CobroHito, hito_id)
    if not hito:
        raise ValueError("Hito no encontrado")
    if hito.estado == "cobrado":
        raise ValueError("El hito ya está cobrado")

    proyecto = db.get(Proyecto, hito.proyecto_id)
    if not proyecto:
        raise ValueError("Proyecto no encontrado")

    fecha = data.fecha_pago or date.today()
    hito.estado = "cobrado"
    hito.fecha_pago = fecha

    tx = registrar_transaccion(
        db,
        TransaccionCreate(
            tipo="ingreso",
            proyecto_id=proyecto.id,
            hito_id=hito.id,
            monto=hito.monto,
            moneda_id=proyecto.moneda_id,
            tasa_cambio=data.tasa_cambio,
            metodo_pago=data.metodo_pago,
            comprobante_ref=data.comprobante_ref,
            nota=f"Cobro hito: {hito.concepto}",
            fecha_transaccion=fecha,
        ),
    )

    db.refresh(hito)
    return LiquidarHitoResponse(
        hito_actualizado=HitoOut.model_validate(hito),
        transaccion_ingreso_id=tx.id,
    )


def marcar_hitos_vencidos(db: Session) -> int:
    hoy = date.today()
    rows = db.scalars(
        select(CobroHito).where(
            CobroHito.estado == "pendiente",
            CobroHito.fecha_vencimiento < hoy,
        )
    ).all()
    for h in rows:
        h.estado = "vencido"
    if rows:
        db.commit()
    return len(rows)
