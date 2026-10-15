from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    AgendaEvento,
    CategoriaFinanciera,
    Cliente,
    CobroHito,
    Moneda,
    Proyecto,
    Transaccion,
)


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(Moneda).limit(1)):
        return

    monedas = [
        Moneda(id="USD", nombre="Dólar estadounidense", simbolo="$", tasa_referencia=Decimal("1")),
        Moneda(id="VES", nombre="Bolívar digital", simbolo="Bs", tasa_referencia=Decimal("36.5")),
        Moneda(id="EUR", nombre="Euro", simbolo="€", tasa_referencia=Decimal("0.92")),
    ]
    db.add_all(monedas)

    categorias = [
        CategoriaFinanciera(nombre="Freelance", tipo="ingreso", icono="briefcase"),
        CategoriaFinanciera(nombre="Salario", tipo="ingreso", icono="wallet"),
        CategoriaFinanciera(nombre="Alimentación", tipo="gasto", icono="utensils"),
        CategoriaFinanciera(nombre="Servicios", tipo="gasto", icono="bolt"),
        CategoriaFinanciera(nombre="Hardware", tipo="gasto", icono="cpu"),
        CategoriaFinanciera(nombre="Transporte", tipo="gasto", icono="car"),
        CategoriaFinanciera(nombre="Software", tipo="gasto", icono="code"),
    ]
    db.add_all(categorias)
    db.flush()

    cliente = Cliente(
        nombre="Ana Rivera",
        empresa="Nova Digital",
        email="ana@novadigital.com",
        telefono="+58 412-0000000",
        notas="Cliente recurrente — branding y web",
    )
    db.add(cliente)
    db.flush()

    proyecto = Proyecto(
        cliente_id=cliente.id,
        titulo="Rediseño web Nova",
        descripcion="Sitio corporativo + CMS",
        estado="en_proceso",
        moneda_id="USD",
        presupuesto_total=Decimal("2400.00"),
        fecha_inicio=date.today() - timedelta(days=14),
        fecha_limite=date.today() + timedelta(days=30),
    )
    db.add(proyecto)
    db.flush()

    hito = CobroHito(
        proyecto_id=proyecto.id,
        concepto="Anticipo 50%",
        monto=Decimal("1200.00"),
        fecha_vencimiento=date.today(),
        estado="pendiente",
    )
    db.add(hito)

    hoy = date.today()
    db.add_all(
        [
            Transaccion(
                uuid_sync="seed-ingreso-1",
                tipo="ingreso",
                categoria_id=categorias[0].id,
                proyecto_id=proyecto.id,
                monto=Decimal("450.00"),
                moneda_id="USD",
                tasa_cambio=Decimal("1"),
                metodo_pago="Transferencia",
                nota="Pago parcial fase 1",
                fecha_transaccion=hoy,
            ),
            Transaccion(
                uuid_sync="seed-gasto-1",
                tipo="gasto",
                categoria_id=categorias[2].id,
                monto=Decimal("28.50"),
                moneda_id="USD",
                tasa_cambio=Decimal("1"),
                metodo_pago="Efectivo",
                nota="Almuerzo trabajo",
                fecha_transaccion=hoy,
            ),
            AgendaEvento(
                proyecto_id=proyecto.id,
                titulo="Call de avance con Ana",
                tipo="reunion",
                prioridad="alta",
                fecha_inicio=datetime.combine(hoy, datetime.min.time()).replace(hour=10, minute=0),
                fecha_fin=datetime.combine(hoy, datetime.min.time()).replace(hour=10, minute=45),
            ),
            AgendaEvento(
                proyecto_id=proyecto.id,
                titulo="Entregar mockups homepage",
                tipo="tarea",
                prioridad="alta",
                fecha_inicio=datetime.combine(hoy, datetime.min.time()).replace(hour=14, minute=0),
                completado=False,
            ),
            AgendaEvento(
                titulo="Revisar tasa BCV",
                tipo="recordatorio_pago",
                prioridad="media",
                fecha_inicio=datetime.combine(hoy, datetime.min.time()).replace(hour=9, minute=0),
            ),
        ]
    )
    db.commit()
